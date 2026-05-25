from sqlalchemy import select
from sqlalchemy.orm import Session
from app.modules.users.models import User


def list_users(db: Session) -> list[User]:
    return db.scalars(select(User)).all()
