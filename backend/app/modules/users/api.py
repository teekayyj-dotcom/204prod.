from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db_session
from app.modules.auth.dependencies import require_admin_token
from app.modules.users.service import get_users, update_user
from app.modules.users.models import User

router = APIRouter(prefix="/users", tags=["users"])

class UserRoleUpdate(BaseModel):
    role: str

@router.get("")
def list_users_route(db: Session = Depends(get_db_session), _: str = Depends(require_admin_token)):
    return get_users(db)

@router.get("/by-email/{email}")
def get_user_by_email_route(
    email: str,
    db: Session = Depends(get_db_session),
    _: str = Depends(require_admin_token)
):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user.id, "email": user.email, "role": user.role}


@router.put("/{user_id}/role")
def update_user_role_route(
    user_id: int, 
    payload: UserRoleUpdate, 
    db: Session = Depends(get_db_session), 
    _: str = Depends(require_admin_token)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = payload.role
    db.commit()
    db.refresh(user)
    return {"message": "Role updated successfully"}

@router.put("/by-email/{email}/role")
def update_user_role_by_email_route(
    email: str,
    payload: UserRoleUpdate,
    db: Session = Depends(get_db_session),
    _: str = Depends(require_admin_token)
):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = payload.role
    db.commit()
    db.refresh(user)
    return {"message": "Role updated successfully", "role": user.role}
