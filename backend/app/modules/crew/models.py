from datetime import datetime
from app.db.base import Base
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

class CrewMember(Base):
    __tablename__ = "crew_members"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String)
    phone = Column(String)
    role = Column(String)
    avatar = Column(String)
    bio = Column(String)
    skills_expertise = Column(String)
    assigned_projects = Column(Integer, default=0)
    status = Column(String, default="available")   # available, busy, on_leave, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<CrewMember {self.name}>"  