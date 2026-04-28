from pydantic import BaseModel


class UserSummary(BaseModel):
    id: int
    username: str
    role: str
