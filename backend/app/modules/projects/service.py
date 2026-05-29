from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.modules.projects.models import Project
from app.modules.projects.repository import get_project_by_slug, list_projects
from app.modules.projects.schemas import ProjectDetail, ProjectCreate, ProjectUpdate


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


def get_project_by_slug_orm(db: Session, slug: str) -> Project | None:
    return db.query(Project).filter(Project.slug == slug).first()


def create_project(db: Session, project: ProjectCreate) -> Project:
    import re
    slug = project.slug
    if not slug:
        slug = re.sub(r'[^a-z0-9]+', '-', project.title.lower()).strip('-')

    video_url = project.video_url
    if video_url is not None and not video_url.strip():
        video_url = None

    db_project = Project(
        slug=slug,
        title=project.title,
        client_slug=project.client_slug,
        year=project.year,
        format_slug=project.format_slug,
        featured=project.featured,
        status=project.status,
        cover_media_id=project.cover_media_id,
        video_url=video_url,
        summary=project.summary,
        seo_title=project.seo_title,
        seo_description=project.seo_description,
    )
    db.add(db_project)
    
    if project.credits:
        from app.modules.projects.models import ProjectCredit
        for i, cred_str in enumerate(project.credits):
            if ":" in cred_str:
                role, name = cred_str.split(":", 1)
                db_credit = ProjectCredit(
                    project_slug=slug,
                    role=role.strip(),
                    name=name.strip(),
                    sort_order=i
                )
                db.add(db_credit)

    if project.gallery_media_ids:
        from app.modules.projects.models import ProjectGalleryImage
        for i, media_id in enumerate(project.gallery_media_ids):
            db_gallery_image = ProjectGalleryImage(
                project_slug=slug,
                media_asset_id=media_id,
                sort_order=i,
                is_featured=False
            )
            db.add(db_gallery_image)

    db.commit()
    db.refresh(db_project)
    return db_project


def update_project(db: Session, slug: str, project: ProjectUpdate) -> Project | None:
    existing_project = db.query(Project).filter(Project.slug == slug).first()
    if not existing_project:
        return None
    
    if project.title is not None:
        existing_project.title = project.title
    if project.client_slug is not None:
        existing_project.client_slug = project.client_slug
    if project.year is not None:
        existing_project.year = project.year
    if project.format_slug is not None:
        existing_project.format_slug = project.format_slug
    if project.featured is not None:
        existing_project.featured = project.featured
    if project.status is not None:
        existing_project.status = project.status
    if project.cover_media_id is not None:
        existing_project.cover_media_id = project.cover_media_id
    if project.video_url is not None:
        existing_project.video_url = project.video_url if project.video_url.strip() else None
    if project.summary is not None:
        existing_project.summary = project.summary
    if project.seo_title is not None:
        existing_project.seo_title = project.seo_title
    if project.seo_description is not None:
        existing_project.seo_description = project.seo_description
        
    if project.credits is not None:
        from app.modules.projects.models import ProjectCredit
        # Delete existing credits
        db.query(ProjectCredit).filter(ProjectCredit.project_slug == existing_project.slug).delete()
        # Add new ones
        for i, cred_str in enumerate(project.credits):
            if ":" in cred_str:
                role, name = cred_str.split(":", 1)
                db_credit = ProjectCredit(
                    project_slug=existing_project.slug,
                    role=role.strip(),
                    name=name.strip(),
                    sort_order=i
                )
                db.add(db_credit)

    if project.gallery_media_ids is not None:
        from app.modules.projects.models import ProjectGalleryImage
        # Delete existing gallery images
        db.query(ProjectGalleryImage).filter(ProjectGalleryImage.project_slug == existing_project.slug).delete()
        # Add new ones
        for i, media_id in enumerate(project.gallery_media_ids):
            db_gallery_image = ProjectGalleryImage(
                project_slug=existing_project.slug,
                media_asset_id=media_id,
                sort_order=i,
                is_featured=False
            )
            db.add(db_gallery_image)
        
    db.commit()
    db.refresh(existing_project)
    return existing_project


def delete_project(db: Session, slug: str) -> bool:
    project = db.query(Project).filter(Project.slug == slug).first()
    if not project:
        return False
    db.delete(project)
    db.commit()
    return True


from app.modules.projects.schemas import ClientCreate, ClientUpdate
from app.modules.projects.models import Client

def create_client(db: Session, client: ClientCreate) -> Client:
    import re
    slug = client.slug
    if not slug:
        slug = re.sub(r'[^a-z0-9]+', '-', client.name.lower()).strip('-')
    
    db_client = Client(
        slug=slug,
        name=client.name,
        logo_media_id=client.logo_media_id,
        website=client.website,
        contact=client.contact,
        email=client.email,
        phone=client.phone,
        industry=client.industry,
        status=client.status,
        since=client.since,
        notes=client.notes,
    )
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client


def update_client(db: Session, slug: str, client: ClientUpdate) -> Client | None:
    from app.modules.projects.repository import get_client_by_slug
    db_client = get_client_by_slug(db, slug)
    if not db_client:
        return None
    
    if client.name is not None:
        db_client.name = client.name
    if client.logo_media_id is not None:
        db_client.logo_media_id = client.logo_media_id
    if client.website is not None:
        db_client.website = client.website
    if client.contact is not None:
        db_client.contact = client.contact
    if client.email is not None:
        db_client.email = client.email
    if client.phone is not None:
        db_client.phone = client.phone
    if client.industry is not None:
        db_client.industry = client.industry
    if client.status is not None:
        db_client.status = client.status
    if client.since is not None:
        db_client.since = client.since
    if client.notes is not None:
        db_client.notes = client.notes
        
    db.commit()
    db.refresh(db_client)
    return db_client


def delete_client(db: Session, slug: str) -> bool:
    from app.modules.projects.repository import get_client_by_slug
    db_client = get_client_by_slug(db, slug)
    if not db_client:
        return False
    db.delete(db_client)
    db.commit()
    return True
