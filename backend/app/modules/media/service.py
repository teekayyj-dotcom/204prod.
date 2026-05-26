import uuid
import io
from sqlalchemy.orm import Session
from fastapi import UploadFile

try:
    from PIL import Image as PILImage
except ImportError:
    PILImage = None

from app.modules.media.repository import list_media_assets, save_media_asset
from app.modules.media.schemas import MediaAsset as MediaAssetSchema
from app.modules.media.models import MediaAsset as DbMediaAsset
from app.modules.media.storage import get_storage_provider


def get_media_assets(db: Session) -> list[DbMediaAsset]:
    return list_media_assets(db)

def get_media_asset_by_id(db: Session, id: str) -> DbMediaAsset | None:
    return db.query(DbMediaAsset).filter(DbMediaAsset.id == id).first()

def create_media_asset(db: Session, media_asset: DbMediaAsset):
    return save_media_asset(db, media_asset)

def create_media_asset_from_file(
    db: Session,
    file: UploadFile,
    alt: str | None = None,
    caption: str | None = None
) -> DbMediaAsset:
    # 1. Read file bytes
    file_bytes = file.file.read()
    filename = file.filename or "unnamed"
    mime_type = file.content_type or "application/octet-stream"
    file_size = len(file_bytes)
    
    # Determine kind (image, video, document, design, archive)
    kind = "document"
    if mime_type.startswith("image/"):
        kind = "image"
    elif mime_type.startswith("video/"):
        kind = "video"
    elif "pdf" in mime_type or "word" in mime_type or "text/" in mime_type:
        kind = "document"
    elif "zip" in mime_type or "tar" in mime_type or "rar" in mime_type:
        kind = "archive"
    
    # 2. Get width and height for images if PIL is available
    width = None
    height = None
    if kind == "image" and PILImage is not None:
        try:
            with PILImage.open(io.BytesIO(file_bytes)) as img:
                width, height = img.size
        except Exception as e:
            print(f"Could not parse image dimensions: {e}")
            
    # 3. Call storage provider to upload file and get public URL
    storage_provider = get_storage_provider()
    public_url = storage_provider.upload_file(file_bytes, filename, mime_type)
    
    # 4. Generate unique ID for DbMediaAsset
    asset_id = str(uuid.uuid4())
    
    # 5. Create DbMediaAsset
    db_media_asset = DbMediaAsset(
        id=asset_id,
        kind=kind,
        url=public_url,
        alt=alt,
        caption=caption,
        width=width,
        height=height,
        mime_type=mime_type,
        file_size=file_size,
    )
    
    return save_media_asset(db, db_media_asset)

def update_media_asset(db: Session, id: str, media_asset: MediaAssetSchema):
    existing_media_asset = db.query(DbMediaAsset).filter(DbMediaAsset.id == id).first()
    if not existing_media_asset:
        return None
    existing_media_asset.kind = media_asset.kind
    existing_media_asset.url = media_asset.url
    existing_media_asset.alt = media_asset.alt
    existing_media_asset.caption = media_asset.caption
    existing_media_asset.width = media_asset.width
    existing_media_asset.height = media_asset.height
    existing_media_asset.mime_type = media_asset.mime_type
    existing_media_asset.file_size = media_asset.file_size
    db.commit()
    db.refresh(existing_media_asset)
    return existing_media_asset

def delete_media_asset(db: Session, id: str):
    media_asset = db.query(DbMediaAsset).filter(DbMediaAsset.id == id).first()
    if not media_asset:
        return None
    
    # Delete from physical storage
    try:
        storage_provider = get_storage_provider()
        storage_provider.delete_file(media_asset.url)
    except Exception as e:
        print(f"Could not delete file from storage: {e}")
        
    db.delete(media_asset)
    db.commit()
    return True
