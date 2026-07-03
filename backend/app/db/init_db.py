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

    # Auto-add published column to project_gallery_images table if missing
    with engine.begin() as conn:
        try:
            conn.execute(text("SELECT published FROM project_gallery_images LIMIT 1"))
        except Exception:
            try:
                conn.execute(text("ALTER TABLE project_gallery_images ADD COLUMN published BOOLEAN DEFAULT TRUE"))
            except Exception as e:
                print(f"Error adding published column to project_gallery_images: {e}")

