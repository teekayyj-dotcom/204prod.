from pydantic import BaseModel


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
    progress: int = 100
    budget: str = "TBD"
    cover_media: dict | None = None
    video_url: str | None = None
    videoUrl: str | None = None


class ProjectDetail(ProjectSummary):
    summary: str
    credits: list[str]
    gallery: list[str]


class ProjectCreate(BaseModel):
    title: str
    slug: str | None = None
    client_slug: str
    year: int
    format_slug: str
    featured: bool = False
    status: str = "draft"
    cover_media_id: str | None = None
    summary: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    video_url: str | None = None


class ProjectUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    client_slug: str | None = None
    year: int | None = None
    format_slug: str | None = None
    featured: bool | None = None
    status: str | None = None
    cover_media_id: str | None = None
    summary: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    video_url: str | None = None


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

