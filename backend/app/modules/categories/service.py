from sqlalchemy.orm import Session

from app.modules.categories.repository import list_categories
from app.modules.categories.schemas import Category, CategoryDetail
from app.modules.categories.models import Category

def get_categories(db: Session) -> list[Category]:
    return list_categories(db)

def get_category_detail(db: Session, id: str):
    category = db.query(Category).filter(Category.slug == id).first()
    if not category:
        return None
    return CategoryDetail(
        id=category.id,
        name=category.name,
        slug=category.slug,
        created_at=category.created_at,
        updated_at=category.updated_at,
    )

def create_category(db: Session, category: Category):
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

def update_category(db: Session, id: str, category: Category):
    existing_category = db.query(Category).filter(Category.slug == id).first()
    if not existing_category:
        return None
    existing_category.name = category.name
    existing_category.slug = category.slug
    db.commit()
    db.refresh(existing_category)
    return existing_category

def delete_category(db: Session, id: str):
    category = db.query(Category).filter(Category.slug == id).first()
    if not category:
        return None
    db.delete(category)
    db.commit()
    return True