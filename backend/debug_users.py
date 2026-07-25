from app.db.session import SessionLocal
from app.modules.users.models import User

db = SessionLocal()
users = db.query(User).all()
for u in users:
    print(f"User {u.id}: {u.email} - {u.display_name} - {u.role}")
