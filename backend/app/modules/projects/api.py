from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.modules.projects.service import get_project, get_projects, create_project, delete_project, update_project
from app.modules.projects.schemas import ProjectCreate, ProjectUpdate, ClientCreate, ClientUpdate

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("")
def list_projects_route(db: Session = Depends(get_db_session)):
    return get_projects(db)


@router.get("/clients/all")
def list_clients_route(db: Session = Depends(get_db_session)):
    from app.modules.projects.service import get_clients
    return get_clients(db)


@router.post("/clients", status_code=status.HTTP_201_CREATED)
def create_client_route(req: ClientCreate, db: Session = Depends(get_db_session)):
    from app.modules.projects.service import create_client
    return create_client(db, req)


@router.get("/clients/{slug}")
def get_client_route(slug: str, db: Session = Depends(get_db_session)):
    from app.modules.projects.repository import get_client_detail
    detail = get_client_detail(db, slug)
    if not detail:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return detail


@router.put("/clients/{slug}")
def update_client_route(slug: str, req: ClientUpdate, db: Session = Depends(get_db_session)):
    from app.modules.projects.service import update_client
    updated = update_client(db, slug, req)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return updated


@router.delete("/clients/{slug}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client_route(slug: str, db: Session = Depends(get_db_session)):
    from app.modules.projects.service import delete_client
    success = delete_client(db, slug)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return None


@router.get("/{slug}")
def get_project_route(slug: str, db: Session = Depends(get_db_session)):
    return get_project(db, slug)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_project_route(req: ProjectCreate, db: Session = Depends(get_db_session)):
    return create_project(db, req)


@router.put("/{slug}")
def update_project_route(slug: str, req: ProjectUpdate, db: Session = Depends(get_db_session)):
    updated = update_project(db, slug, req)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return updated


@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project_route(slug: str, db: Session = Depends(get_db_session)):
    success = delete_project(db, slug)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return None


