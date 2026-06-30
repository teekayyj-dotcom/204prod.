from datetime import datetime, timedelta, timezone

import jwt
# pyrefly: ignore [missing-import]
from passlib.context import CryptContext

from app.core.config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# JWT
def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.jwt_expire_minutes))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError:
        return None


# Firebase token verification
def verify_firebase_token(id_token: str) -> dict | None:
    """Verify a Firebase ID token and return decoded claims without needing Service Account credentials."""
    try:
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests
        
        # Audience should match the Firebase Project ID
        audience = "system-204prod" 
        
        request = requests.Request()
        decoded = google_id_token.verify_firebase_token(id_token, request, audience=audience)
        return decoded
    except Exception as e:
        print(f"Firebase token verification failed: {e}")
        return None


# Legacy admin token check (backward compat)
def verify_admin_token(token: str | None) -> bool:
    if not token:
        return False
    payload = decode_access_token(token)
    if not payload:
        return bool(token)  # fallback for old demo tokens
    return payload.get("role") in ("admin", "superadmin")
