from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.modules.projects.models import Project
from app.modules.projects.repository import get_project_by_slug, list_projects
from app.modules.projects.schemas import ProjectDetail


def get_projects(db: Session) -> list[ProjectDetail]:
    return list_projects(db)


def get_project(db: Session, slug: str) -> ProjectDetail:
    project = get_project_by_slug(db, slug)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )
    return project


def get_clients(db: Session):
    from app.modules.projects.repository import list_clients
    return list_clients(db)

def get_project_by_id(db: Session, id: str):

    return db.query(Project).filter(Project.id == id).first()

def create_project(db: Session, project: Project):
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

def update_project(db: Session, id: str, project: Project):
    existing_project = db.query(Project).filter(Project.id == id).first()
    if not existing_project:
        return None
    existing_project.title = project.title
    existing_project.slug = project.slug
    existing_project.client = project.client
    existing_project.year = project.year
    existing_project.format = project.format
    existing_project.featured = project.featured
    existing_project.cover_image = project.cover_image
    existing_project.status = project.status
    existing_project.progress = project.progress
    existing_project.budget = project.budget
    existing_project.summary = project.summary
    existing_project.credits = project.credits
    existing_project.gallery = project.gallery
    db.commit()
    db.refresh(existing_project)
    return existing_project

def delete_project(db: Session, id: str):
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        return None
    db.delete(project)
    db.commit()
    return True
