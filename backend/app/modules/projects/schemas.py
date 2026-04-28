from pydantic import BaseModel


class ProjectSummary(BaseModel):
    title: str
    slug: str
    client: str
    year: int
    format: str
    featured: bool
    cover_image: str


class ProjectDetail(ProjectSummary):
    summary: str
    credits: list[str]
    gallery: list[str]
