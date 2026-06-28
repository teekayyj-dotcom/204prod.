from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.modules.projects.service import get_project, get_projects, create_project, delete_project, update_project
from app.modules.projects.schemas import ProjectCreate, ProjectUpdate, ClientCreate, ClientUpdate, ProjectFeedbackCreate

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


from sqlalchemy.exc import IntegrityError

@router.delete("/clients/{slug}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client_route(slug: str, db: Session = Depends(get_db_session)):
    from app.modules.projects.service import delete_client
    try:
        success = delete_client(db, slug)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete client because it is currently associated with one or more projects."
        )
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


@router.get("/{slug}/feedback")
def list_feedback_route(slug: str, db: Session = Depends(get_db_session)):
    from app.modules.projects.service import get_feedbacks
    return get_feedbacks(db, slug)


@router.post("/{slug}/feedback")
def create_feedback_route(slug: str, req: ProjectFeedbackCreate, db: Session = Depends(get_db_session)):
    from app.modules.projects.service import create_feedback
    return create_feedback(db, slug, req)


@router.delete("/feedback/{feedback_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feedback_route(feedback_id: int, db: Session = Depends(get_db_session)):
    from app.modules.projects.service import delete_feedback
    success = delete_feedback(db, feedback_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found")
    return None


@router.put("/feedback/{feedback_id}/status")
def update_feedback_status_route(feedback_id: int, status_val: str, db: Session = Depends(get_db_session)):
    from app.modules.projects.service import update_feedback_status
    updated = update_feedback_status(db, feedback_id, status_val)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found")
    return updated


@router.put("/feedback/{feedback_id}/reply")
def reply_feedback_route(feedback_id: int, reply_content: str = Body(..., embed=True), reply_author: str = Body("Admin", embed=True), db: Session = Depends(get_db_session)):
    from app.modules.projects.service import reply_feedback
    updated = reply_feedback(db, feedback_id, reply_content, reply_author)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found")
    return updated



