import sys
import os

# add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.modules.media.models import MediaFolder
from app.database import Base

engine = create_engine('sqlite:///backend/app.db')
Session = sessionmaker(bind=engine)
session = Session()

bad_folders = session.query(MediaFolder).filter(MediaFolder.id == MediaFolder.parent_id).all()
print(f"Found {len(bad_folders)} folders with id == parent_id")
for f in bad_folders:
    print(f"- {f.id} : {f.name}")
    # Fix it
    f.parent_id = None
session.commit()
print("Fixed them by setting parent_id to None.")

