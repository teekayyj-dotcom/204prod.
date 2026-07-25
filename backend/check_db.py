from app.db.session import SessionLocal
from app.modules.messaging.models import Conversation, ConversationParticipant
from app.modules.users.models import User

db = SessionLocal()

print("--- Admins ---")
for u in db.query(User).filter(User.role == 'admin').all():
    print(f"ID: {u.id}, Name: {u.display_name}, Role: {u.role}, Active: {u.active}")

print("\n--- Conversations ---")
for c in db.query(Conversation).all():
    print(f"ID: {c.id}, Name: {c.name}, Is Group: {c.is_group}")

print("\n--- Participants ---")
for p in db.query(ConversationParticipant).all():
    print(f"ConvID: {p.conversation_id}, UserID: {p.user_id}")

