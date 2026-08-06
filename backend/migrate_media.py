import sys
import os
import uuid
from sqlalchemy import text

sys.path.append(os.path.dirname(__file__))

from app.db.session import SessionLocal
from app.modules.media.models import MediaAsset, MediaFolder

def migrate():
    db = SessionLocal()
    
    # 1. Alter table
    print("Altering media_assets table...")
    try:
        db.execute(text("ALTER TABLE media_assets ADD COLUMN folder_id VARCHAR(160) REFERENCES media_folders(id) ON DELETE SET NULL;"))
        db.commit()
    except Exception as e:
        print("Column folder_id might already exist or error:", e)
        db.rollback()
        
    try:
        db.execute(text("ALTER TABLE media_assets ADD COLUMN is_published BOOLEAN DEFAULT 0;"))
        db.commit()
    except Exception as e:
        print("Column is_published might already exist or error:", e)
        db.rollback()
        
    # 2. Migrate string folders to actual DB rows
    print("Migrating string folders to MediaFolder records...")
    assets_with_string_folder = db.query(MediaAsset).filter(
        MediaAsset.folder.isnot(None),
        MediaAsset.folder != "",
        MediaAsset.folder_id.is_(None)
    ).all()
    
    print(f"Found {len(assets_with_string_folder)} assets with legacy string folders.")
    
    created_folders = {}
    
    for asset in assets_with_string_folder:
        client = asset.client_slug
        project = asset.project_slug
        folder_path = asset.folder
        
        key = (client, project, folder_path)
        
        if key not in created_folders:
            parts = folder_path.strip("/").split("/")
            parent_id = None
            current_path = ""
            
            for part in parts:
                current_path = current_path + "/" + part if current_path else part
                part_key = (client, project, current_path)
                
                if part_key not in created_folders:
                    folder_id = str(uuid.uuid4())
                    new_folder = MediaFolder(
                        id=folder_id,
                        name=part.capitalize() if part in ["thumbnail", "demo", "final", "media"] else part,
                        client_slug=client,
                        project_slug=project,
                        parent_id=parent_id,
                        is_published=False
                    )
                    db.add(new_folder)
                    db.flush()
                    created_folders[part_key] = folder_id
                
                parent_id = created_folders[part_key]
                
            asset.folder_id = parent_id
        else:
            asset.folder_id = created_folders[key]
            
    db.commit()
    print(f"Migration complete. Created {len(created_folders)} new folder records.")

if __name__ == "__main__":
    migrate()
