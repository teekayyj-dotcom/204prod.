from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.modules.projects.models import Project, ProjectTask
from app.modules.projects.repository import get_project_by_slug, list_projects
from app.modules.projects.schemas import ProjectDetail, ProjectCreate, ProjectUpdate, ProjectTaskCreate, ProjectTaskUpdate, ApprovalRequestCreate
from app.modules.users.service import pre_authorize_user


def get_projects(
    db: Session,
    search: str | None = None,
    status: str | None = None,
    format_name: str | None = None,
    featured: bool | None = None,
    sort_by: str | None = None,
):
    return list_projects(db, search=search, status=status, format_name=format_name, featured=featured, sort_by=sort_by)


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

    from datetime import datetime
    due_date_str = project.dueDate or project.due_date
    parsed_due_date = datetime.strptime(due_date_str, "%Y-%m-%d").date() if due_date_str else None

    db_project = Project(
        slug=slug,
        title=project.title,
        client_slug=project.client_slug,
        year=project.year,
        format_slug=project.format_slug,
        featured=project.featured,
        status=project.status,
        published=project.published,
        locked=project.locked,
        cover_media_id=project.cover_media_id,
        due_date=parsed_due_date,
        video_url=video_url,
        summary=project.summary,
        seo_title=project.seo_title,
        seo_description=project.seo_description,
        budget=project.budget or "TBD",
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
    if project.published is not None:
        existing_project.published = project.published
    if project.locked is not None:
        existing_project.locked = project.locked
        
    due_date_str = project.dueDate or project.due_date
    if due_date_str is not None:
        from datetime import datetime
        existing_project.due_date = datetime.strptime(due_date_str, "%Y-%m-%d").date() if due_date_str else None

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
    if project.budget is not None:
        existing_project.budget = project.budget
        
        
    if project.structured_credits is not None:
        from app.modules.projects.models import ProjectCredit
        db.query(ProjectCredit).filter(ProjectCredit.project_slug == existing_project.slug).delete()
        for i, cred in enumerate(project.structured_credits):
            db_credit = ProjectCredit(
                project_slug=existing_project.slug,
                role=cred.role.strip(),
                name=cred.name.strip(),
                crew_id=cred.crew_id,
                sort_order=i
            )
            db.add(db_credit)
    elif project.credits is not None:
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
    sync_client_invoices(db, db_client)
    sync_client_poc_authorization(db, db_client)
    return db_client

def sync_client_poc_authorization(db: Session, db_client: Client) -> None:
    import json
    from app.modules.users.service import pre_authorize_user
    
    poc_emails = {}
    if db_client.email:
        poc_emails[db_client.email.strip().lower()] = db_client.contact or "Client Admin"
        
    if db_client.notes:
        try:
            trimmed = db_client.notes.strip()
            if trimmed.startswith("{"):
                crm = json.loads(trimmed)
                poc_list = crm.get("poc_list", [])
                for poc in poc_list:
                    if poc.get("email"):
                        email = poc.get("email").strip().lower()
                        name = poc.get("name") or "Client POC"
                        poc_emails[email] = name
        except Exception as e:
            print(f"Error syncing client POC auth: {e}")
            
    for email, name in poc_emails.items():
        if email:
            pre_authorize_user(db, email, "client", display_name=name)

def sync_client_invoices(db: Session, db_client: Client) -> None:
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

        # Get existing client invoices from DB
        db_invoices = db.query(ClientInvoice).filter(ClientInvoice.client_slug == db_client.slug).all()
        db_inv_map = {inv.id: inv for inv in db_invoices}

        crm_inv_ids = set()

        for crm_inv in crm_invoices:
            inv_id = crm_inv.get("id") or crm_inv.get("code")
            if not inv_id:
                continue
            crm_inv_ids.add(inv_id)

            # Map CRM status (Paid -> paid, Unpaid -> pending, Overdue -> overdue)
            status_map = {
                "Paid": "paid",
                "Unpaid": "pending",
                "Overdue": "overdue"
            }
            crm_status = crm_inv.get("status")
            db_status = status_map.get(crm_status, "pending")

            amount = 0.0
            try:
                amount = float(crm_inv.get("amount") or 0.0)
            except:
                pass

            due_date = crm_inv.get("date") or ""
            desc = crm_inv.get("description") or ""
            code = crm_inv.get("code") or ""

            project_val = desc
            term_val = f"{code}: {desc}"

            if inv_id in db_inv_map:
                inv = db_inv_map[inv_id]
                inv.client_name = db_client.name
                inv.project = project_val
                inv.term = term_val
                inv.amount = amount
                inv.due_date = due_date
                inv.status = db_status
            else:
                new_inv = ClientInvoice(
                    id=inv_id,
                    client_slug=db_client.slug,
                    client_name=db_client.name,
                    project=project_val,
                    term=term_val,
                    amount=amount,
                    due_date=due_date,
                    status=db_status,
                )
                db.add(new_inv)

        # Delete invoices that are no longer in CRM notes
        for inv_id, inv in db_inv_map.items():
            if inv_id not in crm_inv_ids:
                db.delete(inv)

        db.commit()
        from app.modules.finance.service import recalculate_receivables
        recalculate_receivables(db)
    except Exception as e:
        print(f"Error syncing client invoices: {e}")


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
    sync_client_invoices(db, db_client)
    sync_client_poc_authorization(db, db_client)
        
    return db_client


def delete_client(db: Session, slug: str) -> bool:
    from app.modules.projects.repository import get_client_by_slug
    db_client = get_client_by_slug(db, slug)
    if not db_client:
        return False
        
    email_to_revoke = db_client.email
    db.delete(db_client)
    db.commit()
    
    if email_to_revoke:
        from app.modules.users.service import revoke_user_authorization
        revoke_user_authorization(db, email_to_revoke)
        
    return True


def get_feedbacks(db: Session, project_slug: str, video_url: str | None = None):
    from app.modules.projects.models import ProjectFeedback
    query = db.query(ProjectFeedback).filter(ProjectFeedback.project_slug == project_slug)
    if video_url:
        query = query.filter(ProjectFeedback.video_url == video_url)
    return query.order_by(ProjectFeedback.timecode).all()


def create_feedback(db: Session, project_slug: str, req):
    from app.modules.projects.models import ProjectFeedback
    db_feedback = ProjectFeedback(
        project_slug=project_slug,
        video_url=req.video_url,
        user_id=req.user_id,
        timecode=req.timecode,
        position_x=req.position_x,
        position_y=req.position_y,
        content=req.content,
        status=req.status
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)

    # Trigger notification to admin
    from app.modules.notifications import crud as notif_crud, schemas as notif_schemas
    notif_crud.create_notification(db, notif_schemas.NotificationCreate(
        user_id="Admin",
        type="feedback",
        title="Có phản hồi mới",
        message=f"Dự án {project_slug} có feedback mới.",
        link=f"/admin/projects/{project_slug}"
    ))

    # Trigger notification to all crew members assigned to this project's tasks
    from app.modules.projects.models import ProjectTask
    tasks = db.query(ProjectTask).filter(ProjectTask.project_slug == project_slug).all()
    notified_crew = set()
    for t in tasks:
        if t.assignee_name:
            for assignee in t.assignee_name.split(","):
                name = assignee.strip()
                if name and name not in notified_crew:
                    notified_crew.add(name)
                    notif_crud.create_notification(db, notif_schemas.NotificationCreate(
                        user_id=name,
                        type="feedback",
                        title="Có phản hồi mới",
                        message=f"Dự án {project_slug} có feedback mới từ khách hàng.",
                        link=f"/crew-dashboard/projects?project={project_slug}"
                    ))
    
    return db_feedback


def delete_feedback(db: Session, feedback_id: int) -> bool:
    from app.modules.projects.models import ProjectFeedback
    db_feedback = db.query(ProjectFeedback).filter(ProjectFeedback.id == feedback_id).first()
    if not db_feedback:
        return False
    db.delete(db_feedback)
    db.commit()
    return True


def update_feedback_status(db: Session, feedback_id: int, status: str):
    from app.modules.projects.models import ProjectFeedback
    db_feedback = db.query(ProjectFeedback).filter(ProjectFeedback.id == feedback_id).first()
    if not db_feedback:
        return None
    db_feedback.status = status
    db.commit()
    db.refresh(db_feedback)

    # Notify original user
    from app.modules.notifications import crud as notif_crud, schemas as notif_schemas
    notif_crud.create_notification(db, notif_schemas.NotificationCreate(
        user_id=db_feedback.user_id,
        type="feedback",
        title="Cập nhật trạng thái góp ý",
        message=f"Góp ý của bạn trong dự án {db_feedback.project_slug} đã được chuyển thành {status}",
        link=f"/client/projects/{db_feedback.project_slug}/playback"
    ))

    return db_feedback


def reply_feedback(db: Session, feedback_id: int, reply_content: str, reply_author: str):
    from app.modules.projects.models import ProjectFeedback
    from datetime import datetime, timezone
    db_feedback = db.query(ProjectFeedback).filter(ProjectFeedback.id == feedback_id).first()
    if not db_feedback:
        return None
    db_feedback.reply_content = reply_content
    db_feedback.reply_author = reply_author
    db_feedback.reply_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_feedback)

    # Notify original user
    from app.modules.notifications import crud as notif_crud, schemas as notif_schemas
    notif_crud.create_notification(db, notif_schemas.NotificationCreate(
        user_id=db_feedback.user_id,
        type="feedback",
        title="Phản hồi mới từ đội ngũ",
        message=f"{reply_author} đã trả lời góp ý của bạn: {reply_content[:50]}...",
        link=f"/client/projects/{db_feedback.project_slug}/playback"
    ))

    return db_feedback


def get_all_tasks(db: Session):
    from sqlalchemy.orm import joinedload
    from app.modules.projects.models import ProjectTask
    return db.query(ProjectTask).options(joinedload(ProjectTask.project)).all()


def get_project_tasks(db: Session, project_slug: str):
    from app.modules.projects.models import ProjectTask
    return db.query(ProjectTask).filter(ProjectTask.project_slug == project_slug).all()


def create_project_task(db: Session, project_slug: str, task: ProjectTaskCreate) -> ProjectTask:
    from app.modules.projects.models import ProjectTask
    db_task = ProjectTask(
        id=task.id,
        project_slug=project_slug,
        title=task.title,
        assignee_name=task.assignee_name,
        assignee_initials=task.assignee_initials,
        tag=task.tag,
        created_by=task.created_by,
        deadline=task.deadline,
        status=task.status,
        priority=task.priority
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


def update_project_task(db: Session, task_id: str, task_update: ProjectTaskUpdate) -> ProjectTask | None:
    from app.modules.projects.models import ProjectTask
    db_task = db.query(ProjectTask).filter(ProjectTask.id == task_id).first()
    if not db_task:
        return None
    update_data = task_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)
    
    db.commit()
    db.refresh(db_task)
    return db_task


def delete_project_task(db: Session, task_id: str) -> bool:
    from app.modules.projects.models import ProjectTask
    db_task = db.query(ProjectTask).filter(ProjectTask.id == task_id).first()
    if not db_task:
        return False
    db.delete(db_task)
    db.commit()
    return True


def create_approval_request(db: Session, project_slug: str, req: ApprovalRequestCreate):
    from app.modules.projects.models import ApprovalRequest
    db_req = ApprovalRequest(
        id=req.id,
        project_slug=project_slug,
        task_id=req.task_id,
        crew_name=req.crew_name,
        status=req.status,
        timestamp=req.timestamp
    )
    db.add(db_req)
    db.commit()
    db.refresh(db_req)

    # Notify Admin about the new approval request
    from app.modules.notifications import crud as notif_crud, schemas as notif_schemas
    notif_crud.create_notification(db, notif_schemas.NotificationCreate(
        user_id="Admin",
        type="task_approval",
        title="Yêu cầu xét duyệt mới",
        message=f"{req.crew_name} đã gửi yêu cầu xét duyệt cho task trong dự án {project_slug}",
        link=f"/admin/projects/{project_slug}/tasks"
    ))

    return db_req


def get_pending_approval_requests(db: Session, project_slug: str):
    from app.modules.projects.models import ApprovalRequest, ProjectTask
    results = db.query(ApprovalRequest, ProjectTask.title).join(
        ProjectTask, ApprovalRequest.task_id == ProjectTask.id
    ).filter(
        ApprovalRequest.project_slug == project_slug,
        ApprovalRequest.status == "pending"
    ).all()
    
    requests = []
    for req, title in results:
        requests.append({
            "id": req.id,
            "projectId": req.project_slug,
            "taskId": req.task_id,
            "taskLabel": title,
            "crewName": req.crew_name,
            "status": req.status,
            "timestamp": req.timestamp
        })
    return requests


def approve_task_request(db: Session, request_id: str) -> bool:
    from app.modules.projects.models import ApprovalRequest, ProjectTask
    db_req = db.query(ApprovalRequest).filter(ApprovalRequest.id == request_id).first()
    if not db_req:
        return False
    db_req.status = "approved"
    
    db_task = db.query(ProjectTask).filter(ProjectTask.id == db_req.task_id).first()
    if db_task:
        db_task.status = "done"
        
    db.commit()

    # Notify Crew that their task was approved
    from app.modules.notifications import crud as notif_crud, schemas as notif_schemas
    notif_crud.create_notification(db, notif_schemas.NotificationCreate(
        user_id=db_req.crew_name,
        type="task_approval",
        title="Task đã được duyệt",
        message=f"Admin đã duyệt task của bạn trong dự án {db_req.project_slug}",
        link=f"/crew-dashboard/projects"
    ))

    return True


def reject_task_request(db: Session, request_id: str) -> bool:
    from app.modules.projects.models import ApprovalRequest
    db_req = db.query(ApprovalRequest).filter(ApprovalRequest.id == request_id).first()
    if not db_req:
        return False
    db_req.status = "rejected"
    db.commit()

    # Notify Crew that their task was rejected
    from app.modules.notifications import crud as notif_crud, schemas as notif_schemas
    notif_crud.create_notification(db, notif_schemas.NotificationCreate(
        user_id=db_req.crew_name,
        type="task_approval",
        title="Task bị từ chối",
        message=f"Admin đã từ chối task của bạn trong dự án {db_req.project_slug}, vui lòng kiểm tra lại",
        link=f"/crew-dashboard/projects"
    ))

    return True

