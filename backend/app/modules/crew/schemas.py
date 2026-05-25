from pydantic import BaseModel

class CrewMember(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    role: str
    avatar: str
    bio: str
    skills_expertise: str
    assigned_projects: int
    status: str
    created_at: str
    updated_at: str


class CrewMemberInput(BaseModel):
    name: str
    email: str
    phone: str
    role: str
    avatar: str
    bio: str
    skills_expertise: str
    assigned_projects: int
    status: str