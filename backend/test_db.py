import sys, os
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from app.db.session import SessionLocal
from app.modules.crew.models import CrewMember
try:
    db = SessionLocal()
    members = db.query(CrewMember).all()
    print("Success:", len(members))
except Exception as e:
    import traceback
    traceback.print_exc()
