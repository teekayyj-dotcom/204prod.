from app.db.session import SessionLocal
from app.modules.projects.models import ProjectCredit
from app.modules.categories.models import Category

db = SessionLocal()
credits = db.query(ProjectCredit).filter(ProjectCredit.crew_id == 6).all()
for c in credits:
    print(f"Credit {c.id}: {c.project_slug} - {c.role} - {c.name}")
