from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.modules.auth.schemas import (
    RegisterRequest,
    LoginRequest,
    FirebaseAuthRequest,
    ChangePasswordRequest,
    AuthResponse,
)
from app.modules.auth.service import (
    register_user,
    login_user,
    firebase_auth,
    change_password,
)
from app.shared.dependencies.auth import require_admin_token # Assuming we might need a generic require_auth later

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=AuthResponse)
def register_route(payload: RegisterRequest, db: Session = Depends(get_db_session)):
    return register_user(db, payload)

@router.post("/login", response_model=AuthResponse)
def login_route(payload: LoginRequest, db: Session = Depends(get_db_session)):
    return login_user(db, payload)

@router.post("/firebase", response_model=AuthResponse)
def firebase_route(payload: FirebaseAuthRequest, db: Session = Depends(get_db_session)):
    return firebase_auth(db, payload)

# Note: Ideally change-password should be protected by a `require_auth` dependency
# For now, keeping it simple as we haven't implemented full JWT auth middleware yet.
# To do it properly, we'd extract the user_id from the JWT token.
# Here we'll just mock it or assume the frontend passes the token.
# Let's add a basic header check for now.
from fastapi import Header, HTTPException
from app.core.security import decode_access_token

def get_current_user_id(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return int(payload["sub"])

@router.post("/change-password")
def change_password_route(
    payload: ChangePasswordRequest, 
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db_session)
):
    return change_password(db, user_id, payload)
