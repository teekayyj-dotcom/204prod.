from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.modules.projects.models import Project, ProjectCredit, Client, ProjectTask
from app.modules.categories.models import Category
from app.modules.messaging.service import sync_project_group_chat

def main():
    db = SessionLocal()
    projects = db.query(Project).all()
    
    for project in projects:
        credits = db.query(ProjectCredit).filter(ProjectCredit.project_slug == project.slug).all()
        crew_ids = [c.crew_id for c in credits if c.crew_id is not None]
        print(f"Syncing project {project.slug} with crew_ids: {crew_ids}")
        sync_project_group_chat(db, project.slug, project.title, crew_ids=crew_ids)
        
    db.close()
    print("Done!")

if __name__ == "__main__":
    main()
