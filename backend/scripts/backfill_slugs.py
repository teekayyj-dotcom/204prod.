import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.base import import_models
import_models()
from app.db.session import SessionLocal
from app.modules.media.models import MediaAsset, MediaFolder
from app.modules.media.service import generate_unique_media_slug

def backfill():
    db = SessionLocal()
    print("Starting backfill of media folders...")
    folders = db.query(MediaFolder).filter(MediaFolder.slug.is_(None)).all()
    print(f"Found {len(folders)} folders without slug.")
    for folder in folders:
        folder.slug = generate_unique_media_slug(db, folder.name, is_folder=True)
        db.add(folder)
        db.commit()
    
    print("Folder backfill completed.")
    
    print("Starting backfill of media assets...")
    assets = db.query(MediaAsset).filter(MediaAsset.slug.is_(None)).all()
    print(f"Found {len(assets)} assets without slug.")
    for asset in assets:
        # Determine base name from caption, alt, or url filename
        base_name = asset.caption or asset.alt
        if not base_name:
            if asset.url:
                base_name = asset.url.split("/")[-1].split("?")[0]
            else:
                base_name = "asset"
        
        asset.slug = generate_unique_media_slug(db, base_name, is_folder=False)
        db.add(asset)
        db.commit()
        
    print("Asset backfill completed.")
    db.close()

if __name__ == "__main__":
    backfill()
