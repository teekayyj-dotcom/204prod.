from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.modules.categories.service import (
    get_categories,
    create_category,
    get_category_detail,
    update_category,
    delete_category,
)
from app.modules.categories.schemas import Category as CategorySchema
from app.modules.categories.models import Category as CategoryModel

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("")
def list_categories_route(db: Session = Depends(get_db_session)):
    return get_categories(db)


@router.get("/{slug}")
def get_category_route(slug: str, db: Session = Depends(get_db_session)):
    category = get_category_detail(db, slug)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category


@router.post("", status_code=status.HTTP_201_CREATED)
def create_category_route(category: CategorySchema, db: Session = Depends(get_db_session)):
    db_category = CategoryModel(
        name=category.name,
        slug=category.slug,
        description=category.description,
        type=category.type,
    )
    return create_category(db, db_category)


@router.put("/{slug}")
def update_category_route(slug: str, category: CategorySchema, db: Session = Depends(get_db_session)):
    updated = update_category(db, slug, category)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return updated


from sqlalchemy.exc import IntegrityError

@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category_route(slug: str, db: Session = Depends(get_db_session)):
    try:
        success = delete_category(db, slug)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete category because it is currently associated with one or more projects."
        )
    return None

