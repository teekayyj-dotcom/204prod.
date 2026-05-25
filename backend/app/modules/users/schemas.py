from pydantic import BaseModel
from datetime import datetime

class UserSummary(BaseModel):
    id: int
    username: str
    role: str

class UserDetail(UserSummary):
    email: str
    active: bool
    created_at: datetime
    updated_at: datetime
