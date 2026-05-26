from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.modules.media.service import get_media_assets, create_media_asset_from_file, delete_media_asset

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


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_media_route(id: str, db: Session = Depends(get_db_session)):
    success = delete_media_asset(db, id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media asset not found"
        )
    return None
