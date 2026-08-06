import sys
import os

# Ensure we can import app modules
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.modules.media.models import MediaFolder, MediaAsset
from collections import defaultdict

def merge_duplicate_folders():
    db: Session = SessionLocal()
    
    try:
        # Get all folders
        folders = db.query(MediaFolder).all()
        
        # Group by client, project, parent, and name
        groups = defaultdict(list)
        for f in folders:
            key = (f.client_slug, f.project_slug, f.parent_id, f.name.lower() if f.name else "")
            groups[key].append(f)
            
        merged_count = 0
        deleted_count = 0
        assets_updated = 0
        
        for key, folder_group in groups.items():
            if len(folder_group) <= 1:
                continue
                
            print(f"Found {len(folder_group)} folders for group: {key}")
            
            # Sort by created_at so we keep the oldest one
            folder_group.sort(key=lambda x: x.created_at if x.created_at else getattr(x, 'id'))
            
            primary_folder = folder_group[0]
            duplicates = folder_group[1:]
            
            for dup in duplicates:
                # Update any child folders that point to this duplicate
                child_folders = db.query(MediaFolder).filter(MediaFolder.parent_id == dup.id).all()
                for cf in child_folders:
                    cf.parent_id = primary_folder.id
                
                # Update any assets that point to this duplicate
                assets = db.query(MediaAsset).filter(MediaAsset.folder_id == dup.id).all()
                for a in assets:
                    a.folder_id = primary_folder.id
                    assets_updated += 1
                
                # Update assets that matched by folder string instead of ID
                if dup.project_slug and dup.name:
                    string_assets = db.query(MediaAsset).filter(
                        MediaAsset.project_slug == dup.project_slug,
                        MediaAsset.folder == dup.name,
                        MediaAsset.folder_id.is_(None)
                    ).all()
                    for a in string_assets:
                        a.folder_id = primary_folder.id
                        a.folder = primary_folder.name
                        assets_updated += 1
                
                # Delete the duplicate folder
                db.delete(dup)
                deleted_count += 1
                
            merged_count += 1
            db.commit()
            
        print("--- Merge Summary ---")
        print(f"Groups merged: {merged_count}")
        print(f"Duplicate folders deleted: {deleted_count}")
        print(f"Assets repointed to primary folder: {assets_updated}")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Starting deduplication process...")
    merge_duplicate_folders()
    print("Done!")
