import sys
import os
import uuid

# Add the backend dir to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.db.session import SessionLocal
from app.modules.media.models import MediaAsset, MediaFolder

def migrate():
    db = SessionLocal()
    
    # Get all distinct (client_slug, project_slug, folder) combinations where folder is not null and folder_id is null
    assets_with_string_folder = db.query(MediaAsset).filter(
        MediaAsset.folder.isnot(None),
        MediaAsset.folder != "",
        MediaAsset.folder_id.is_(None)
    ).all()
    
    print(f"Found {len(assets_with_string_folder)} assets with legacy string folders.")
    
    # Dictionary to keep track of created folders to avoid duplicates
    # Key: (client_slug, project_slug, folder_path)
    created_folders = {}
    
    for asset in assets_with_string_folder:
        client = asset.client_slug
        project = asset.project_slug
        folder_path = asset.folder
        
        key = (client, project, folder_path)
        
        if key not in created_folders:
            # We might have nested paths in the string like "avatar/client"
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
                    db.flush() # flush to get the id
                    created_folders[part_key] = folder_id
                
                parent_id = created_folders[part_key]
                
            # Final parent_id is the folder_id for the asset
            asset.folder_id = parent_id
        else:
            asset.folder_id = created_folders[key]
            
    db.commit()
    print(f"Migration complete. Created {len(created_folders)} new folder records.")

if __name__ == "__main__":
    migrate()
