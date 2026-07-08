from sqlalchemy.orm import Session
from app.modules.users.repository import list_users
from app.modules.users.schemas import UserSummary, UserDetail
from app.modules.users.models import User

def get_users(db: Session) -> list[UserSummary]:
    return list_users(db)

def get_user_detail(db: Session, id: str):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        return None
    return UserDetail(  
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        active=user.active,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )

def create_user(db: Session, user: User):
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def update_user(db: Session, id: str, user: User):
    existing_user = db.query(User).filter(User.id == id).first()
    if not existing_user:
        return None
    existing_user.name = user.name
    existing_user.email = user.email
    existing_user.role = user.role
    db.commit()
    db.refresh(existing_user)
    return existing_user

def delete_user(db: Session, id: str):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        return None
    db.delete(user)
    db.commit()
    return True

def pre_authorize_user(db: Session, email: str, role: str):
    """
    Pre-authorizes an email for a specific role.
    If the user already exists, updates their role (if it's pending).
    If they don't exist, creates a new user record with no password.
    """
    if not email:
        return None
        
    email = email.strip().lower()
    existing_user = db.query(User).filter(User.email == email).first()
    
    if existing_user:
        # Only upgrade role if they are pending or moving to a higher privilege
        # We assume admin might change their role. For now, if they are pending, we always update.
        if existing_user.role == "pending" or existing_user.role != role:
            existing_user.role = role
            db.commit()
            db.refresh(existing_user)
        return existing_user
        
    # Create new user
    username_base = email.split('@')[0]
    username = username_base
    counter = 1
    while db.query(User).filter(User.username == username).first():
        username = f"{username_base}{counter}"
        counter += 1
        
    new_user = User(
        email=email,
        username=username,
        role=role,
        auth_provider="email",
        password_hash=None, # No password yet
        firebase_uid=None
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

def revoke_user_authorization(db: Session, email: str):
    """
    Revokes authorization for a user by setting their role to 'pending'.
    Used when a crew member or client is deleted.
    Never downgrades a superadmin or admin account to prevent lockouts.
    """
    if not email:
        return None
        
    email = email.strip().lower()
    existing_user = db.query(User).filter(User.email == email).first()
    
    if existing_user and existing_user.role not in ("admin", "superadmin"):
        existing_user.role = "pending"
        db.commit()
        db.refresh(existing_user)
        
    return existing_user
