from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.modules.media.service import get_media_assets

router = APIRouter(prefix="/media", tags=["media"])


@router.get("")
def list_media_route(db: Session = Depends(get_db_session)):
    return get_media_assets(db)
