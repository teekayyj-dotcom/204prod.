from pydantic import BaseModel
from datetime import datetime


class ProjectCreditDetail(BaseModel):
    role: str
    name: str
    crew_id: int | None = None


class ProjectSummary(BaseModel):
    title: str
    slug: str
    client: str
    client_slug: str | None = None
    client_logo: str | None = None
    year: int
    format: str
    format_slug: str | None = None
    featured: bool
    cover_image: str
    status: str
    published: bool = False
    locked: bool = False
    progress: int = 0
    budget: str = "TBD"
    cover_media: dict | None = None
    video_url: str | None = None
    videoUrl: str | None = None
    due_date: str | None = None
    dueDate: str | None = None


class GalleryImageDetail(BaseModel):
    id: str
    url: str
    thumbnail_url: str | None = None
    bunny_video_id: str | None = None
    name: str | None = None
    size: str | None = None
    type: str | None = None
    uploaded: str | None = None
    published: bool = False
    folder: str | None = None


class ProjectDetail(ProjectSummary):
    summary: str
    credits: list[str]
    structured_credits: list[ProjectCreditDetail] | None = None
    gallery: list[GalleryImageDetail]


class ProjectCreate(BaseModel):
    title: str
    slug: str | None = None
    client_slug: str
    year: int
    format_slug: str
    featured: bool = False
    status: str = "draft"
    published: bool = False
    locked: bool = False
    cover_media_id: str | None = None
    summary: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    video_url: str | None = None
    structured_credits: list[ProjectCreditDetail] | None = None

    due_date: str | None = None
    dueDate: str | None = None
    credits: list[str] | None = None
    structured_credits: list[ProjectCreditDetail] | None = None
    gallery_media_ids: list[str] | None = None
    budget: str | None = None


class ProjectUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    client_slug: str | None = None
    year: int | None = None
    format_slug: str | None = None
    featured: bool | None = None
    status: str | None = None
    published: bool | None = None
    locked: bool | None = None
    cover_media_id: str | None = None
    summary: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    video_url: str | None = None
    structured_credits: list[ProjectCreditDetail] | None = None

    due_date: str | None = None
    dueDate: str | None = None
    credits: list[str] | None = None
    structured_credits: list[ProjectCreditDetail] | None = None
    gallery_media_ids: list[str] | None = None
    budget: str | None = None


class ClientSummary(BaseModel):
    slug: str
    name: str
    logo_media_id: str | None = None
    logo_media_url: str | None = None
    website: str | None = None
    contact: str | None = None
    email: str | None = None
    phone: str | None = None
    industry: str | None = None
    status: str
    since: str | None = None
    notes: str | None = None
    project_count: int = 0
    total_budget: int = 0

    class Config:
        from_attributes = True


class ClientCreate(BaseModel):
    name: str
    slug: str | None = None
    logo_media_id: str | None = None
    website: str | None = None
    contact: str | None = None
    email: str | None = None
    phone: str | None = None
    industry: str | None = None
    status: str = "Active"
    since: str | None = None
    notes: str | None = None


class ClientUpdate(BaseModel):
    name: str | None = None
    logo_media_id: str | None = None
    website: str | None = None
    contact: str | None = None
    email: str | None = None
    phone: str | None = None
    industry: str | None = None
    status: str | None = None
    since: str | None = None
    notes: str | None = None


class ProjectFeedbackBase(BaseModel):
    video_url: str | None = None
    timecode: float
    position_x: float
    position_y: float
    content: str
    status: str = "Open"
    reply_content: str | None = None
    reply_author: str | None = None


class ProjectFeedbackCreate(ProjectFeedbackBase):
    user_id: str | None = "Client"
    guest_name: str | None = None


class ProjectFeedbackDetail(ProjectFeedbackBase):
    id: int
    project_slug: str
    user_id: str | None = None
    guest_name: str | None = None
    created_at: datetime
    reply_at: datetime | None = None

    class Config:
        from_attributes = True


class ProjectTaskBase(BaseModel):
    title: str
    assignee_name: str | None = None
    assignee_initials: str | None = None
    tag: str | None = None
    created_by: str
    deadline: str | None = None
    status: str = "todo"
    priority: str = "medium"


class ProjectTaskCreate(ProjectTaskBase):
    id: str


class ProjectTaskUpdate(BaseModel):
    title: str | None = None
    assignee_name: str | None = None
    assignee_initials: str | None = None
    tag: str | None = None
    created_by: str | None = None
    deadline: str | None = None
    status: str | None = None
    priority: str | None = None


class ProjectTaskDetail(ProjectTaskBase):
    id: str
    project_slug: str
    project_title: str | None = None

    class Config:
        from_attributes = True


class ApprovalRequestBase(BaseModel):
    task_id: str
    crew_name: str
    status: str = "pending"
    timestamp: str


class ApprovalRequestCreate(ApprovalRequestBase):
    id: str


class ApprovalRequestDetail(ApprovalRequestBase):
    id: str
    project_slug: str
    task_label: str | None = None

    class Config:
        from_attributes = True


class ProjectActivityDetail(BaseModel):
    id: int
    project_slug: str
    user_name: str
    action: str
    avatar: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectCommentCreate(BaseModel):
    user_name: str
    text: str
    avatar: str | None = None


class ProjectCommentDetail(BaseModel):
    id: int
    project_slug: str
    user_name: str
    text: str
    avatar: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewLinkResponse(BaseModel):
    token: str
    url: str
    project_slug: str
    video_url: str

class ReviewLinkPublic(BaseModel):
    token: str
    project_slug: str
    video_url: str
    published: bool

class AlbumInteractionCreate(BaseModel):
    photo_id: str | None = None
    client_name: str
    interaction_type: str
    comment_text: str | None = None
    user_role: str | None = None
    user_avatar: str | None = None

class AlbumInteractionResponse(BaseModel):
    id: int
    photo_id: str
    client_name: str
    interaction_type: str
    comment_text: str | None = None
    created_at: datetime

class AlbumPhotoResponse(BaseModel):
    id: str
    album_id: str
    file_id: str
    thumbnail_url: str
    web_content_url: str | None = None
    created_at: datetime
    interactions: list[AlbumInteractionResponse] = []

class PhotoAlbumCreate(BaseModel):
    title: str
    gdrive_folder_id: str
    background_url: str | None = None

class PhotoAlbumUpdate(BaseModel):
    title: str | None = None
    gdrive_folder_id: str | None = None
    background_url: str | None = None

class PhotoAlbumResponse(BaseModel):
    id: str
    project_slug: str
    title: str
    gdrive_folder_id: str
    background_url: str | None = None
    short_token: str
    created_at: datetime
    photos: list[AlbumPhotoResponse] = []
