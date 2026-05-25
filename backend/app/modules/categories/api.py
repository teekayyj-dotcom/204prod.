from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.modules.categories.service import get_categories

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("")
def list_categories_route(db: Session = Depends(get_db_session)):
    return get_categories(db)
