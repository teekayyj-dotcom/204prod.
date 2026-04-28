from fastapi import Header, HTTPException, status

from app.core.security import verify_admin_token


def require_admin_token(x_admin_token: str | None = Header(default=None)) -> str:
    if not verify_admin_token(x_admin_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin token is required.",
        )
    return x_admin_token
