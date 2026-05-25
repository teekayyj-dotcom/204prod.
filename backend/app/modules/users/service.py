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
