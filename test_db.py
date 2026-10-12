import traceback
from app.db.session import SessionLocal
from app.modules.projects.service import update_project
from app.modules.projects.schemas import ProjectUpdate

db = SessionLocal()
try:
    update_project(db, 'chum-tr-tvc', ProjectUpdate(slug='chum-tra-tvc'))
    print("Success")
except Exception as e:
    print(traceback.format_exc())
