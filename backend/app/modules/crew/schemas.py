from datetime import datetime
from pydantic import BaseModel

class CrewMember(BaseModel):
    id: int
    name: str
    email: str | None = None
    phone: str | None = None
    role: str | None = None
    avatar: str | None = None
    bio: str | None = None
    skills_expertise: str | None = None
    assigned_projects: int = 0
    status: str = "Active"
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class CrewMemberInput(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None
    role: str | None = None
    avatar: str | None = None
    bio: str | None = None
    skills_expertise: str | None = None
    assigned_projects: int = 0
    status: str = "Active"
    created_at: datetime | None = None