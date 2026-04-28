from fastapi import APIRouter

from app.modules.categories.service import get_categories

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("")
def list_categories_route():
    return get_categories()
