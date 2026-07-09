from sqlalchemy import select
from sqlalchemy.orm import Session
from app.modules.media.models import MediaAsset


def list_media_assets(db: Session) -> list[MediaAsset]:
    return db.scalars(select(MediaAsset)).all()

def get_media_asset_by_id(db: Session, id: str):
    return db.query(MediaAsset).filter(MediaAsset.id == id).first()

def save_media_asset(db: Session, media_asset: MediaAsset):
    db.add(media_asset)
    db.commit()
    db.refresh(media_asset)
    
    # Auto-link to project gallery if project_slug is provided and it's a gallery/demo image
    if media_asset.project_slug and media_asset.folder in ("project/gallery", "demo", "gallery"):
        from app.modules.projects.models import ProjectGalleryImage
        from sqlalchemy import func
        
        # Check if already in project gallery
        exists = db.query(ProjectGalleryImage).filter(
            ProjectGalleryImage.project_slug == media_asset.project_slug,
            ProjectGalleryImage.media_asset_id == media_asset.id
        ).first()
        if not exists:
            max_sort = db.query(func.max(ProjectGalleryImage.sort_order)).filter(
                ProjectGalleryImage.project_slug == media_asset.project_slug
            ).scalar() or 0
            
            gallery_img = ProjectGalleryImage(
                project_slug=media_asset.project_slug,
                media_asset_id=media_asset.id,
                sort_order=max_sort + 1,
                is_featured=False
            )
            db.add(gallery_img)
            db.commit()
            
    return media_asset
