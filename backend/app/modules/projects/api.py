from fastapi import APIRouter

from app.modules.projects.service import get_project, get_projects

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("")
def list_projects_route():
    return get_projects()


@router.get("/{slug}")
def get_project_route(slug: str):
    return get_project(slug)
