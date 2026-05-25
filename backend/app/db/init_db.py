from app.db.base import Base, import_models
from app.db.session import engine


def init_db() -> None:
    import_models()
    Base.metadata.create_all(bind=engine)
