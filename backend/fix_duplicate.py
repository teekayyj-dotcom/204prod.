from app.db.session import SessionLocal
from app.modules.projects.models import ProjectCredit
from app.modules.categories.models import Category

db = SessionLocal()
credit = db.query(ProjectCredit).get(119)
if credit:
    db.delete(credit)
    db.commit()
    print("Deleted duplicate credit 119.")
else:
    print("Credit 119 not found.")
