from fastapi import APIRouter, Depends, HTTPException, status, Body, Query
from sqlalchemy.orm import Session
from fastapi_pagination import Page
from fastapi_pagination.customization import CustomizedPage, UseParamsFields
from app.db.session import get_db_session
from app.modules.projects.service import get_project, get_projects, create_project, delete_project, update_project
from app.modules.projects.schemas import (
    ApprovalRequestCreate,
    ProjectCreate,
    ProjectDetail,
    ProjectUpdate,
    ClientCreate,
    ClientUpdate,
    ProjectFeedbackCreate,
    ProjectTaskCreate,
    ProjectTaskUpdate,
    ProjectCommentCreate,
    ReviewLinkResponse,
    ReviewLinkPublic
)

router = APIRouter(prefix="/projects", tags=["projects"])


ProjectPage = CustomizedPage[
    Page[ProjectDetail],
    UseParamsFields(size=Query(50, ge=1, le=1000))
]

@router.get("", response_model=ProjectPage)
def list_projects_route(
    search: str | None = Query(None),
    status: str | None = Query(None),
    format_name: str | None = Query(None),
    featured: bool | None = Query(None),
    sort_by: str | None = Query(None),
    db: Session = Depends(get_db_session)
):
    return get_projects(
        db, 
        search=search, 
        status=status, 
        format_name=format_name, 
        featured=featured, 
        sort_by=sort_by
    )

@router.get("/all", response_model=list[ProjectDetail])
def list_all_projects_route(db: Session = Depends(get_db_session)):
    from app.modules.projects.models import Project, Client, ProjectGalleryImage
    from app.modules.projects.repository import _map_to_detail
    from sqlalchemy import select
    from sqlalchemy.orm import joinedload

    stmt = select(Project).options(
        joinedload(Project.client).joinedload(Client.logo_media),
        joinedload(Project.format_category),
        joinedload(Project.cover_media),
        joinedload(Project.credits),
        joinedload(Project.gallery_images).joinedload(ProjectGalleryImage.media_asset)
    ).order_by(Project.created_at.desc())
    
    projects = db.scalars(stmt).unique().all()
    return [_map_to_detail(p) for p in projects]

@router.get("/clients/all")
def list_clients_route(db: Session = Depends(get_db_session)):
    from app.modules.projects.service import get_clients
    return get_clients(db)


@router.post("/clients", status_code=status.HTTP_201_CREATED)
def create_client_route(req: ClientCreate, db: Session = Depends(get_db_session)):
    from app.modules.projects.service import create_client
    from sqlalchemy.exc import IntegrityError
    try:
        return create_client(db, req)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Client name already exists")

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


@router.post("", response_model=ProjectDetail, status_code=status.HTTP_201_CREATED)
def create_project_route(req: ProjectCreate, db: Session = Depends(get_db_session)):
    new_proj = create_project(db, req)
    from app.modules.projects.repository import get_project_by_slug
    return get_project_by_slug(db, new_proj.slug)


@router.put("/{slug}", response_model=ProjectDetail)
def update_project_route(slug: str, req: ProjectUpdate, db: Session = Depends(get_db_session)):
    updated = update_project(db, slug, req)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    from app.modules.projects.repository import get_project_by_slug
    return get_project_by_slug(db, updated.slug)


@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project_route(slug: str, db: Session = Depends(get_db_session)):
    success = delete_project(db, slug)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return None


@router.get("/{slug}/review-link", response_model=ReviewLinkResponse)
def get_review_link_route(slug: str, video_url: str = Query(...), db: Session = Depends(get_db_session)):
    from app.modules.projects.service import get_or_create_review_link
    link = get_or_create_review_link(db, slug, video_url)
    from app.core.config import settings
    # Assuming frontend is hosted at frontend_origin
    frontend_url = settings.frontend_origin.rstrip("/")
    return {
        "token": link.token,
        "url": f"{frontend_url}/review/{link.token}",
        "project_slug": link.project_slug,
        "video_url": link.video_url
    }

@router.get("/public/review/{token}", response_model=ReviewLinkPublic)
def public_review_link_route(token: str, db: Session = Depends(get_db_session)):
    from app.modules.projects.service import get_review_link_by_token, get_project_by_slug_orm
    link = get_review_link_by_token(db, token)
    if not link:
        raise HTTPException(status_code=404, detail="Review link not found or expired")
    
    project = get_project_by_slug_orm(db, link.project_slug)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    from app.modules.projects.models import ProjectGalleryImage
    from app.modules.media.models import MediaAsset

    is_published = project.published
    gallery_img = db.query(ProjectGalleryImage).join(MediaAsset).filter(
        ProjectGalleryImage.project_slug == link.project_slug,
        MediaAsset.url == link.video_url
    ).first()
    
    if gallery_img:
        is_published = gallery_img.published
    else:
        is_published = True

    return {
        "token": link.token,
        "project_slug": link.project_slug,
        "video_url": link.video_url,
        "published": is_published
    }

@router.get("/{slug}/feedback")
def list_feedback_route(slug: str, video_url: str | None = Query(None), db: Session = Depends(get_db_session)):
    from app.modules.projects.service import get_feedbacks
    return get_feedbacks(db, slug, video_url)


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


@router.get("/tasks/all")
def get_all_tasks_route(db: Session = Depends(get_db_session)):
    from app.modules.projects.service import get_all_tasks
    return get_all_tasks(db)


@router.get("/{slug}/tasks")
def get_project_tasks_route(slug: str, db: Session = Depends(get_db_session)):
    from app.modules.projects.service import get_project_tasks
    return get_project_tasks(db, slug)


@router.post("/{slug}/tasks", status_code=status.HTTP_201_CREATED)
def create_project_task_route(slug: str, req: ProjectTaskCreate, db: Session = Depends(get_db_session)):
    from app.modules.projects.service import create_project_task
    try:
        return create_project_task(db, slug, req)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/tasks/{task_id}")
def update_project_task_route(task_id: str, req: ProjectTaskUpdate, db: Session = Depends(get_db_session)):
    from app.modules.projects.service import update_project_task
    updated = update_project_task(db, task_id, req)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return updated


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project_task_route(task_id: str, db: Session = Depends(get_db_session)):
    from app.modules.projects.service import delete_project_task
    success = delete_project_task(db, task_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return None


@router.get("/{slug}/approval-requests")
def get_pending_approval_requests_route(slug: str, db: Session = Depends(get_db_session)):
    from app.modules.projects.service import get_pending_approval_requests
    return get_pending_approval_requests(db, slug)


@router.post("/{slug}/approval-requests", status_code=status.HTTP_201_CREATED)
def create_approval_request_route(slug: str, req: ApprovalRequestCreate, db: Session = Depends(get_db_session)):
    from app.modules.projects.service import create_approval_request
    return create_approval_request(db, slug, req)


@router.put("/approval-requests/{req_id}/approve")
def approve_task_request_route(req_id: str, db: Session = Depends(get_db_session)):
    from app.modules.projects.service import approve_task_request
    success = approve_task_request(db, req_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval request not found")
    return {"message": "Request approved successfully"}


@router.put("/approval-requests/{req_id}/reject")
def reject_task_request_route(req_id: str, db: Session = Depends(get_db_session)):
    from app.modules.projects.service import reject_task_request
    success = reject_task_request(db, req_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval request not found")
    return {"message": "Request rejected successfully"}


@router.put("/gallery/{media_asset_id}/publish")
def toggle_gallery_image_publish(media_asset_id: str, published: bool, db: Session = Depends(get_db_session)):
    from app.modules.projects.models import ProjectGalleryImage
    img = db.query(ProjectGalleryImage).filter(ProjectGalleryImage.media_asset_id == media_asset_id).first()
    if not img:
        raise HTTPException(status_code=404, detail="Gallery image not found")
    img.published = published
    db.commit()
    return {"status": "ok", "media_asset_id": media_asset_id, "published": published}


@router.delete("/gallery/{media_asset_id}")
def delete_gallery_image(media_asset_id: str, db: Session = Depends(get_db_session)):
    from app.modules.projects.models import ProjectGalleryImage
    img = db.query(ProjectGalleryImage).filter(ProjectGalleryImage.media_asset_id == media_asset_id).first()
    if not img:
        raise HTTPException(status_code=404, detail="Gallery image not found")
    db.delete(img)
    db.commit()
    return {"status": "ok", "deleted_id": media_asset_id}

@router.get("/{slug}/activities")
def get_project_activities_route(slug: str, db: Session = Depends(get_db_session)):
    from app.modules.projects.models import ProjectActivity
    activities = db.query(ProjectActivity).filter(ProjectActivity.project_slug == slug).order_by(ProjectActivity.created_at.desc()).all()
    return activities


@router.get("/{slug}/comments")
def get_project_comments_route(slug: str, db: Session = Depends(get_db_session)):
    from app.modules.projects.models import ProjectComment
    comments = db.query(ProjectComment).filter(ProjectComment.project_slug == slug).order_by(ProjectComment.created_at.desc()).all()
    return comments


@router.post("/{slug}/comments", status_code=status.HTTP_201_CREATED)
def create_project_comment_route(slug: str, req: ProjectCommentCreate, db: Session = Depends(get_db_session)):
    from app.modules.projects.models import ProjectComment, Project
    project = db.query(Project).filter(Project.slug == slug).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    comment = ProjectComment(
        project_slug=slug,
        user_name=req.user_name,
        text=req.text,
        avatar=req.avatar
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment
