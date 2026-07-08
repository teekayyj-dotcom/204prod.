from sqlalchemy.orm import Session
from app.modules.crew.models import CrewMember

from app.modules.projects.models import ProjectCredit
from app.modules.users.service import pre_authorize_user

def get_crew_members(db: Session):
    members = db.query(CrewMember).all()
    for m in members:
        count = db.query(ProjectCredit).filter(ProjectCredit.name == m.name).count()
        m.assigned_projects = count
    return members

def get_crew_member_by_id(db: Session, id: int):
    return db.query(CrewMember).filter(CrewMember.id == id).first()

def create_crew_member(db: Session, crew_member: CrewMember):
    db.add(crew_member)
    db.commit()
    db.refresh(crew_member)
    
    if crew_member.email:
        pre_authorize_user(db, crew_member.email, "crew")
        
    return crew_member

def update_crew_member(db: Session, id: int, crew_member: CrewMember):
    existing_crew_member = db.query(CrewMember).filter(CrewMember.id == id).first()
    if not existing_crew_member:
        return None
    existing_crew_member.name = crew_member.name
    existing_crew_member.email = crew_member.email
    existing_crew_member.phone = crew_member.phone
    existing_crew_member.role = crew_member.role
    if crew_member.avatar is not None and crew_member.avatar != existing_crew_member.avatar:
        existing_crew_member.avatar = crew_member.avatar
        existing_crew_member.avatar_locked = True
    existing_crew_member.bio = crew_member.bio
    existing_crew_member.skills_expertise = crew_member.skills_expertise
    existing_crew_member.assigned_projects = crew_member.assigned_projects
    existing_crew_member.status = crew_member.status
    existing_crew_member.work_mode = crew_member.work_mode
    if crew_member.created_at:
        existing_crew_member.created_at = crew_member.created_at
    db.commit()
    db.refresh(existing_crew_member)
    
    if existing_crew_member.email:
        pre_authorize_user(db, existing_crew_member.email, "crew")
        
    return existing_crew_member

def delete_crew_member(db: Session, id: int):
    crew_member = db.query(CrewMember).filter(CrewMember.id == id).first()
    if not crew_member:
        return None
        
    email_to_revoke = crew_member.email
    db.delete(crew_member)
    db.commit()
    
    if email_to_revoke:
        from app.modules.users.service import revoke_user_authorization
        revoke_user_authorization(db, email_to_revoke)
        
    return True
