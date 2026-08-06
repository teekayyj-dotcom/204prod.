from app.db.session import SessionLocal
from app.modules.users.models import User

db = SessionLocal()
users = db.query(User).all()
for u in users:
    print(f"ID: {u.id}, Email: {u.email}, Role: {u.role}, Display: {u.display_name}")
