import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.modules.users.models import User
from app.modules.crew.models import CrewMember

def main():
    db = SessionLocal()
    
    # Get all crew members
    crew_members = db.query(CrewMember).all()
    
    updated_count = 0
    for crew in crew_members:
        if not crew.email:
            continue
            
        # Find matching user by email
        user = db.query(User).filter(User.email == crew.email).first()
        if user:
            # Update display_name and avatar_url if they differ or are missing
            changed = False
            
            # Update name if user has no name, or if we want to force sync.
            # We'll overwrite to ensure HR data is the source of truth.
            if user.display_name != crew.name:
                user.display_name = crew.name
                changed = True
                
            if crew.avatar and user.avatar_url != crew.avatar:
                user.avatar_url = crew.avatar
                changed = True
                
            if changed:
                print(f"Updated User {user.id} ({user.email}) -> Name: {user.display_name}")
                updated_count += 1
                
    if updated_count > 0:
        db.commit()
        print(f"Successfully synced {updated_count} users from CrewMember data.")
    else:
        print("No users needed syncing.")
        
    db.close()

if __name__ == "__main__":
    main()
