import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
import app.main

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.modules.projects.models import Project
from app.modules.media.models import MediaAsset

def cleanup_bogus_projects():
    db = SessionLocal()
    try:
        bogus_names = ['thumbnail', 'final video', 'behind the scenes', 'avatar']
        projects = db.query(Project).all()
        deleted_count = 0
        assets_moved = 0
        
        for p in projects:
            title_clean = p.title.strip().lower()
            if title_clean in bogus_names:
                # Find all assets linked to this bogus project
                assets = db.query(MediaAsset).filter(MediaAsset.project_slug == p.slug).all()
                for a in assets:
                    # Move to client root so no files are lost
                    a.project_slug = None 
                    assets_moved += 1
                
                db.delete(p)
                deleted_count += 1
        
        db.commit()
        print(f"--- Cleanup Summary ---")
        print(f"Bogus projects deleted: {deleted_count}")
        print(f"Assets preserved and moved to client root: {assets_moved}")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == '__main__':
    cleanup_bogus_projects()
