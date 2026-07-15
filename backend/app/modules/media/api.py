import io
import os
import uuid
import hashlib
import time
import urllib.request
import json

from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException, Query, status, Body
from fastapi.responses import RedirectResponse, StreamingResponse
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.modules.media.service import (
    get_media_asset_by_id,
    get_media_assets,
    create_media_asset_from_file,
    delete_media_asset,
    finalize_media_asset,
)
from app.modules.media.schemas import (
    PresignedUrlRequest, 
    PresignedUrlResponse, 
    MediaFinalizeRequest,
    VideoUploadRequest,
    VideoUploadResponse,
    VideoSaveRequest,
)
from app.modules.media.storage import get_storage_provider
from app.core.config import settings

try:
    # pyrefly: ignore [missing-import]
    from PIL import Image as PILImage
    # pyrefly: ignore [missing-import]
    from PIL import ImageOps
except ImportError:
    PILImage = None
    ImageOps = None

router = APIRouter(prefix="/media", tags=["media"])


@router.get("")
def list_media_route(db: Session = Depends(get_db_session)):
    return get_media_assets(db)


@router.post("/presigned-url", response_model=PresignedUrlResponse)
def get_presigned_url(request: PresignedUrlRequest):
    if request.content_type not in ["image/webp", "image/avif"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only WebP and AVIF formats are supported for direct upload"
        )
        
    storage_provider = get_storage_provider()
    
    asset_id = str(uuid.uuid4())
    ext = ".avif" if request.content_type == "image/avif" else ".webp"
    
    base_name, _ = os.path.splitext(request.filename)
    if not base_name or base_name == "image":
        base_name = asset_id
        
    if request.client_slug and request.project_slug and request.folder:
        clean_folder = request.folder.strip("/")
        main_object_name = f"{request.client_slug}/{request.project_slug}/{clean_folder}/{asset_id}/{base_name} main{ext}"
        thumb_object_name = f"{request.client_slug}/{request.project_slug}/{clean_folder}/{asset_id}/{base_name} thumb{ext}"
    elif request.folder:
        clean_folder = request.folder.strip("/")
        main_object_name = f"{clean_folder}/{asset_id}/{base_name} main{ext}"
        thumb_object_name = f"{clean_folder}/{asset_id}/{base_name} thumb{ext}"
    else:
        main_object_name = f"{request.category}/{asset_id}/{base_name} main{ext}"
        thumb_object_name = f"{request.category}/{asset_id}/{base_name} thumb{ext}"
    
    # Generate presigned PUTs
    # Note: size limits are no longer strictly enforced via presigned POST policy since we use PUT.
    # However, Cloudflare R2 bucket-level rules or WAF rules could enforce this.
    main_presigned = storage_provider.generate_presigned_put(main_object_name, request.content_type, 10485760)
    thumb_presigned = storage_provider.generate_presigned_put(thumb_object_name, request.content_type, 2097152)
    
    if not main_presigned or not thumb_presigned:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate presigned URLs"
        )
        
    public_base_url = storage_provider.public_url
    bucket_name = storage_provider.bucket_name
    
    if settings.r2_public_url:
        main_url = f"{public_base_url}/{main_object_name}"
        thumb_url = f"{public_base_url}/{thumb_object_name}"
    else:
        main_url = f"{public_base_url}/{bucket_name}/{main_object_name}"
        thumb_url = f"{public_base_url}/{bucket_name}/{thumb_object_name}"
        
    return PresignedUrlResponse(
        asset_id=asset_id,
        main_url=main_url,
        thumb_url=thumb_url,
        main_upload_data=main_presigned,
        thumb_upload_data=thumb_presigned
    )


@router.post("/video/request-upload", response_model=VideoUploadResponse)
def request_video_upload(request: VideoUploadRequest):
    library_id = settings.bunny_stream_library_id
    api_key = settings.bunny_stream_api_key
    
    if not library_id or not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Bunny Stream is not configured"
        )
        
    url = f"https://video.bunnycdn.com/library/{library_id}/videos"
    data = json.dumps({"title": request.title or request.filename}).encode("utf-8")
    
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("AccessKey", api_key)
    req.add_header("Content-Type", "application/json")
    req.add_header("Accept", "application/json")
    
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            video_id = res_data.get("guid")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create video on Bunny Stream: {str(e)}"
        )
        
    # Generate signature
    expiration_time = int(time.time()) + 3600  # 1 hour expiration
    string_to_sign = f"{library_id}{api_key}{expiration_time}{video_id}"
    signature = hashlib.sha256(string_to_sign.encode("utf-8")).hexdigest()
    
    return VideoUploadResponse(
        video_id=video_id,
        signature=signature,
        expiration_time=expiration_time,
        library_id=library_id
    )


@router.post("/video/save-to-db", status_code=status.HTTP_201_CREATED)
def save_video_to_db(
    request: VideoSaveRequest,
    db: Session = Depends(get_db_session)
):
    from app.modules.media.models import MediaAsset
    
    # Check if exists
    existing = db.query(MediaAsset).filter(MediaAsset.bunny_video_id == request.video_id).first()
    if existing:
        return existing
        
    asset_id = str(uuid.uuid4())
    # Direct CDN URL for native <video> playback (all controls work)
    cdn_host = settings.bunny_stream_cdn
    direct_url = f"https://{cdn_host}/{request.video_id}/play_1080p.mp4"
    # Embed iframe URL (for preview/background display)
    embed_url = f"https://iframe.mediadelivery.net/embed/{settings.bunny_stream_library_id}/{request.video_id}"
    
    new_asset = MediaAsset(
        id=asset_id,
        kind="video",
        url=direct_url,           # Direct CDN URL as main URL
        thumbnail_url=embed_url,  # Embed URL stored in thumbnail_url for iframe use
        alt=request.title,
        caption=request.title,
        bunny_video_id=request.video_id,
        client_slug=request.client_slug,
        project_slug=request.project_slug,
        folder=request.folder,
    )
    db.add(new_asset)
    db.commit()
    db.refresh(new_asset)
    
    if request.folder in ("project/gallery", "demo") and request.project_slug:
        from app.modules.projects.models import ProjectGalleryImage
        from sqlalchemy import func
        max_sort = db.query(func.max(ProjectGalleryImage.sort_order)).filter(ProjectGalleryImage.project_slug == request.project_slug).scalar()
        next_sort = 0 if max_sort is None else max_sort + 1
        gallery_item = ProjectGalleryImage(
            project_slug=request.project_slug,
            media_asset_id=new_asset.id,
            caption=request.title,
            sort_order=next_sort,
            published=False
        )
        db.add(gallery_item)
        db.commit()

    return new_asset


@router.post("/finalize", status_code=status.HTTP_201_CREATED)
def finalize_media_route(
    request: MediaFinalizeRequest = Body(...),
    db: Session = Depends(get_db_session)
):
    try:
        return finalize_media_asset(
            db=db,
            asset_id=request.asset_id,
            url=request.url,
            thumbnail_url=request.thumbnail_url,
            mime_type=request.mime_type,
            file_size=request.file_size,
            width=request.width,
            height=request.height,
            alt=request.alt,
            caption=request.caption,
            client_slug=request.client_slug,
            project_slug=request.project_slug,
            folder=request.folder,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Finalize failed: {str(e)}"
        )


@router.post("/upload", status_code=status.HTTP_201_CREATED)
def upload_media_route(
    file: UploadFile = File(...),
    alt: str | None = Form(None),
    caption: str | None = Form(None),
    client_slug: str | None = Form(None),
    project_slug: str | None = Form(None),
    folder: str | None = Form(None),
    db: Session = Depends(get_db_session)
):
    try:
        return create_media_asset_from_file(
            db, 
            file, 
            alt=alt, 
            caption=caption,
            client_slug=client_slug,
            project_slug=project_slug,
            folder=folder
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )


@router.get("/cors-proxy")
def cors_proxy_route(url: str = Query(...)):
    try:
        import urllib.parse
        # Unquote first to remove any double-encoding (like %2520 -> %20)
        unquoted = urllib.parse.unquote(url)
        safe_url = urllib.parse.quote(unquoted, safe=":/?&=")
        req = urllib.request.Request(safe_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            content = response.read()
            mime_type = response.headers.get('Content-Type', 'image/webp')
        return StreamingResponse(
            io.BytesIO(content), 
            media_type=mime_type, 
            headers={"Cache-Control": "public, max-age=86400"}
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


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
    try:
        success = delete_media_asset(db, id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Media asset not found"
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    return None
