from app.modules.categories.repository import list_categories
from app.modules.categories.schemas import Category


def get_categories() -> list[Category]:
    return list_categories()
