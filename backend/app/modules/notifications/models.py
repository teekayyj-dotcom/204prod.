from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, func
from app.db.base import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), nullable=False, index=True) # Who receives the notification (username/email/role)
    type = Column(String(50), nullable=False) # e.g., 'feedback', 'task', 'invoice'
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    link = Column(String(500), nullable=True) # Link to redirect when clicked
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
