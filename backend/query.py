from app.db.session import SessionLocal
from app.modules.messaging.models import Conversation

db = SessionLocal()
conv = db.query(Conversation).filter_by(id=1).first()
if conv:
    print(f"ID: {conv.id}, is_group: {conv.is_group}")
else:
    print("Not found")
