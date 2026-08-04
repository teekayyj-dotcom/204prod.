import asyncio
import datetime
import logging
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.modules.hr.models import (
    WorkSchedule,
    AttendanceLog,
    AttendanceReminderLog,
    Shift
)
from app.modules.hr.service import (
    get_employee_registered_shifts,
    get_user_identifiers,
    send_notification_to_employee,
    execute_auto_checkout,
    resolve_employee_name_and_mode
)

logger = logging.getLogger("attendance_scheduler")

def evaluate_attendance_lifecycle(db: Session, now_dt: datetime.datetime | None = None):
    """
    Evaluates shift schedules and active attendance sessions to trigger:
    1. 15m pre-shift check-in reminder
    2. 5m pre-shift check-out reminder
    3. 15m post-shift auto-checkout
    4. 5m pre-OT check-out reminder (at 3h55m)
    5. 15m post-OT auto-checkout (at 4h15m)
    """
    if now_dt is None:
        now_dt = datetime.datetime.now()

    date_str = now_dt.strftime("%Y-%m-%d")
    now_min = now_dt.hour * 60 + now_dt.minute

    # 1. Process all WorkSchedules for registered shifts
    start_of_week = now_dt.date() - datetime.timedelta(days=now_dt.date().weekday())
    week_start_str = start_of_week.strftime("%Y-%m-%d")

    schedules = db.query(WorkSchedule).filter(
        WorkSchedule.week_start_date == week_start_str
    ).all()

    # Cache logs today for all employees
    today_logs = db.query(AttendanceLog).filter(
        AttendanceLog.date == date_str
    ).order_by(AttendanceLog.id.asc()).all()

    logs_by_employee: dict[str, list[AttendanceLog]] = {}
    for log in today_logs:
        logs_by_employee.setdefault(log.employee_name, []).append(log)

    for schedule in schedules:
        emp_name = schedule.employee_name
        resolved_name, _ = resolve_employee_name_and_mode(db, emp_name)
        aliases = get_user_identifiers(db, resolved_name)

        # Collect user's logs
        emp_logs = []
        for alias in aliases:
            emp_logs.extend(logs_by_employee.get(alias, []))
        emp_logs.sort(key=lambda l: l.id)

        is_currently_checked_in = (len(emp_logs) > 0 and emp_logs[-1].action == "check-in")
        last_log = emp_logs[-1] if emp_logs else None
        last_log_is_ot = (
            last_log is not None and
            (last_log.status == "ot" or "ot" in (last_log.note or "").lower())
        )

        shifts = get_employee_registered_shifts(db, resolved_name, date_str)

        for s in shifts:
            shift_id_str = str(s["id"])
            shift_name = s["name"]
            start_min = s["start_min"]
            end_min = s["end_min"]
            start_time_str = s["start_time"]
            end_time_str = s["end_time"]

            # --- RULE 1: 15-Minute Pre-Shift Check-in Reminder ---
            # Trigger when: start_min - 15 <= now_min < start_min
            if (start_min - 15) <= now_min < (start_min + 5):
                # Check if reminder already logged
                existing_reminder = db.query(AttendanceReminderLog).filter(
                    AttendanceReminderLog.date == date_str,
                    AttendanceReminderLog.employee_name == resolved_name,
                    AttendanceReminderLog.shift_identifier == shift_id_str,
                    AttendanceReminderLog.event_type == "checkin_reminder_15m"
                ).first()

                if not existing_reminder:
                    # If user has NOT checked in yet today (or before shift start)
                    if not is_currently_checked_in and len(emp_logs) == 0:
                        send_notification_to_employee(
                            db=db,
                            employee_name=resolved_name,
                            notif_type="attendance_checkin_reminder",
                            title="Nhắc nhở vào ca làm việc",
                            message=f"Ca làm việc {shift_name} ({start_time_str} - {end_time_str}) của bạn sẽ bắt đầu trong 15 phút. Hãy nhớ check-in đúng giờ nhé!",
                            link="/crew"
                        )
                        reminder_entry = AttendanceReminderLog(
                            employee_name=resolved_name,
                            date=date_str,
                            shift_identifier=shift_id_str,
                            event_type="checkin_reminder_15m",
                            details=f"Sent 15m checkin reminder for shift {shift_name}"
                        )
                        db.add(reminder_entry)
                        db.commit()
                    else:
                        # Already clocked in, record as handled to prevent re-checks
                        reminder_entry = AttendanceReminderLog(
                            employee_name=resolved_name,
                            date=date_str,
                            shift_identifier=shift_id_str,
                            event_type="checkin_reminder_15m",
                            details=f"Skipped: already clocked in for {shift_name}"
                        )
                        db.add(reminder_entry)
                        db.commit()

            # --- RULE 2: 5-Minute Pre-Shift Check-out Reminder ---
            # Trigger when: end_min - 5 <= now_min < end_min + 5
            if (end_min - 5) <= now_min < (end_min + 5):
                existing_reminder = db.query(AttendanceReminderLog).filter(
                    AttendanceReminderLog.date == date_str,
                    AttendanceReminderLog.employee_name == resolved_name,
                    AttendanceReminderLog.shift_identifier == shift_id_str,
                    AttendanceReminderLog.event_type == "checkout_reminder_5m"
                ).first()

                if not existing_reminder:
                    if is_currently_checked_in and not last_log_is_ot:
                        send_notification_to_employee(
                            db=db,
                            employee_name=resolved_name,
                            notif_type="attendance_checkout_reminder",
                            title="Nhắc nhở kết thúc ca làm việc",
                            message=f"Ca làm việc {shift_name} sắp kết thúc lúc {end_time_str} (còn 5 phút). Hãy hoàn tất công việc và nhớ check-out nhé!",
                            link="/crew"
                        )
                        reminder_entry = AttendanceReminderLog(
                            employee_name=resolved_name,
                            date=date_str,
                            shift_identifier=shift_id_str,
                            event_type="checkout_reminder_5m",
                            details=f"Sent 5m checkout reminder for shift {shift_name}"
                        )
                        db.add(reminder_entry)
                        db.commit()
                    elif not is_currently_checked_in:
                        reminder_entry = AttendanceReminderLog(
                            employee_name=resolved_name,
                            date=date_str,
                            shift_identifier=shift_id_str,
                            event_type="checkout_reminder_5m",
                            details=f"Skipped: not checked in for {shift_name}"
                        )
                        db.add(reminder_entry)
                        db.commit()

            # --- RULE 3: 15-Minute Post-Shift Auto-Checkout ---
            # Trigger when: now_min >= end_min + 15
            if now_min >= (end_min + 15):
                existing_auto = db.query(AttendanceReminderLog).filter(
                    AttendanceReminderLog.date == date_str,
                    AttendanceReminderLog.employee_name == resolved_name,
                    AttendanceReminderLog.shift_identifier == shift_id_str,
                    AttendanceReminderLog.event_type == "auto_checkout_15m"
                ).first()

                if not existing_auto:
                    if is_currently_checked_in and not last_log_is_ot:
                        # Auto-checkout the user
                        execute_auto_checkout(
                            db=db,
                            employee_name=resolved_name,
                            shift_name=shift_name,
                            is_ot=False,
                            note=f"Hệ thống tự động check-out ca {shift_name} (quá 15 phút)"
                        )
                        reminder_entry = AttendanceReminderLog(
                            employee_name=resolved_name,
                            date=date_str,
                            shift_identifier=shift_id_str,
                            event_type="auto_checkout_15m",
                            details=f"Executed auto-checkout for shift {shift_name}"
                        )
                        db.add(reminder_entry)
                        db.commit()
                        is_currently_checked_in = False
                    else:
                        reminder_entry = AttendanceReminderLog(
                            employee_name=resolved_name,
                            date=date_str,
                            shift_identifier=shift_id_str,
                            event_type="auto_checkout_15m",
                            details=f"Skipped auto-checkout: not checked in"
                        )
                        db.add(reminder_entry)
                        db.commit()

    # 2. Process all Active OT Sessions
    # Find all currently checked-in OT sessions across all users today
    # Refresh today's logs in case an auto-checkout occurred above
    active_logs = db.query(AttendanceLog).filter(
        AttendanceLog.date == date_str
    ).order_by(AttendanceLog.id.asc()).all()

    active_by_employee: dict[str, list[AttendanceLog]] = {}
    for log in active_logs:
        active_by_employee.setdefault(log.employee_name, []).append(log)

    for emp_name, u_logs in active_by_employee.items():
        if not u_logs:
            continue
        last_log = u_logs[-1]
        if last_log.action != "check-in":
            continue

        is_ot = (last_log.status == "ot") or ("ot" in (last_log.note or "").lower())
        if not is_ot:
            continue

        # This is an active OT session
        ot_session_id = f"OT_{last_log.id}"
        resolved_name, _ = resolve_employee_name_and_mode(db, emp_name)

        try:
            c_hh, c_mm = map(int, last_log.time.split(':'))
            c_min = c_hh * 60 + c_mm
            elapsed_min = (now_min - c_min) % (24 * 60)
        except Exception:
            continue

        # OT Target: 4 hours (240 minutes)
        # --- RULE 4: 5-Minute Pre-OT Checkout Reminder (at 3h55m / 235m) ---
        if elapsed_min >= 235:
            existing_ot_remind = db.query(AttendanceReminderLog).filter(
                AttendanceReminderLog.date == date_str,
                AttendanceReminderLog.employee_name == resolved_name,
                AttendanceReminderLog.shift_identifier == ot_session_id,
                AttendanceReminderLog.event_type == "ot_checkout_reminder_5m"
            ).first()

            if not existing_ot_remind:
                ot_end_min = (c_min + 240) % (24 * 60)
                ot_end_str = f"{ot_end_min // 60:02d}:{ot_end_min % 60:02d}"
                send_notification_to_employee(
                    db=db,
                    employee_name=resolved_name,
                    notif_type="ot_checkout_reminder",
                    title="Nhắc nhở kết thúc ca OT",
                    message=f"Ca OT (4 giờ) của bạn sắp kết thúc lúc {ot_end_str} (còn 5 phút). Hãy hoàn tất công việc và nhớ check-out nhé!",
                    link="/crew"
                )
                reminder_entry = AttendanceReminderLog(
                    employee_name=resolved_name,
                    date=date_str,
                    shift_identifier=ot_session_id,
                    event_type="ot_checkout_reminder_5m",
                    details=f"Sent 5m OT checkout reminder for log {last_log.id}"
                )
                db.add(reminder_entry)
                db.commit()

        # --- RULE 5: 15-Minute Post-OT Auto-Checkout (at 4h15m / 255m) ---
        if elapsed_min >= 255:
            existing_ot_auto = db.query(AttendanceReminderLog).filter(
                AttendanceReminderLog.date == date_str,
                AttendanceReminderLog.employee_name == resolved_name,
                AttendanceReminderLog.shift_identifier == ot_session_id,
                AttendanceReminderLog.event_type == "ot_auto_checkout_15m"
            ).first()

            if not existing_ot_auto:
                execute_auto_checkout(
                    db=db,
                    employee_name=resolved_name,
                    shift_name="OT (4h)",
                    is_ot=True,
                    note="Hệ thống tự động check-out ca OT (quá 15 phút)"
                )
                reminder_entry = AttendanceReminderLog(
                    employee_name=resolved_name,
                    date=date_str,
                    shift_identifier=ot_session_id,
                    event_type="ot_auto_checkout_15m",
                    details=f"Executed auto-checkout for OT session {last_log.id}"
                )
                db.add(reminder_entry)
                db.commit()


async def attendance_scheduler_loop(interval_seconds: int = 30):
    """
    Background asynchronous loop executing attendance checks every interval_seconds.
    """
    logger.info("Attendance background scheduler started.")
    while True:
        try:
            db = SessionLocal()
            try:
                evaluate_attendance_lifecycle(db)
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Error in attendance scheduler cycle: {e}", exc_info=True)

        await asyncio.sleep(interval_seconds)
