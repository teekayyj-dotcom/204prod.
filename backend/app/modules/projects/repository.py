from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload
from app.modules.projects.models import Client, Project, ProjectGalleryImage
from app.modules.projects.schemas import ProjectDetail


def _map_to_detail(p: Project) -> ProjectDetail:
    return ProjectDetail(
        title=p.title,
        slug=p.slug,
        client=p.client.name if p.client else p.client_slug,
        client_slug=p.client_slug,
        year=p.year,
        format=p.format_category.name if p.format_category else p.format_slug,
        format_slug=p.format_slug,
        featured=p.featured,
        cover_image=p.cover_media.url if p.cover_media else "",
        cover_media={
            "url": p.cover_media.url,
            "kind": p.cover_media.kind
        } if p.cover_media else None,
        video_url=p.video_url,
        videoUrl=p.video_url,
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


from app.modules.projects.schemas import ClientSummary

def _map_client_to_summary(c: Client) -> ClientSummary:
    # Compute project count and total budget from client projects list
    project_count = len(c.projects) if c.projects else 0
    total_budget = 0
    for p in c.projects:
        # Strip currency symbols and parse budget
        budget = getattr(p, "budget", None)
        if budget:
            try:
                import re
                val = int(re.sub(r'[^\d]', '', budget))
                total_budget += val
            except Exception:
                pass
    return ClientSummary(
        slug=c.slug,
        name=c.name,
        logo_media_id=c.logo_media_id,
        logo_media_url=c.logo_media.url if c.logo_media else None,
        website=c.website,
        contact=c.contact,
        email=c.email,
        phone=c.phone,
        industry=c.industry,
        status=c.status,
        since=c.since,
        notes=c.notes,
        project_count=project_count,
        total_budget=total_budget,
    )


def list_clients(db: Session) -> list[ClientSummary]:
    stmt = select(Client).options(
        joinedload(Client.logo_media),
        joinedload(Client.projects)
    )
    clients = db.scalars(stmt).unique().all()
    return [_map_client_to_summary(c) for c in clients]


def get_client_by_slug(db: Session, slug: str) -> Client | None:
    stmt = select(Client).where(Client.slug == slug).options(
        joinedload(Client.logo_media),
        joinedload(Client.projects)
    )
    return db.scalars(stmt).unique().first()


def get_client_detail(db: Session, slug: str) -> dict | None:
    c = get_client_by_slug(db, slug)
    if not c:
        return None
    
    summary = _map_client_to_summary(c)
    res = summary.model_dump()
    
    mapped_projects = []
    for p in c.projects:
        mapped_projects.append({
            "id": p.slug,
            "slug": p.slug,
            "title": p.title,
            "category": p.format_category.name if p.format_category else p.format_slug,
            "dueDate": p.published_at.strftime("%Y-%m-%d") if p.published_at else f"{p.year}-12-31",
            "progress": 100,
            "status": p.status,
            "budget": getattr(p, "budget", None) or "—",
            "image": p.cover_media.url if p.cover_media else "",
        })
    res["projects"] = mapped_projects
    return res
