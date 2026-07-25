from app.db.session import SessionLocal
from app.modules.messaging.models import Conversation
from app.modules.messaging.schemas import ConversationOut

db = SessionLocal()
convs = db.query(Conversation).all()
for c in convs:
    out = ConversationOut.model_validate(c)
    print(f"Conv: {out.name}")
    for p in out.participants:
        print(f"  - User {p.user_id}: display_name='{p.display_name}'")
