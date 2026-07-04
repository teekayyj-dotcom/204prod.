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
        client_logo=(p.client.logo_media.thumbnail_url or p.client.logo_media.url) if p.client and p.client.logo_media else None,
        year=p.year,
        format=p.format_category.name if p.format_category else p.format_slug,
        format_slug=p.format_slug,
        featured=p.featured,
        cover_image=(p.cover_media.thumbnail_url or p.cover_media.url) if p.cover_media else "",
        cover_media={
            "url": p.cover_media.url,
            "thumbnail_url": p.cover_media.thumbnail_url,
            "kind": p.cover_media.kind
        } if p.cover_media else None,
        video_url=p.video_url,
        videoUrl=p.video_url,
        budget=p.budget or "TBD",
        status=p.status,
        published=p.published,
        locked=p.locked,
        due_date=p.due_date.isoformat() if p.due_date else None,
        dueDate=p.due_date.isoformat() if p.due_date else None,
        summary=p.summary or "",
        credits=[f"{c.role}: {c.name}" for c in p.credits] if getattr(p, "credits", None) else [],
        gallery=[
            {
                "id": g.media_asset_id,
                "url": g.media_asset.url,
                "thumbnail_url": g.media_asset.thumbnail_url or (f"https://vz-f1a07f87-b02.b-cdn.net/{g.media_asset.bunny_video_id}/thumbnail.jpg" if g.media_asset.bunny_video_id else None),
                "bunny_video_id": g.media_asset.bunny_video_id,
                "name": g.media_asset.alt or g.media_asset.id,
                "size": f"{round(g.media_asset.file_size / (1024 * 1024), 2)} MB" if g.media_asset.file_size else "0.0 MB",
                "type": g.media_asset.kind,
                "uploaded": g.media_asset.created_at.strftime("%Y-%m-%d") if g.media_asset.created_at else "",
                "published": g.published,
                "folder": g.media_asset.folder,
            }
            for g in p.gallery_images
            if g.media_asset
        ] if getattr(p, "gallery_images", None) else []
    )


def list_projects(db: Session) -> list[ProjectDetail]:
    stmt = select(Project).options(
        joinedload(Project.client).joinedload(Client.logo_media),
        joinedload(Project.format_category),
        joinedload(Project.cover_media),
        joinedload(Project.credits),
        joinedload(Project.gallery_images).joinedload(ProjectGalleryImage.media_asset)
    )
    projects = db.scalars(stmt).unique().all()
    return [_map_to_detail(p) for p in projects]


def get_project_by_slug(db: Session, slug: str) -> ProjectDetail | None:
    stmt = select(Project).where(Project.slug == slug).options(
        joinedload(Project.client).joinedload(Client.logo_media),
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

def sync_crm_notes_from_db(db: Session, db_client: Client) -> None:
    import json
    from app.modules.finance.models import ClientInvoice
    
    if not db_client.notes:
        return
        
    try:
        trimmed = db_client.notes.strip()
        if not trimmed.startswith("{"):
            return
        crm = json.loads(trimmed)
        crm_invoices = crm.get("invoices", [])
        if not crm_invoices:
            return
            
        # Get existing client invoices from DB
        db_invoices = db.query(ClientInvoice).filter(ClientInvoice.client_slug == db_client.slug).all()
        db_inv_map = {inv.id: inv for inv in db_invoices}
        
        status_map_rev = {
            "paid": "Paid",
            "pending": "Unpaid",
            "overdue": "Overdue"
        }
        
        changed = False
        for crm_inv in crm_invoices:
            inv_id = crm_inv.get("id") or crm_inv.get("code")
            if inv_id in db_inv_map:
                db_inv = db_inv_map[inv_id]
                expected_crm_status = status_map_rev.get(db_inv.status, "Unpaid")
                if crm_inv.get("status") != expected_crm_status:
                    crm_inv["status"] = expected_crm_status
                    changed = True
                    
        if changed:
            crm["invoices"] = crm_invoices
            db_client.notes = json.dumps(crm, ensure_ascii=False)
            db.commit()
    except Exception as e:
        print(f"Error syncing CRM notes from DB: {e}")


def _map_client_to_summary(c: Client, db: Session = None) -> ClientSummary:
    if db is not None:
        sync_crm_notes_from_db(db, c)
        
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
    return [_map_client_to_summary(c, db) for c in clients]


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
    
    summary = _map_client_to_summary(c, db)
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
