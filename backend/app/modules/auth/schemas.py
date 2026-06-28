from pydantic import BaseModel, EmailStr
from app.modules.users.schemas import UserSummary

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str

class LoginRequest(BaseModel):
    email: EmailStr  # Changed from username to email for standard login
    password: str

class FirebaseAuthRequest(BaseModel):
    id_token: str
    display_name: str | None = None
    photo_url: str | None = None

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class AuthResponse(BaseModel):
    access_token: str
    user: UserSummary
