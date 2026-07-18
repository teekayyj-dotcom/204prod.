from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class NotificationBase(BaseModel):
    user_id: str
    type: str
    title: str
    message: str
    link: Optional[str] = None
    is_read: Optional[bool] = False

class NotificationCreate(NotificationBase):
    pass

class NotificationResponse(NotificationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
