from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.modules.auth.schemas import (
    RegisterRequest,
    LoginRequest,
    FirebaseAuthRequest,
    ChangePasswordRequest,
    AuthResponse,
)
from app.modules.users.models import User
from app.modules.users.schemas import UserSummary
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    verify_firebase_token,
)

def _create_auth_response(user: User) -> AuthResponse:
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role}
    )
    return AuthResponse(
        access_token=access_token,
        user=UserSummary(
            id=user.id, 
            username=user.username or user.email, 
            email=user.email,
            display_name=user.display_name,
            avatar_url=user.avatar_url,
            role=user.role
        ),
    )

def register_user(db: Session, payload: RegisterRequest) -> AuthResponse:
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered"
        )

    user = User(
        email=payload.email,
        username=payload.username,
        password_hash=hash_password(payload.password),
        auth_provider="email",
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return _create_auth_response(user)

def login_user(db: Session, payload: LoginRequest) -> AuthResponse:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    return _create_auth_response(user)

def firebase_auth(db: Session, payload: FirebaseAuthRequest) -> AuthResponse:
    decoded_token = verify_firebase_token(payload.id_token)
    if not decoded_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Firebase token",
        )

    firebase_uid = decoded_token.get("uid") or decoded_token.get("user_id") or decoded_token.get("sub")
    email = decoded_token.get("email")
    display_name = payload.display_name or decoded_token.get("name")
    avatar_url = payload.photo_url or decoded_token.get("picture")
    
    # Determine auth provider from firebase
    provider_id = "firebase" # Default fallback
    if "firebase" in decoded_token and "sign_in_provider" in decoded_token["firebase"]:
        provider_id = decoded_token["firebase"]["sign_in_provider"]
    
    auth_provider = "google" if provider_id == "google.com" else "email"

    import hashlib
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email not provided in token"
        )

    # Use Gravatar as fallback if Firebase didn't provide a picture
    if not avatar_url:
        md5_hash = hashlib.md5(email.strip().lower().encode('utf-8')).hexdigest()
        avatar_url = f"https://www.gravatar.com/avatar/{md5_hash}?d=identicon"

    # 1. Try to find user by firebase_uid
    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    
    is_admin_uid = (firebase_uid == "F9EfRJmOX7ShH96AhxnZ6wHovPn1")
    
    if user:
        if is_admin_uid and user.role != "admin":
            user.role = "admin"
            db.commit()
            db.refresh(user)
    else:
        # 2. Try to find by email (if they registered normally, then logged in via Google)
        user = db.query(User).filter(User.email == email).first()
        if user:
            # Update existing user to link Firebase
            user.firebase_uid = firebase_uid
            user.auth_provider = auth_provider
            if is_admin_uid:
                user.role = "admin"
            db.commit()
            db.refresh(user)
        else:
            # 3. Create new user
            username_base = email.split('@')[0]
            username = username_base
            # Ensure unique username
            counter = 1
            while db.query(User).filter(User.username == username).first():
                username = f"{username_base}{counter}"
                counter += 1
                
            user = User(
                email=email,
                username=username, # Auto-generate from email
                firebase_uid=firebase_uid,
                auth_provider=auth_provider,
                display_name=display_name,
                avatar_url=avatar_url,
                password_hash=None, # No password for external providers
                role="admin" if is_admin_uid else "pending"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

    # Always update display name and avatar if not present or changed
    needs_commit = False
    if display_name and not user.display_name:
        user.display_name = display_name
        needs_commit = True
        
    if avatar_url:
        if user.avatar_url != avatar_url:
            user.avatar_url = avatar_url
            needs_commit = True
            
        # Also sync avatar to Crew table
        from app.modules.crew.models import CrewMember
        crew = db.query(CrewMember).filter(CrewMember.email == email).first()
        if crew and crew.avatar != avatar_url:
            crew.avatar = avatar_url
            needs_commit = True
            
    if needs_commit:
        db.commit()
        db.refresh(user)

    return _create_auth_response(user)

def change_password(db: Session, user_id: int, payload: ChangePasswordRequest):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    if not user.password_hash or not verify_password(payload.old_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect old password",
        )
        
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password updated successfully"}
