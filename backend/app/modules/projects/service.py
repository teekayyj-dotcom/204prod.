from fastapi import HTTPException, status

from app.modules.projects.repository import get_project_by_slug, list_projects
from app.modules.projects.schemas import ProjectDetail


def get_projects() -> list[ProjectDetail]:
    return list_projects()


def get_project(slug: str) -> ProjectDetail:
    project = get_project_by_slug(slug)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )
    return project
