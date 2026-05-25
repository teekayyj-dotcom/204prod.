from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


def import_models() -> None:
    """Import ORM models so Alembic and metadata creation can discover them."""
    from app.modules.categories import models as _category_models  # noqa: F401
    from app.modules.contacts import models as _contact_models  # noqa: F401
    from app.modules.crew import models as _crew_models  # noqa: F401
    from app.modules.media import models as _media_models  # noqa: F401
    from app.modules.projects import models as _project_models  # noqa: F401
    from app.modules.users import models as _user_models  # noqa: F401
