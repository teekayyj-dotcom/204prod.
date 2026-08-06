from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.database_url)
with engine.connect() as conn:
    folders = conn.execute(text("SELECT id, name, created_at, project_slug FROM media_folders WHERE project_slug='aptamil-x-forart-x-204prod-1184' LIMIT 15")).fetchall()
    print("Folders:", folders)
    
    # Check assets
    assets = conn.execute(text("SELECT id, folder, folder_id, created_at FROM media_assets WHERE project_slug='aptamil-x-forart-x-204prod-1184' LIMIT 15")).fetchall()
    print("\nAssets:", assets)
