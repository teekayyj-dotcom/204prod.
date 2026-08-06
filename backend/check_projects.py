import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
import app.main

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.modules.projects.models import Project

def check():
    db = SessionLocal()
    projects = db.query(Project).all()
    print("--- List of all projects ---")
    for p in projects:
        print(f"Title: '{p.title}', Slug: '{p.slug}', Client: '{p.client_slug}'")
    db.close()

if __name__ == '__main__':
    check()
