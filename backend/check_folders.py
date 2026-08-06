import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import SQLALCHEMY_DATABASE_URL
from app.modules.media.models import DbMediaFolder

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

folders = db.query(DbMediaFolder).all()
print(f"Total folders: {len(folders)}")
for f in folders[:20]:
    print(f"- {f.name} (project: {f.project_slug}, parent: {f.parent_id})")
