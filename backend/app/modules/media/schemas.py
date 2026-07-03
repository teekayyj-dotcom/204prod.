from datetime import datetime
from pydantic import BaseModel


class MediaAsset(BaseModel):
    id: str
    kind: str
    url: str
    thumbnail_url: str | None = None
    alt: str | None = None
    caption: str | None = None
    width: int | None = None
    height: int | None = None
    mime_type: str | None = None
    file_size: int | None = None
    bunny_video_id: str | None = None
    client_slug: str | None = None
    project_slug: str | None = None
    folder: str | None = None
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


class PresignedUrlRequest(BaseModel):
    filename: str
    content_type: str
    file_size: int
    category: str = "projects"  # e.g., projects, case_studies, thumbnails
    client_slug: str | None = None
    project_slug: str | None = None
    folder: str | None = None


class PresignedUrlResponse(BaseModel):
    asset_id: str
    main_url: str  # The public URL for the main image
    thumb_url: str  # The public URL for the thumbnail
    main_upload_data: dict  # The data to use for POSTing main image
    thumb_upload_data: dict  # The data to use for POSTing thumbnail image


class MediaFinalizeRequest(BaseModel):
    asset_id: str
    url: str
    thumbnail_url: str | None = None
    alt: str | None = None
    caption: str | None = None
    width: int | None = None
    height: int | None = None
    mime_type: str | None = None
    file_size: int | None = None
    client_slug: str | None = None
    project_slug: str | None = None
    folder: str | None = None


class VideoUploadRequest(BaseModel):
    filename: str
    title: str | None = None


class VideoUploadResponse(BaseModel):
    video_id: str
    signature: str
    expiration_time: int
    library_id: str


class VideoSaveRequest(BaseModel):
    video_id: str
    title: str | None = None
    client_slug: str | None = None
    project_slug: str | None = None
    folder: str | None = None
