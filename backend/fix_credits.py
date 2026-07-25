from app.db.session import SessionLocal
from app.modules.projects.models import ProjectCredit
from app.modules.messaging.service import sync_project_group_chat
from app.modules.projects.models import Project
from app.modules.categories.models import Category

db = SessionLocal()

# Update credits where name is 'Lê Tuấn Kiệt' to have crew_id = 6
credits = db.query(ProjectCredit).filter(ProjectCredit.name == 'Lê Tuấn Kiệt').all()
for c in credits:
    c.crew_id = 6
db.commit()

# Resync chats for those projects
projects = db.query(Project).all()
for p in projects:
    p_credits = db.query(ProjectCredit).filter(ProjectCredit.project_slug == p.slug).all()
    crew_ids = [c.crew_id for c in p_credits if c.crew_id is not None]
    sync_project_group_chat(db, p.slug, p.title, crew_ids=crew_ids)

print("Fixed crew_ids and resynced chats!")
