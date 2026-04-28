from app.modules.categories.schemas import Category


def list_categories() -> list[Category]:
    return [
        Category(name="Fashion", slug="fashion"),
        Category(name="Brand Film", slug="brand-film"),
        Category(name="Documentary", slug="documentary"),
    ]
