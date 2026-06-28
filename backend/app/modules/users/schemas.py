from pydantic import BaseModel
from datetime import datetime

class UserSummary(BaseModel):
    id: int
    username: str
    email: str
    display_name: str | None = None
    avatar_url: str | None = None
    role: str

class UserDetail(UserSummary):
    email: str
    active: bool
    created_at: datetime
    updated_at: datetime
