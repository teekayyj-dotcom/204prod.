import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.modules.users.models import User

def main():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        fixed_count = 0
        for u in users:
            # Known admins
            if u.id in [3, 4] and u.role != "admin":
                u.role = "admin"
                fixed_count += 1
            # Invalid roles corrupted by previous sync
            elif u.role not in ["admin", "crew", "client", "pending"]:
                u.role = "crew"
                fixed_count += 1
        
        db.commit()
        print(f"Successfully fixed {fixed_count} corrupted user roles!")
    except Exception as e:
        print("Error:", e)
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
