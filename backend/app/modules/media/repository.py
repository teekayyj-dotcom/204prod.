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
    return media_asset
