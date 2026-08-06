import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
import app.main

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.modules.media.models import MediaFolder, MediaAsset
from collections import defaultdict

def check_duplicates():
    db = SessionLocal()
    try:
        folders = db.query(MediaFolder).all()
        
        # Group by project_slug, parent_id, and name
        groups = defaultdict(list)
        for f in folders:
            # We ignore client_slug for grouping, because same project = same client anyway.
            # We also strip whitespace and lowercase.
            clean_name = f.name.strip().lower() if f.name else ""
            key = (f.project_slug, f.parent_id, clean_name)
            groups[key].append(f)
            
        merged_count = 0
        deleted_count = 0
        assets_updated = 0
        
        for key, folder_group in groups.items():
            if len(folder_group) <= 1:
                continue
                
            print(f"Group {key} has {len(folder_group)} folders!")
            
            # Sort by created_at to keep the oldest
            folder_group.sort(key=lambda x: x.created_at if x.created_at else getattr(x, 'id'))
            primary = folder_group[0]
            duplicates = folder_group[1:]
            
            for dup in duplicates:
                # Reassign child folders
                child_folders = db.query(MediaFolder).filter(MediaFolder.parent_id == dup.id).all()
                for cf in child_folders:
                    cf.parent_id = primary.id
                
                # Reassign assets by folder_id
                assets = db.query(MediaAsset).filter(MediaAsset.folder_id == dup.id).all()
                for a in assets:
                    a.folder_id = primary.id
                    assets_updated += 1
                    
                # Reassign assets by folder string
                if dup.project_slug and dup.name:
                    string_assets = db.query(MediaAsset).filter(
                        MediaAsset.project_slug == dup.project_slug,
                        MediaAsset.folder == dup.name,
                        MediaAsset.folder_id.is_(None)
                    ).all()
                    for a in string_assets:
                        a.folder_id = primary.id
                        a.folder = primary.name
                        assets_updated += 1
                
                db.delete(dup)
                deleted_count += 1
                
            merged_count += 1
            db.commit()
            
        print("--- Merge Summary ---")
        print(f"Groups merged: {merged_count}")
        print(f"Duplicate folders deleted: {deleted_count}")
        print(f"Assets repointed to primary folder: {assets_updated}")
        
    finally:
        db.close()

if __name__ == '__main__':
    check_duplicates()
