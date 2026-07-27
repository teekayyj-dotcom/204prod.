from app.db.session import SessionLocal
from app.modules.projects.models import Project, ProjectCredit
from app.modules.users.models import User
from app.modules.messaging.service import sync_project_group_chat
from app.modules.categories.models import Category
from sqlalchemy.orm import Session

def main():
    db = SessionLocal()
    projects = db.query(Project).all()
    
    users = db.query(User).filter(User.active == True).all()
    # Create mapping of lowercased name -> id
    user_map = {u.display_name.lower(): u.id for u in users if u.display_name}
    
    for project in projects:
        # 1. Get from structured credits
        structured = db.query(ProjectCredit).filter(ProjectCredit.project_slug == project.slug).all()
        crew_ids = [c.crew_id for c in structured if c.crew_id is not None]
        
        # 2. Get from string credits
        if project.credits:
            for credit in project.credits:
                c_lower = credit.name.lower()
                for uname, uid in user_map.items():
                    if uname in c_lower and uid not in crew_ids:
                        crew_ids.append(uid)
                        
                        # Also update the database to set the crew_id so we don't have to do this again
                        credit.crew_id = uid
                        
        print(f"Syncing project {project.slug} with crew_ids: {crew_ids}")
        sync_project_group_chat(db, project.slug, project.title, crew_ids=crew_ids)
        
    db.commit()
    db.close()
    print("Done!")

if __name__ == "__main__":
    main()
