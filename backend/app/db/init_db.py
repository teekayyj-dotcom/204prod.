from app.db.base import Base, import_models
from app.db.session import engine
from sqlalchemy import text


import time
from sqlalchemy.exc import OperationalError

def init_db() -> None:
    import_models()
    
    max_retries = 10
    for i in range(max_retries):
        try:
            Base.metadata.create_all(bind=engine)
            break
        except OperationalError as e:
            if i == max_retries - 1:
                raise e
            print(f"Database not ready yet, retrying in 2 seconds... ({i+1}/{max_retries})")
            time.sleep(2)
            
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

