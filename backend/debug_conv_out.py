from app.db.session import SessionLocal
from app.modules.users.models import User
from app.modules.messaging.models import Conversation, ConversationParticipant
from sqlalchemy.orm import joinedload
from app.modules.messaging.schemas import ConversationOut

db = SessionLocal()

# Get conversations for user 1
parts = db.query(ConversationParticipant).filter_by(user_id=1).all()
c_ids = [p.conversation_id for p in parts]

convs = db.query(Conversation).options(
    joinedload(Conversation.participants).joinedload(ConversationParticipant.user)
).filter(Conversation.id.in_(c_ids)).all()

for c in convs:
    out = ConversationOut.model_validate(c)
    print(out.model_dump_json(indent=2))
