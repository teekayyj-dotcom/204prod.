from sqlalchemy.orm import Session
from sqlalchemy import func
from app.modules.users.models import User
from app.modules.messaging.models import Conversation, ConversationParticipant

def sync_project_group_chat(db: Session, project_slug: str, project_title: str, crew_ids: list[int] = None) -> Conversation:
    """
    Creates or updates a group chat for a project.
    Ensures all active Admins and the specific Crew members are participants.
    """
    conv_name = f"Project: {project_title}"
    conv = db.query(Conversation).filter_by(name=conv_name, is_group=True).first()
    
    if not conv:
        conv = Conversation(is_group=True, name=conv_name)
        db.add(conv)
        db.commit()
        db.refresh(conv)

    # 1. Get all Admins
    admins = db.query(User).filter(User.role == "admin", User.active == True).all()
    admin_ids = [a.id for a in admins]

    # 2. Get all assigned crew members by their exact IDs
    final_crew_ids = []
    if crew_ids:
        # Verify they are actually active crew/editors
        crew_users = db.query(User).filter(
            User.active == True,
            User.role.in_(["crew", "editor", "outsource"]),
            User.id.in_(crew_ids)
        ).all()
        final_crew_ids = [u.id for u in crew_users]

    desired_participant_ids = set(admin_ids + final_crew_ids)

    # 3. Sync participants
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
