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

def pre_authorize_user(db: Session, email: str, role: str, display_name: str = None, avatar_url: str = None):
    """
    Pre-authorizes an email for a specific role.
    If the user already exists, updates their role (if it's pending) and syncs their profile.
    If they don't exist, creates a new user record with no password.
    """
    if not email:
        return None
        
    email = email.strip().lower()
    
    import hashlib
    md5_hash = hashlib.md5(email.encode('utf-8')).hexdigest()
    default_avatar = f"https://www.gravatar.com/avatar/{md5_hash}?d=identicon"
    final_avatar = avatar_url if avatar_url else default_avatar

    existing_user = db.query(User).filter(User.email == email).first()
    
    if existing_user:
        changed = False
        if display_name and existing_user.display_name != display_name:
            existing_user.display_name = display_name
            changed = True
        if avatar_url and existing_user.avatar_url != avatar_url:
            existing_user.avatar_url = avatar_url
            changed = True
        elif not existing_user.avatar_url:
            existing_user.avatar_url = final_avatar
            changed = True
            
        # Only upgrade role if they are pending
        if existing_user.role == "pending":
            existing_user.role = role
            changed = True
            
        if changed:
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
        firebase_uid=None,
        display_name=display_name,
        avatar_url=final_avatar
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

def sync_users_from_crew(db: Session):
    """
    Syncs display_name and avatar_url from CrewMember to User.
    This ensures that when a crew member's profile is updated, their user profile matches.
    """
    from app.modules.crew.models import CrewMember
    crew_members = db.query(CrewMember).all()
    for crew in crew_members:
        if crew.email:
            pre_authorize_user(db, crew.email, "crew", crew.name, crew.avatar)

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
