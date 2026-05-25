from pydantic import BaseModel


class ProjectSummary(BaseModel):
    title: str
    slug: str
    client: str
    year: int
    format: str
    featured: bool
    cover_image: str
    status: str
    progress: int = 100
    budget: str = "TBD"


class ProjectDetail(ProjectSummary):
    summary: str
    credits: list[str]
    gallery: list[str]
