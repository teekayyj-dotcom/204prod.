from pydantic import BaseModel
from datetime import datetime


class ProjectSummary(BaseModel):
    title: str
    slug: str
    client: str
    client_slug: str | None = None
    year: int
    format: str
    format_slug: str | None = None
    featured: bool
    cover_image: str
    status: str
    published: bool = False
    locked: bool = False
    progress: int = 100
    budget: str = "TBD"
    cover_media: dict | None = None
    video_url: str | None = None
    videoUrl: str | None = None


class GalleryImageDetail(BaseModel):
    id: str
    url: str


class ProjectDetail(ProjectSummary):
    summary: str
    credits: list[str]
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
    credits: list[str] | None = None
    gallery_media_ids: list[str] | None = None


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
    credits: list[str] | None = None
    gallery_media_ids: list[str] | None = None


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
    timecode: float
    position_x: float
    position_y: float
    content: str
    status: str = "Open"
    reply_content: str | None = None
    reply_author: str | None = None


class ProjectFeedbackCreate(ProjectFeedbackBase):
    user_id: str = "Client"


class ProjectFeedbackDetail(ProjectFeedbackBase):
    id: int
    project_slug: str
    user_id: str
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


