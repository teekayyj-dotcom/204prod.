import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.modules.categories.models import Category
from app.modules.projects.models import ProjectCredit, Project
from app.modules.messaging.models import Conversation, ConversationParticipant
from app.modules.users.models import User

def main():
    db = SessionLocal()
    
    project_slug = 'l-l'
    
    print(f"--- Project Credits for {project_slug} ---")
    credits = db.query(ProjectCredit).filter(ProjectCredit.project_slug == project_slug).all()
    for c in credits:
        print(f"Role: {c.role}, Name: {c.name}, Crew ID: {c.crew_id}")
        
    print(f"\n--- Conversation for {project_slug} ---")
    conv = db.query(Conversation).filter_by(project_slug=project_slug, is_group=True).first()
    if conv:
        print(f"Conv ID: {conv.id}, Name: {conv.name}")
        participants = db.query(ConversationParticipant).filter_by(conversation_id=conv.id).all()
        for p in participants:
            print(f"User ID: {p.user_id}, Name: {p.display_name}, Role: {p.role}")
    else:
        print("No conversation found.")

    print(f"\n--- Users ---")
    users = db.query(User).filter(User.active == True).all()
    for u in users:
        print(f"ID: {u.id}, Name: {u.display_name}, Role: {u.role}")

    db.close()

if __name__ == "__main__":
    main()
