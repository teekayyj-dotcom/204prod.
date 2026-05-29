import io
import os

from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException, Query, status
from fastapi.responses import RedirectResponse, StreamingResponse
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.modules.media.service import (
    get_media_asset_by_id,
    get_media_assets,
    create_media_asset_from_file,
    delete_media_asset,
)

try:
    from PIL import Image as PILImage
    from PIL import ImageOps
except ImportError:
    PILImage = None
    ImageOps = None

router = APIRouter(prefix="/media", tags=["media"])


@router.get("")
def list_media_route(db: Session = Depends(get_db_session)):
    return get_media_assets(db)


@router.post("/upload", status_code=status.HTTP_201_CREATED)
def upload_media_route(
    file: UploadFile = File(...),
    alt: str | None = Form(None),
    caption: str | None = Form(None),
    db: Session = Depends(get_db_session)
):
    try:
        return create_media_asset_from_file(db, file, alt=alt, caption=caption)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )


@router.get("/{id}/proxy")
def media_proxy_route(
    id: str,
    width: int = Query(420, ge=80, le=1200),
    db: Session = Depends(get_db_session),
):
    media_asset = get_media_asset_by_id(db, id)
    if not media_asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media asset not found",
        )

    if media_asset.kind != "image" or PILImage is None:
        return RedirectResponse(media_asset.url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)

    filename = media_asset.url.split("/")[-1]
    uploads_dir = os.path.realpath(
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "uploads")
    )
    image_path = os.path.realpath(os.path.join(uploads_dir, filename))

    if not image_path.startswith(uploads_dir + os.sep) or not os.path.exists(image_path):
        return RedirectResponse(media_asset.url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)

    try:
        with PILImage.open(image_path) as image:
            image = ImageOps.exif_transpose(image)
            image.thumbnail((width, width), PILImage.Resampling.LANCZOS)
            if image.mode not in ("RGB", "RGBA"):
                image = image.convert("RGB")
            output = io.BytesIO()
            image.save(output, format="WEBP", quality=45, method=4)
            output.seek(0)
    except Exception:
        return RedirectResponse(media_asset.url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)

    return StreamingResponse(
        output,
        media_type="image/webp",
        headers={"Cache-Control": "public, max-age=86400"},
    )


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_media_route(id: str, db: Session = Depends(get_db_session)):
    success = delete_media_asset(db, id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media asset not found"
        )
    return None
