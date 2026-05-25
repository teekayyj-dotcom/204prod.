from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db_session, SessionLocal
from app.modules.projects.service import get_project, get_projects, create_project, delete_project, update_project

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("")
def list_projects_route(db: Session = Depends(get_db_session)):
    return get_projects(db)

@router.get("/{slug}")
def get_project_route(slug: str, db: Session = Depends(get_db_session)):
    return get_project(db, slug)

@router.get("/clients/all")
def list_clients_route(db: Session = Depends(get_db_session)):
    from app.modules.projects.service import get_clients
    return get_clients(db)

@router.post("/")
def create_project_route(req: dict, db: Session = Depends(get_db_session)):
    from app.modules.projects.service import create_project
    return create_project(db, req)


@router.delete("/{slug}")
def delete_project_route(slug: str, db: Session = Depends(get_db_session)):
    from app.modules.projects.service import delete_project
    return delete_project(db, slug)

@router.put("/{slug}")
def update_project_route(slug: str, req: dict, db: Session = Depends(get_db_session)):
    from app.modules.projects.service import update_project
    return update_project(db, slug, req)

