from fastapi import APIRouter

from app.modules.media.service import get_media_assets

router = APIRouter(prefix="/media", tags=["media"])


@router.get("")
def list_media_route():
    return get_media_assets()
