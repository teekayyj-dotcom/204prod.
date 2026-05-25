from sqlalchemy.orm import Session

from app.modules.media.repository import list_media_assets
from app.modules.media.schemas import MediaAsset


def get_media_assets(db: Session) -> list[MediaAsset]:
    return list_media_assets(db)

def get_media_asset_by_id(db: Session, id: str):
    return db.query(MediaAsset).filter(MediaAsset.id == id).first()

def create_media_asset(db: Session, media_asset: MediaAsset):
    db.add(media_asset)
    db.commit()
    db.refresh(media_asset)
    return media_asset

def update_media_asset(db: Session, id: str, media_asset: MediaAsset):
    existing_media_asset = db.query(MediaAsset).filter(MediaAsset.id == id).first()
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
    media_asset = db.query(MediaAsset).filter(MediaAsset.id == id).first()
    if not media_asset:
        return None
    db.delete(media_asset)
    db.commit()
    return True
