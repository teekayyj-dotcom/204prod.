from sqlalchemy.orm import Session

from app.modules.crew.models import CrewMember

class CrewRepository:
    def get_all(self, db: Session):
        return db.query(CrewMember).all()
    
    def get_by_id(self, db: Session, id: str):
        return db.query(CrewMember).filter(CrewMember.id == id).first()
    
    def create(self, db: Session, crew_member: CrewMember):
        db.add(crew_member)
        db.commit()
        db.refresh(crew_member)
        return crew_member
    
    def update(self, db: Session, id: str, crew_member: CrewMember):
        existing_crew_member = self.get_by_id(db, id)
        if not existing_crew_member:
            return None
        existing_crew_member.name = crew_member.name
        existing_crew_member.email = crew_member.email
        existing_crew_member.phone = crew_member.phone
        existing_crew_member.role = crew_member.role
        existing_crew_member.avatar = crew_member.avatar
        existing_crew_member.bio = crew_member.bio
        existing_crew_member.skills_expertise = crew_member.skills_expertise
        existing_crew_member.assigned_projects = crew_member.assigned_projects
        existing_crew_member.status = crew_member.status
        db.commit()
        db.refresh(existing_crew_member)
        return existing_crew_member
    
    def delete(self, db: Session, id: str):
        crew_member = self.get_by_id(db, id)
        if not crew_member:
            return None
        db.delete(crew_member)
        db.commit()
        return True

crew_repository = CrewRepository()
