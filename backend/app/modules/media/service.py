import uuid
import io
from sqlalchemy.orm import Session
from fastapi import UploadFile

try:
    # pyrefly: ignore [missing-import]
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
    caption: str | None = None,
    client_slug: str | None = None,
    project_slug: str | None = None,
    folder: str | None = None
) -> DbMediaAsset:
    # Generate unique ID for DbMediaAsset early
    asset_id = str(uuid.uuid4())
    
    # 1. Read file bytes
    file_bytes = file.file.read()
    filename = file.filename or "unnamed"
    mime_type = file.content_type or "application/octet-stream"
    file_size = len(file_bytes)
    
    # Determine if this is an avatar upload (folder starts with avatar)
    is_avatar = folder is not None and folder.startswith("avatar")
    
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
        
    # Convert avatar images to WebP
    if is_avatar and kind == "image" and PILImage is not None:
        try:
            import os
            with PILImage.open(io.BytesIO(file_bytes)) as img:
                if img.mode not in ("RGB", "RGBA"):
                    img = img.convert("RGB")
                output = io.BytesIO()
                img.save(output, format="WEBP", quality=85)
                file_bytes = output.getvalue()
                
                # Keep the same filename but change extension to .webp
                base_name, _ = os.path.splitext(filename)
                filename = f"{base_name}.webp"
                mime_type = "image/webp"
                file_size = len(file_bytes)
        except Exception as e:
            print(f"Failed to convert avatar image to WebP: {e}")
    
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
    custom_key = None
    if is_avatar:
        clean_folder = folder.strip("/")
        custom_key = f"{clean_folder}/{filename}"
    elif client_slug and project_slug and folder:
        clean_folder = folder.strip("/")
        custom_key = f"{client_slug}/{project_slug}/{clean_folder}/{asset_id}/{filename}"
    elif folder:
        clean_folder = folder.strip("/")
        custom_key = f"{clean_folder}/{asset_id}/{filename}"
        
    storage_provider = get_storage_provider()
    public_url = storage_provider.upload_file(file_bytes, filename, mime_type, custom_key=custom_key)
    
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
        client_slug=client_slug,
        project_slug=project_slug,
        folder=folder,
    )
    
    return save_media_asset(db, db_media_asset)


def finalize_media_asset(
    db: Session,
    asset_id: str,
    url: str,
    thumbnail_url: str | None,
    mime_type: str | None,
    file_size: int | None,
    width: int | None = None,
    height: int | None = None,
    alt: str | None = None,
    caption: str | None = None,
    client_slug: str | None = None,
    project_slug: str | None = None,
    folder: str | None = None
) -> DbMediaAsset:
    
    # Determine kind (image, video, document, design, archive)
    kind = "document"
    if mime_type and mime_type.startswith("image/"):
        kind = "image"
    elif mime_type and mime_type.startswith("video/"):
        kind = "video"
    elif mime_type and ("pdf" in mime_type or "word" in mime_type or "text/" in mime_type):
        kind = "document"
    elif mime_type and ("zip" in mime_type or "tar" in mime_type or "rar" in mime_type):
        kind = "archive"
        
    db_media_asset = DbMediaAsset(
        id=asset_id,
        kind=kind,
        url=url,
        thumbnail_url=thumbnail_url,
        alt=alt,
        caption=caption,
        width=width,
        height=height,
        mime_type=mime_type,
        file_size=file_size,
        client_slug=client_slug,
        project_slug=project_slug,
        folder=folder,
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
        
    # Clear any project video_url references to this media asset
    try:
        from app.modules.projects.models import Project
        projects_with_video = db.query(Project).filter(
            (Project.video_url == media_asset.url) | 
            (Project.video_url == media_asset.thumbnail_url)
        ).all()
        for p in projects_with_video:
            p.video_url = None
    except Exception as e:
        print(f"Failed to clear project video_url references: {e}")
    
    # Delete from physical storage (R2 or Local)
    try:
        storage_provider = get_storage_provider()
        if media_asset.url:
            storage_provider.delete_file(media_asset.url)
        if media_asset.thumbnail_url and not media_asset.bunny_video_id:
            storage_provider.delete_file(media_asset.thumbnail_url)
    except Exception as e:
        print(f"Could not delete file from S3/R2 storage: {e}")
        
    # Delete from Bunny Stream
    if media_asset.bunny_video_id:
        try:
            from app.core.config import settings
            library_id = settings.bunny_stream_library_id
            api_key = settings.bunny_stream_api_key
            if library_id and api_key:
                import urllib.request
                import urllib.error
                bunny_url = f"https://video.bunnycdn.com/library/{library_id}/videos/{media_asset.bunny_video_id}"
                req = urllib.request.Request(bunny_url, method="DELETE")
                req.add_header("AccessKey", api_key)
                req.add_header("Accept", "application/json")
                with urllib.request.urlopen(req) as response:
                    print(f"Deleted video {media_asset.bunny_video_id} from Bunny Stream")
        except Exception as e:
            print(f"Could not delete video from Bunny Stream: {e}")
        
    db.delete(media_asset)
    db.commit()
    return True
