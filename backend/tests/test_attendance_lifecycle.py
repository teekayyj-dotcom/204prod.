import os
import sys
from datetime import datetime, timedelta

# Set SQLite test database URL before importing app modules
os.environ["DATABASE_URL"] = "sqlite:///./test_attendance.sqlite"

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base import Base
from app.modules.hr.models import AttendanceLog, Shift, AttendanceReminderLog, Freelancer, LeaveRequest, Holiday, WorkSchedule
from app.modules.crew.models import CrewMember
from app.modules.users.models import User
from app.modules.notifications.models import Notification
from app.modules.hr.service import (
    create_attendance_record,
    get_active_attendance_status,
    get_employee_registered_shifts,
    resolve_employee_name_and_mode,
)
from app.modules.hr.attendance_scheduler import evaluate_attendance_lifecycle

def run_tests():
    engine = create_engine("sqlite:///./test_attendance.sqlite", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    db = TestingSessionLocal()
    try:
        print("=== Test 1: Alias resolution & Crew matching ===")
        crew = db.query(CrewMember).filter(CrewMember.email == "test_att@example.com").first()
        if not crew:
            crew = CrewMember(
                name="Nguyễn Văn Test",
                email="test_att@example.com",
                role="Developer",
                status="active",
                work_mode="onsite"
            )
            db.add(crew)
            db.commit()
            db.refresh(crew)

        # Create Shift
        shift_morning = db.query(Shift).filter(Shift.name == "Ca Sáng").first()
        if not shift_morning:
            shift_morning = Shift(
                name="Ca Sáng",
                start_time="08:30",
                end_time="12:00",
                break_time="0 phút",
                days="T2, T3, T4, T5, T6"
            )
            db.add(shift_morning)
            db.commit()
            db.refresh(shift_morning)

        today_dt = datetime.now()
        today_str = today_dt.strftime("%Y-%m-%d")
        week_start_dt = today_dt - timedelta(days=today_dt.weekday())
        week_start_str = week_start_dt.strftime("%Y-%m-%d")

        ws = db.query(WorkSchedule).filter(
            WorkSchedule.employee_name == "Nguyễn Văn Test",
            WorkSchedule.week_start_date == week_start_str
        ).first()
        if not ws:
            ws = WorkSchedule(
                employee_name="Nguyễn Văn Test",
                week_start_date=week_start_str,
                schedule_data={today_str: ["Ca Sáng"]}
            )
            db.add(ws)
            db.commit()
            db.refresh(ws)

        resolved_name, mode = resolve_employee_name_and_mode(db, "Nguyễn Văn Test")
        assert resolved_name == "Nguyễn Văn Test"
        print(" Resolved name:", resolved_name, "Mode:", mode)

        registered_shifts = get_employee_registered_shifts(db, "Nguyễn Văn Test", today_dt)
        print(" Registered shifts for today:", registered_shifts)
        assert len(registered_shifts) > 0

        print("\n=== Test 2: Active status when not checked in ===")
        status_none = get_active_attendance_status(db, "Nguyễn Văn Test", target_date=today_str)
        assert status_none["is_checked_in"] == False
        assert status_none["session_type"] == "none"
        print(" Active status when idle:", status_none)

        print("\n=== Test 3: OT Check-in (outside shift: 14:00) ===")
        db.query(AttendanceLog).filter(
            AttendanceLog.employee_name == "Nguyễn Văn Test",
            AttendanceLog.date == today_str
        ).delete()
        db.query(AttendanceReminderLog).filter(
            AttendanceReminderLog.employee_name == "Nguyễn Văn Test",
            AttendanceReminderLog.date == today_str
        ).delete()
        db.commit()

        rec = create_attendance_record(
            db,
            employee_name="Nguyễn Văn Test",
            avatar="",
            action="check-in",
            time="14:00",
            date=today_str,
            status="on-time",
            note="Office",
            lat=21.0317126,
            lng=105.8427696
        )
        assert rec.status == "ot"
        print(" OT Check-in created successfully with status:", rec.status, "note:", rec.note)

        status_ot = get_active_attendance_status(db, "Nguyễn Văn Test", target_date=today_str)
        assert status_ot["is_checked_in"] == True
        assert status_ot["session_type"] == "ot"
        assert status_ot["ot_target_hours"] == 4.0
        assert status_ot["scheduled_auto_checkout_time"] == "18:15"
        assert status_ot["scheduled_checkout_reminder_time"] == "17:55"
        print(" OT Active status verified:", status_ot)

        print("\n=== Test 4: Scheduler OT checkout reminder at 17:56 ===")
        sim_time_reminder = today_dt.replace(hour=17, minute=56, second=0)
        evaluate_attendance_lifecycle(db, now_dt=sim_time_reminder)
        
        reminder_logged = db.query(AttendanceReminderLog).filter(
            AttendanceReminderLog.employee_name == "Nguyễn Văn Test",
            AttendanceReminderLog.date == today_str,
            AttendanceReminderLog.event_type == "ot_checkout_reminder_5m"
        ).first()
        assert reminder_logged is not None
        print(" OT Check-out reminder logged:", reminder_logged.details)

        print("\n=== Test 5: Scheduler OT auto checkout at 18:16 ===")
        sim_time_autout = today_dt.replace(hour=18, minute=16, second=0)
        evaluate_attendance_lifecycle(db, now_dt=sim_time_autout)

        out_log = db.query(AttendanceLog).filter(
            AttendanceLog.employee_name == "Nguyễn Văn Test",
            AttendanceLog.date == today_str,
            AttendanceLog.action == "check-out"
        ).first()
        assert out_log is not None
        assert "tự động check-out" in (out_log.note or "").lower()
        print(" OT Auto check-out verified:", out_log.time, out_log.note)

        # Re-check status after auto-checkout
        status_after = get_active_attendance_status(db, "Nguyễn Văn Test", target_date=today_str)
        assert status_after["is_checked_in"] == False
        print(" Status after auto-checkout is correctly idle:", status_after["is_checked_in"])

        print("\n=== Test 6: Pre-shift check-in reminder (15m before shift: 08:16) ===")
        db.query(AttendanceLog).filter(
            AttendanceLog.employee_name == "Nguyễn Văn Test",
            AttendanceLog.date == today_str
        ).delete()
        db.query(AttendanceReminderLog).filter(
            AttendanceReminderLog.employee_name == "Nguyễn Văn Test",
            AttendanceReminderLog.date == today_str
        ).delete()
        db.commit()

        # Simulate 08:16 AM (14 mins before 08:30 Ca Sáng)
        sim_time_pre_shift = today_dt.replace(hour=8, minute=16, second=0)
        evaluate_attendance_lifecycle(db, now_dt=sim_time_pre_shift)

        checkin_reminder = db.query(AttendanceReminderLog).filter(
            AttendanceReminderLog.employee_name == "Nguyễn Văn Test",
            AttendanceReminderLog.date == today_str,
            AttendanceReminderLog.event_type == "checkin_reminder_15m"
        ).first()
        
        assert checkin_reminder is not None
        print(" Pre-shift reminder logged successfully:", checkin_reminder.details)

        print("\n=== Test 7: Regular Shift Auto Check-out (+15m after shift: 12:16) ===")
        # Check-in on time at 08:30
        create_attendance_record(
            db,
            employee_name="Nguyễn Văn Test",
            avatar="",
            action="check-in",
            time="08:30",
            date=today_str,
            status="on-time",
            note="Office",
            lat=21.0317126,
            lng=105.8427696
        )
        # Shift ends at 12:00. At 12:16 (+16 min), scheduler should auto check-out
        sim_time_shift_autout = today_dt.replace(hour=12, minute=16, second=0)
        evaluate_attendance_lifecycle(db, now_dt=sim_time_shift_autout)

        regular_out_log = db.query(AttendanceLog).filter(
            AttendanceLog.employee_name == "Nguyễn Văn Test",
            AttendanceLog.date == today_str,
            AttendanceLog.action == "check-out"
        ).first()
        assert regular_out_log is not None
        assert "tự động check-out" in (regular_out_log.note or "").lower()
        print(" Regular shift Auto check-out verified at 12:15:", regular_out_log.time, regular_out_log.note)

        print("\n=======================================================")
        print("🎉 ALL 7/7 ATTENDANCE LIFECYCLE TESTS PASSED PERFECTLY!")
        print("=======================================================")
    finally:
        db.close()
        if os.path.exists("./test_attendance.sqlite"):
            os.remove("./test_attendance.sqlite")

if __name__ == "__main__":
    run_tests()
