from fastapi import APIRouter

from app.modules.auth.schemas import LoginRequest
from app.modules.auth.service import login

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login_route(payload: LoginRequest):
    return login(payload)
