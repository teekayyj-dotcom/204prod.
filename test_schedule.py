import asyncio
import sys

# add backend to path
sys.path.append('backend')
from app.db.session import SessionLocal
from app.modules.hr.service import create_work_schedule

db = SessionLocal()
try:
    res = create_work_schedule(
        db=db,
        schedule_data={"2026-07-27": ["morning"]},
        employee_name="Test User",
        avatar="",
        week_start_date="2026-07-27",
        employee_id=None
    )
    print("Success:", res.id)
except Exception as e:
    print("Error:", str(e))
finally:
    db.close()
