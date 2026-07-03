from app.db.base import Base, import_models
from app.db.session import engine
from sqlalchemy import text


def init_db() -> None:
    import_models()
    Base.metadata.create_all(bind=engine)
    
    # Auto-add budget column to projects table if missing
    with engine.begin() as conn:
        try:
            conn.execute(text("SELECT budget FROM projects LIMIT 1"))
        except Exception:
            try:
                conn.execute(text("ALTER TABLE projects ADD COLUMN budget VARCHAR(100) DEFAULT 'TBD'"))
            except Exception as e:
                print(f"Error adding budget column to projects: {e}")

