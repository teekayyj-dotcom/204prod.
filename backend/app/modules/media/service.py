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
from app.modules.media.schemas import MediaAsset as MediaAssetSchema, MediaFolderCreate, MediaFolderUpdate
from app.modules.media.models import MediaAsset as DbMediaAsset, MediaFolder as DbMediaFolder
from app.modules.media.storage import get_storage_provider


def get_media_assets(db: Session, client_slug: str = None, project_slug: str = None, folder_id: str = None) -> list[DbMediaAsset]:
    query = db.query(DbMediaAsset)
    if client_slug:
        query = query.filter(DbMediaAsset.client_slug == client_slug)
    if project_slug:
        query = query.filter(DbMediaAsset.project_slug == project_slug)
    if folder_id:
        query = query.filter(DbMediaAsset.folder_id == folder_id)
    return query.all()

def get_media_asset_by_id(db: Session, id: str) -> DbMediaAsset | None:
    return db.query(DbMediaAsset).filter(DbMediaAsset.id == id).first()

def create_media_asset(db: Session, media_asset: DbMediaAsset):
    return save_media_asset(db, media_asset)

def get_media_folders(db: Session, client_slug: str | None = None, project_slug: str | None = None) -> list[DbMediaFolder]:
    query = db.query(DbMediaFolder)
    if client_slug:
        query = query.filter(DbMediaFolder.client_slug == client_slug)
    if project_slug:
        query = query.filter(DbMediaFolder.project_slug == project_slug)
    return query.all()

def create_media_folder(db: Session, folder: MediaFolderCreate) -> DbMediaFolder:
    folder_id = str(uuid.uuid4())
    db_folder = DbMediaFolder(
        id=folder_id,
        name=folder.name,
        client_slug=folder.client_slug,
        project_slug=folder.project_slug,
        parent_id=folder.parent_id,
        is_published=folder.is_published,
    )
    db.add(db_folder)
    db.commit()
    db.refresh(db_folder)
    return db_folder

def update_media_folder(db: Session, folder_id: str, folder_update: MediaFolderUpdate) -> DbMediaFolder | None:
    db_folder = db.query(DbMediaFolder).filter(DbMediaFolder.id == folder_id).first()
    if not db_folder:
        return None
    if folder_update.name is not None:
        db_folder.name = folder_update.name
    if folder_update.parent_id is not None:
        db_folder.parent_id = folder_update.parent_id
    if folder_update.is_published is not None:
        db_folder.is_published = folder_update.is_published
    db.commit()
    db.refresh(db_folder)
    return db_folder

def delete_media_folder(db: Session, folder_id: str) -> bool:
    db_folder = db.query(DbMediaFolder).filter(DbMediaFolder.id == folder_id).first()
    if not db_folder:
        return False
    # Move all assets inside to root (folder_id = None) or delete them? The schema uses ON DELETE SET NULL, so we can just delete the folder.
    db.delete(db_folder)
    db.commit()
    return True

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
        custom_key = f"{clean_folder}/{asset_id}/{filename}"
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
        folder_id=None,
        is_published=False
    )
    
    saved_asset = save_media_asset(db, db_media_asset)

    if folder == "final video" and project_slug:
        from app.modules.projects.models import Project
        project = db.query(Project).filter(Project.slug == project_slug).first()
        if project:
            current_urls = [u for u in (project.video_url or "").split(",") if u.strip()]
            if saved_asset.url not in current_urls:
                current_urls.append(saved_asset.url)
                project.video_url = ",".join(current_urls)
                db.commit()

    return saved_asset


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
        folder_id=None,
        is_published=False,
    )
    saved_asset = save_media_asset(db, db_media_asset)

    if folder in ("project/gallery", "demo") and project_slug:
        from app.modules.projects.models import ProjectGalleryImage
        from sqlalchemy import func
        max_sort = db.query(func.max(ProjectGalleryImage.sort_order)).filter(ProjectGalleryImage.project_slug == project_slug).scalar()
        next_sort = 0 if max_sort is None else max_sort + 1
        gallery_item = ProjectGalleryImage(
            project_slug=project_slug,
            media_asset_id=saved_asset.id,
            caption=caption or alt,
            sort_order=next_sort,
            published=False
        )
        db.add(gallery_item)
        db.commit()
        
        db.commit()
        
    if folder == "final video" and project_slug:
        from app.modules.projects.models import Project
        project = db.query(Project).filter(Project.slug == project_slug).first()
        if project:
            current_urls = [u for u in (project.video_url or "").split(",") if u.strip()]
            if saved_asset.url not in current_urls:
                current_urls.append(saved_asset.url)
                project.video_url = ",".join(current_urls)
                db.commit()
                
    return saved_asset

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
        
    # Clear any project video_url references to this media asset (DEPRECATED - we now prevent deletion)
    try:
        from app.modules.projects.models import Project, ProjectGalleryImage
        from sqlalchemy import or_
        
        conditions = [Project.cover_media_id == media_asset.id]
        if media_asset.url:
            conditions.append(Project.video_url == media_asset.url)
        if media_asset.thumbnail_url:
            conditions.append(Project.video_url == media_asset.thumbnail_url)
            
        projects_with_video = db.query(Project).filter(or_(*conditions)).first()
        
        if projects_with_video:
            raise ValueError(f"Không thể xóa media này vì đang được sử dụng trong dự án '{projects_with_video.title}'")
            
        gallery_usage = db.query(ProjectGalleryImage).filter(ProjectGalleryImage.media_asset_id == media_asset.id).first()
        if gallery_usage:
            if media_asset.folder not in ("project/gallery", "demo", "gallery"):
                db.delete(gallery_usage)
                db.commit()
            else:
                raise ValueError(f"Không thể xóa media này vì đang được sử dụng trong thư viện ảnh của dự án '{gallery_usage.project_slug}'")
            
    except ValueError:
        raise
    except Exception as e:
        print(f"Failed to check project references: {e}")
    
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
