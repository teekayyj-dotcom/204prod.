from app.modules.media.repository import list_media_assets
from app.modules.media.schemas import MediaAsset


def get_media_assets() -> list[MediaAsset]:
    return list_media_assets()
