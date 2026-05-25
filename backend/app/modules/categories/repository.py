from sqlalchemy import select
from sqlalchemy.orm import Session
from app.modules.categories.models import Category


def list_categories(db: Session) -> list[Category]:
    return db.scalars(select(Category)).all()
