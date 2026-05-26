from sqlalchemy.orm import Session

from app.modules.categories.repository import list_categories
from app.modules.categories.schemas import Category as CategorySchema
from app.modules.categories.models import Category as CategoryModel

def get_categories(db: Session) -> list[CategoryModel]:
    return list_categories(db)

def get_category_detail(db: Session, id: str) -> CategoryModel | None:
    return db.query(CategoryModel).filter(CategoryModel.slug == id).first()

def create_category(db: Session, category: CategoryModel) -> CategoryModel:
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

def update_category(db: Session, id: str, category: CategorySchema) -> CategoryModel | None:
    existing_category = db.query(CategoryModel).filter(CategoryModel.slug == id).first()
    if not existing_category:
        return None
    existing_category.name = category.name
    existing_category.slug = category.slug
    existing_category.description = category.description
    existing_category.type = category.type
    db.commit()
    db.refresh(existing_category)
    return existing_category

def delete_category(db: Session, id: str) -> bool:
    category = db.query(CategoryModel).filter(CategoryModel.slug == id).first()
    if not category:
        return False
    db.delete(category)
    db.commit()
    return True