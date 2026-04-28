from app.modules.media.schemas import MediaAsset


MEDIA_ASSETS = [
    MediaAsset(
        id="cover-midnight-textile",
        kind="image",
        url="/projects/midnight-textile/cover.jpg",
        alt="Model in sculptural pose framed by diffused blue light.",
    )
]


def list_media_assets() -> list[MediaAsset]:
    return MEDIA_ASSETS
