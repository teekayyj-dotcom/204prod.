import secrets
import random

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db_session
from app.modules.projects.schemas import PhotoAlbumCreate, PhotoAlbumResponse, AlbumInteractionCreate, AlbumInteractionResponse
from app.modules.projects.models import Project, PhotoAlbum, AlbumPhoto, AlbumInteraction
from app.services.gdrive import extract_folder_id, fetch_folder_images

@router.post("/{slug}/albums", response_model=PhotoAlbumResponse)
def create_gdrive_album(slug: str, payload: PhotoAlbumCreate, db: Session = Depends(get_db_session)):
    project = db.query(Project).filter(Project.slug == slug).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    folder_id = extract_folder_id(payload.gdrive_folder_id)
    try:
        images = fetch_folder_images(folder_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch from Google Drive: {str(e)}")

    if not images:
        raise HTTPException(status_code=400, detail="No images found in the provided folder")

    # Pick background if not provided
    background = payload.background_url
    if not background:
        random_img = random.choice(images)
        background = random_img.get('webContentUrl') or random_img.get('thumbnailLink')

    album_id = secrets.token_urlsafe(16)
    short_token = secrets.token_urlsafe(8)

    album = PhotoAlbum(
        id=album_id,
        project_slug=slug,
        title=payload.title,
        gdrive_folder_id=folder_id,
        background_url=background,
        short_token=short_token
    )
    db.add(album)
    
    for img in images:
        photo = AlbumPhoto(
            id=img['id'],
            album_id=album_id,
            file_id=img['id'],
            thumbnail_url=img.get('thumbnailLink', ''),
            web_content_url=img.get('webContentUrl', '')
        )
        db.add(photo)

    db.commit()
    db.refresh(album)
    return album

@router.get("/{slug}/albums", response_model=list[PhotoAlbumResponse])
def list_gdrive_albums(slug: str, db: Session = Depends(get_db_session)):
    albums = db.query(PhotoAlbum).filter(PhotoAlbum.project_slug == slug).all()
    return albums

@router.get("/albums/public/{token}", response_model=PhotoAlbumResponse)
def get_public_album(token: str, db: Session = Depends(get_db_session)):
    album = db.query(PhotoAlbum).filter(PhotoAlbum.short_token == token).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    return album

@router.post("/albums/public/{token}/interact", response_model=AlbumInteractionResponse)
def interact_with_album(token: str, photo_id: str, payload: AlbumInteractionCreate, db: Session = Depends(get_db_session)):
    album = db.query(PhotoAlbum).filter(PhotoAlbum.short_token == token).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
        
    photo = db.query(AlbumPhoto).filter(AlbumPhoto.id == photo_id, AlbumPhoto.album_id == album.id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
        
    interaction = AlbumInteraction(
        photo_id=photo_id,
        client_name=payload.client_name,
        interaction_type=payload.interaction_type,
        comment_text=payload.comment_text
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return interaction
