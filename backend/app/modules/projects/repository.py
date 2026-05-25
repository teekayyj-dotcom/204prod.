from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload
from app.modules.projects.models import Client, Project, ProjectGalleryImage
from app.modules.projects.schemas import ProjectDetail


def _map_to_detail(p: Project) -> ProjectDetail:
    return ProjectDetail(
        title=p.title,
        slug=p.slug,
        client=p.client.name if p.client else p.client_slug,
        year=p.year,
        format=p.format_category.name if p.format_category else p.format_slug,
        featured=p.featured,
        cover_image=p.cover_media.url if p.cover_media else "",
        status=p.status,
        summary=p.summary or "",
        credits=[f"{c.role}: {c.name}" for c in p.credits] if getattr(p, "credits", None) else [],
        gallery=[g.media_asset.url for g in p.gallery_images if g.media_asset] if getattr(p, "gallery_images", None) else []
    )


def list_projects(db: Session) -> list[ProjectDetail]:
    stmt = select(Project).options(
        joinedload(Project.client),
        joinedload(Project.format_category),
        joinedload(Project.cover_media),
        joinedload(Project.credits),
        joinedload(Project.gallery_images).joinedload(ProjectGalleryImage.media_asset)
    )
    projects = db.scalars(stmt).unique().all()
    return [_map_to_detail(p) for p in projects]


def get_project_by_slug(db: Session, slug: str) -> ProjectDetail | None:
    stmt = select(Project).where(Project.slug == slug).options(
        joinedload(Project.client),
        joinedload(Project.format_category),
        joinedload(Project.cover_media),
        joinedload(Project.credits),
        joinedload(Project.gallery_images).joinedload(ProjectGalleryImage.media_asset)
    )
    p = db.scalars(stmt).unique().first()
    if p:
        return _map_to_detail(p)
    return None


def list_clients(db: Session) -> list[Client]:
    return db.scalars(select(Client)).all()
