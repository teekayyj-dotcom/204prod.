from sqlalchemy.orm import Session
from sqlalchemy import func
from app.modules.users.models import User
from app.modules.messaging.models import Conversation, ConversationParticipant

def sync_project_group_chat(db: Session, project_slug: str, project_title: str) -> Conversation:
    """
    Creates or updates a group chat for a project.
    Ensures all active Admins, Crew members, and Kanban assignees are participants.
    """
    conv = db.query(Conversation).filter_by(project_slug=project_slug, is_group=True).first()
    
    conv_name = f"Project: {project_title}"
    if not conv:
        # Fallback to name match for backward compatibility
        conv = db.query(Conversation).filter_by(name=conv_name, is_group=True).first()
        if conv:
            conv.project_slug = project_slug
            db.commit()

    if not conv:
        conv = Conversation(is_group=True, name=conv_name, project_slug=project_slug)
        db.add(conv)
        db.commit()
        db.refresh(conv)

    # 1. Get all assigned crew members from ProjectCredit
    from app.modules.projects.models import ProjectCredit, ProjectTask
    credits = db.query(ProjectCredit).filter(ProjectCredit.project_slug == project_slug).all()
    crew_ids = [c.crew_id for c in credits if c.crew_id is not None]
    crew_names = [c.name.strip() for c in credits if c.crew_id is None and c.name]

    # 2. Get all Kanban assignees
    tasks = db.query(ProjectTask).filter(ProjectTask.project_slug == project_slug).all()
    assignee_names = []
    for t in tasks:
        if t.assignee_name:
            names = [n.strip() for n in t.assignee_name.split(",") if n.strip()]
            assignee_names.extend(names)
    
    # Combine names from Kanban and Credits
    all_names_to_resolve = list(set(assignee_names + crew_names))
    
    resolved_user_ids = []
    if all_names_to_resolve:
        named_users = db.query(User).filter(User.display_name.in_(all_names_to_resolve), User.active == True).all()
        resolved_user_ids = [u.id for u in named_users]

    final_crew_ids = []
    if crew_ids:
        # Verify they are actually active users, regardless of system role
        crew_users = db.query(User).filter(
            User.active == True,
            User.id.in_(crew_ids)
        ).all()
        final_crew_ids = [u.id for u in crew_users]

    # Only include users who are actually assigned to the project (crew or kanban)
    desired_participant_ids = set(final_crew_ids + resolved_user_ids)

    # 4. Sync participants
    existing_participants = db.query(ConversationParticipant).filter_by(conversation_id=conv.id).all()
    existing_participant_ids = {p.user_id for p in existing_participants}

    # Add missing
    missing_ids = desired_participant_ids - existing_participant_ids
    for uid in missing_ids:
        db.add(ConversationParticipant(conversation_id=conv.id, user_id=uid))

    # Remove extra
    extra_ids = existing_participant_ids - desired_participant_ids
    if extra_ids:
        db.query(ConversationParticipant).filter(
            ConversationParticipant.conversation_id == conv.id,
            ConversationParticipant.user_id.in_(extra_ids)
        ).delete(synchronize_session=False)

    db.commit()
    db.refresh(conv)
    return conv

