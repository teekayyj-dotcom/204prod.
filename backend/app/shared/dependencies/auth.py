from fastapi import Header, HTTPException, status, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.core.security import decode_access_token
from app.modules.users.models import User


def require_admin_token(
    x_admin_token: str | None = Header(default=None),
    db: Session = Depends(get_db_session)
) -> str:
    if not x_admin_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin token is required.",
        )
        
    payload = decode_access_token(x_admin_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        )
        
    user_id = payload.get("sub")
    
    # If the token lacks a 'sub' but has an admin role (legacy fallback)
    if not user_id:
        if payload.get("role") in ("admin", "superadmin"):
            return x_admin_token
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required.")
        
    # Verify current role from database to instantly revoke access
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role not in ("admin", "superadmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Admin privileges required. Your role may have been changed."
        )
        
    return x_admin_token

def require_auth_token(
    x_admin_token: str | None = Header(default=None),
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db_session)
) -> User:
    # Accept either x-admin-token or Authorization: Bearer
    token = x_admin_token
    if not token and authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is required.",
        )
        
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        )
        
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload.")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="User not found."
        )
        
    return user
