from app.db.session import SessionLocal
from app.modules.messaging.models import ConversationParticipant
from app.modules.users.models import User

db = SessionLocal()
parts = db.query(ConversationParticipant).filter_by(conversation_id=1).all()
for p in parts:
    print(f"Conversation 1 Participant: {p.user_id}")
