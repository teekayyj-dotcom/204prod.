from datetime import datetime
from sqlalchemy.orm import Session
from app.modules.hr.models import Freelancer, AttendanceLog, LeaveRequest, Shift, Holiday
from app.modules.hr.schemas import FreelancerCreate, FreelancerUpdate, LeaveRequestCreate
import json
import math

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000  # Radius of earth in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c

def is_date_in_range(target_date: str, date_range_str: str) -> bool:
    try:
        t_date = datetime.strptime(target_date, "%Y-%m-%d").date()
        if "→" in date_range_str:
            parts = date_range_str.split("→")
            s_date = datetime.strptime(parts[0].strip(), "%Y-%m-%d").date()
            e_date = datetime.strptime(parts[1].strip(), "%Y-%m-%d").date()
            return s_date <= t_date <= e_date
        else:
            s_date = datetime.strptime(date_range_str.strip(), "%Y-%m-%d").date()
            return s_date == t_date
    except Exception:
        return target_date in date_range_str

def get_all_freelancers(db: Session) -> list[Freelancer]:
    return db.query(Freelancer).all()

def get_freelancer_by_id(db: Session, fid: int) -> Freelancer | None:
    return db.query(Freelancer).filter(Freelancer.id == fid).first()

def create_new_freelancer(db: Session, payload: FreelancerCreate) -> Freelancer:
    db_freelancer = Freelancer(
        name=payload.name,
        avatar=payload.avatar,
        role=payload.role,
        category=payload.category,
        status=payload.status,
        stars=payload.stars,
        rate_daily=payload.rate_daily,
        rate_project=payload.rate_project,
        portfolio=payload.portfolio,
        phone=payload.phone,
        tax_id=payload.tax_id,
        bank_name=payload.bank_name,
        bank_account=payload.bank_account,
        cccd_done=payload.cccd_done,
        contract_signed=payload.contract_signed,
        nda_signed=payload.nda_signed,
        tncn_consent=payload.tncn_consent,
        projects=payload.projects or [],
        note=payload.note
    )
    db.add(db_freelancer)
    db.commit()
    db.refresh(db_freelancer)
    return db_freelancer

def update_freelancer_by_id(db: Session, fid: int, payload: FreelancerUpdate) -> Freelancer | None:
    db_freelancer = get_freelancer_by_id(db, fid)
    if not db_freelancer:
        return None
    
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_freelancer, key, value)
        
    db.commit()
    db.refresh(db_freelancer)
    return db_freelancer

def delete_freelancer_by_id(db: Session, fid: int) -> bool:
    db_freelancer = get_freelancer_by_id(db, fid)
    if not db_freelancer:
        return False
    db.delete(db_freelancer)
    db.commit()
    return True

# Attendance Logs
def get_all_attendance_logs(db: Session) -> list[AttendanceLog]:
    logs = db.query(AttendanceLog).order_by(AttendanceLog.id.desc()).all()
    
    # Normalize employee_name in log objects using user/crew mapping
    from app.modules.crew.models import CrewMember
    from app.modules.users.models import User
    
    crew = db.query(CrewMember).all()
    users = db.query(User).all()
    user_to_crew = {}
    for u in users:
        if u.email:
            crew_member = next((c for c in crew if c.email == u.email), None)
            if crew_member:
                user_to_crew[u.username] = crew_member.name
                if u.display_name:
                    user_to_crew[u.display_name] = crew_member.name
                    
    for log in logs:
        log.employee_name = user_to_crew.get(log.employee_name, log.employee_name)
        
    return logs

def resolve_employee_name_and_mode(db: Session, employee_name: str):
    from app.modules.users.models import User
    from app.modules.crew.models import CrewMember

    resolved_name = employee_name
    crew_work_mode = "onsite"
    user = db.query(User).filter((User.display_name == employee_name) | (User.username == employee_name)).first()
    if user and user.email:
        crew_member = db.query(CrewMember).filter(CrewMember.email == user.email).first()
        if crew_member:
            resolved_name = crew_member.name
            crew_work_mode = getattr(crew_member, 'work_mode', 'onsite')
    elif not user:
        crew_member = db.query(CrewMember).filter(CrewMember.name == employee_name).first()
        if crew_member:
            resolved_name = crew_member.name
            crew_work_mode = getattr(crew_member, 'work_mode', 'onsite')
    return resolved_name, crew_work_mode

def get_user_identifiers(db: Session, employee_name: str) -> list[str]:
    from app.modules.users.models import User
    from app.modules.crew.models import CrewMember

    ids = set([employee_name])
    users = db.query(User).filter((User.display_name == employee_name) | (User.username == employee_name)).all()
    for u in users:
        if u.username:
            ids.add(u.username)
        if u.display_name:
            ids.add(u.display_name)
        if u.email:
            crew = db.query(CrewMember).filter(CrewMember.email == u.email).all()
            for c in crew:
                ids.add(c.name)
    
    crew_members = db.query(CrewMember).filter(CrewMember.name == employee_name).all()
    for c in crew_members:
        ids.add(c.name)
        if c.email:
            u = db.query(User).filter(User.email == c.email).first()
            if u:
                if u.username:
                    ids.add(u.username)
                if u.display_name:
                    ids.add(u.display_name)

    return list(ids)

def send_notification_to_employee(db: Session, employee_name: str, notif_type: str, title: str, message: str, link: str = "/crew"):
    from app.modules.notifications import crud as notif_crud, schemas as notif_schemas
    from app.modules.notifications.manager import manager
    
    aliases = get_user_identifiers(db, employee_name)
    primary_id = aliases[0] if aliases else employee_name
    
    db_notif = notif_crud.create_notification(db, notif_schemas.NotificationCreate(
        user_id=primary_id,
        type=notif_type,
        title=title,
        message=message,
        link=link
    ))
    
    try:
        payload = notif_schemas.NotificationResponse.model_validate(db_notif).model_dump(mode='json')
        for alias in aliases:
            if alias != primary_id:
                manager.send_personal_message_sync(payload, alias)
    except Exception as e:
        print(f"Error broadcasting notification to aliases: {e}")
        
    return db_notif

def get_employee_registered_shifts(db: Session, employee_name: str, target_date: str) -> list[dict]:
    from app.modules.hr.models import WorkSchedule, Shift
    import datetime
    
    resolved_name, _ = resolve_employee_name_and_mode(db, employee_name)
    aliases = get_user_identifiers(db, resolved_name)
    
    try:
        checkin_dt = datetime.datetime.strptime(target_date, "%Y-%m-%d").date()
    except Exception:
        checkin_dt = datetime.date.today()
        target_date = checkin_dt.strftime("%Y-%m-%d")
        
    start_of_week = checkin_dt - datetime.timedelta(days=checkin_dt.weekday())
    week_start_str = start_of_week.strftime("%Y-%m-%d")
    
    schedules = db.query(WorkSchedule).filter(
        WorkSchedule.week_start_date == week_start_str,
        WorkSchedule.employee_name.in_(aliases)
    ).all()
    
    registered_keys = set()
    for s in schedules:
        if s.schedule_data and target_date in s.schedule_data:
            day_shifts = s.schedule_data[target_date]
            if isinstance(day_shifts, list):
                for k in day_shifts:
                    registered_keys.add(str(k).strip().lower())
            elif isinstance(day_shifts, str):
                registered_keys.add(day_shifts.strip().lower())
                
    if not registered_keys:
        return []
        
    all_shifts = db.query(Shift).all()
    result = []
    
    for s in all_shifts:
        s_name_lower = s.name.lower()
        s_id_str = str(s.id)
        
        is_match = False
        raw_key = None
        
        if s_id_str in registered_keys:
            is_match = True
            raw_key = s_id_str
        elif "morning" in registered_keys and ("sáng" in s_name_lower or "morning" in s_name_lower):
            is_match = True
            raw_key = "morning"
        elif "afternoon" in registered_keys and ("chiều" in s_name_lower or "afternoon" in s_name_lower):
            is_match = True
            raw_key = "afternoon"
        elif any(rk in s_name_lower for rk in registered_keys):
            is_match = True
            raw_key = s.name
            
        if is_match:
            try:
                s_hh, s_mm = map(int, s.start_time.split(':'))
                e_hh, e_mm = map(int, s.end_time.split(':'))
                result.append({
                    "id": s.id,
                    "name": s.name,
                    "start_time": s.start_time,
                    "end_time": s.end_time,
                    "break_time": s.break_time,
                    "start_min": s_hh * 60 + s_mm,
                    "end_min": e_hh * 60 + e_mm,
                    "raw_key": raw_key
                })
            except Exception:
                pass
                
    result.sort(key=lambda x: x["start_min"])
    return result

def get_active_attendance_status(db: Session, employee_name: str, target_date: str | None = None) -> dict:
    from app.modules.hr.models import AttendanceLog
    import datetime
    
    resolved_name, _ = resolve_employee_name_and_mode(db, employee_name)
    aliases = get_user_identifiers(db, resolved_name)
    
    if not target_date:
        target_date = datetime.date.today().strftime("%Y-%m-%d")
        
    logs = db.query(AttendanceLog).filter(
        AttendanceLog.employee_name.in_(aliases),
        AttendanceLog.date == target_date
    ).order_by(AttendanceLog.id.asc()).all()
    
    if not logs:
        return {
            "is_checked_in": False,
            "session_type": "none",
            "checkin_time": None,
            "checkin_timestamp": None,
            "shift_name": None,
            "shift_start_time": None,
            "shift_end_time": None,
            "scheduled_auto_checkout_time": None,
            "scheduled_checkout_reminder_time": None,
            "ot_target_hours": None,
            "last_action": None,
            "status": None,
            "note": None
        }
        
    last_log = logs[-1]
    is_checked_in = (last_log.action == "check-in")
    
    if not is_checked_in:
        return {
            "is_checked_in": False,
            "session_type": "none",
            "checkin_time": None,
            "checkin_timestamp": None,
            "shift_name": None,
            "shift_start_time": None,
            "shift_end_time": None,
            "scheduled_auto_checkout_time": None,
            "scheduled_checkout_reminder_time": None,
            "ot_target_hours": None,
            "last_action": last_log.action,
            "status": last_log.status,
            "note": last_log.note
        }
        
    checkin_time_str = last_log.time
    is_ot = (last_log.status == "ot") or ("ot" in (last_log.note or "").lower())
    
    checkin_dt = last_log.created_at
    checkin_ts = int(checkin_dt.timestamp() * 1000) if checkin_dt else None
    
    if is_ot:
        try:
            c_hh, c_mm = map(int, checkin_time_str.split(':'))
            c_min = c_hh * 60 + c_mm
            remind_min = (c_min + 3 * 60 + 55) % (24 * 60)
            auto_min = (c_min + 4 * 60 + 15) % (24 * 60)
            
            remind_time = f"{remind_min // 60:02d}:{remind_min % 60:02d}"
            auto_time = f"{auto_min // 60:02d}:{auto_min % 60:02d}"
        except Exception:
            remind_time = None
            auto_time = None
            
        return {
            "is_checked_in": True,
            "session_type": "ot",
            "checkin_time": checkin_time_str,
            "checkin_timestamp": checkin_ts,
            "shift_name": "Ca OT (4h)",
            "shift_start_time": checkin_time_str,
            "shift_end_time": None,
            "scheduled_auto_checkout_time": auto_time,
            "scheduled_checkout_reminder_time": remind_time,
            "ot_target_hours": 4.0,
            "last_action": last_log.action,
            "status": last_log.status,
            "note": last_log.note
        }
    else:
        shifts = get_employee_registered_shifts(db, resolved_name, target_date)
        matched_shift = None
        try:
            c_hh, c_mm = map(int, checkin_time_str.split(':'))
            c_min = c_hh * 60 + c_mm
            
            min_diff = float('inf')
            for s in shifts:
                diff = abs(c_min - s["start_min"])
                if diff < min_diff:
                    min_diff = diff
                    matched_shift = s
        except Exception:
            pass
            
        if matched_shift:
            end_min = matched_shift["end_min"]
            remind_min = (end_min - 5) % (24 * 60)
            auto_min = (end_min + 15) % (24 * 60)
            
            remind_time = f"{remind_min // 60:02d}:{remind_min % 60:02d}"
            auto_time = f"{auto_min // 60:02d}:{auto_min % 60:02d}"
            
            return {
                "is_checked_in": True,
                "session_type": "regular",
                "checkin_time": checkin_time_str,
                "checkin_timestamp": checkin_ts,
                "shift_name": matched_shift["name"],
                "shift_start_time": matched_shift["start_time"],
                "shift_end_time": matched_shift["end_time"],
                "scheduled_auto_checkout_time": auto_time,
                "scheduled_checkout_reminder_time": remind_time,
                "ot_target_hours": None,
                "last_action": last_log.action,
                "status": last_log.status,
                "note": last_log.note
            }
        else:
            return {
                "is_checked_in": True,
                "session_type": "regular",
                "checkin_time": checkin_time_str,
                "checkin_timestamp": checkin_ts,
                "shift_name": "Ca làm việc",
                "shift_start_time": checkin_time_str,
                "shift_end_time": None,
                "scheduled_auto_checkout_time": None,
                "scheduled_checkout_reminder_time": None,
                "ot_target_hours": None,
                "last_action": last_log.action,
                "status": last_log.status,
                "note": last_log.note
            }

def execute_auto_checkout(db: Session, employee_name: str, shift_name: str, is_ot: bool = False, note: str | None = None) -> AttendanceLog | None:
    from app.modules.hr.models import AttendanceLog
    import datetime
    
    resolved_name, _ = resolve_employee_name_and_mode(db, employee_name)
    aliases = get_user_identifiers(db, resolved_name)
    
    # Use Vietnam Time (UTC+7)
    now_dt = datetime.datetime.utcnow() + datetime.timedelta(hours=7)
    date_str = now_dt.strftime("%Y-%m-%d")
    time_str = now_dt.strftime("%H:%M")
    
    logs = db.query(AttendanceLog).filter(
        AttendanceLog.employee_name.in_(aliases),
        AttendanceLog.date == date_str
    ).order_by(AttendanceLog.id.asc()).all()
    
    if not logs or logs[-1].action != "check-in":
        return None
        
    last_log = logs[-1]
    default_note = f"Hệ thống tự động check-out {'ca OT' if is_ot else f'ca {shift_name}'} (quá 15 phút)"
    checkout_note = note or default_note
    
    db_log = AttendanceLog(
        employee_name=resolved_name,
        avatar=last_log.avatar,
        action="check-out",
        time=time_str,
        date=date_str,
        status="auto-checkout",
        note=checkout_note
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    
    # Send notification to employee
    send_notification_to_employee(
        db=db,
        employee_name=resolved_name,
        notif_type="attendance_auto_checkout",
        title="Tự động Check-out",
        message=f"Hệ thống đã tự động check-out {'ca OT 4 giờ' if is_ot else f'ca làm việc {shift_name}'} cho bạn do đã quá 15 phút sau khi hết ca.",
        link="/crew"
    )
    
    # Send notification to Admin
    from app.modules.notifications import crud as notif_crud, schemas as notif_schemas
    notif_crud.create_notification(db, notif_schemas.NotificationCreate(
        user_id="Admin",
        type="hr",
        title="Tự động Check-out nhân sự",
        message=f"{resolved_name} đã được hệ thống tự động check-out lúc {time_str} ({'ca OT' if is_ot else f'ca {shift_name}'})",
        link="/admin/hr"
    ))
    
    return db_log

def create_attendance_record(db: Session, employee_name: str, avatar: str, action: str, time: str, date: str, status: str, note: str | None = None, lat: float | None = None, lng: float | None = None) -> AttendanceLog:
    from app.modules.hr.models import LeaveRequest
    from fastapi import HTTPException
    
    resolved_name, crew_work_mode = resolve_employee_name_and_mode(db, employee_name)
    resolved_status = status
    
    # Check for approved WFH or Business request
    has_approved_wfh = False
    has_approved_business = False
    try:
        requests = db.query(LeaveRequest).filter(
            LeaveRequest.employee_name == resolved_name,
            LeaveRequest.status == "approved",
            LeaveRequest.type.in_(["wfh", "business"])
        ).all()
        for req in requests:
            if is_date_in_range(date, req.date):
                if req.type == "wfh":
                    has_approved_wfh = True
                elif req.type == "business":
                    has_approved_business = True
    except Exception:
        pass
    
    # Office Location
    OFFICE_LAT = 21.0317126
    OFFICE_LNG = 105.8427696
    ALLOWED_RADIUS_METERS = 50

    is_remote_or_business = crew_work_mode in ["remote", "business"]

    if lat is not None and lng is not None:
        distance = haversine_distance(lat, lng, OFFICE_LAT, OFFICE_LNG)
        if distance > ALLOWED_RADIUS_METERS:
            if not has_approved_wfh and not has_approved_business and not is_remote_or_business:
                raise HTTPException(status_code=400, detail=f"Bạn cách công ty {int(distance)}m. Vui lòng check-in tại văn phòng hoặc nộp đơn WFH/Công tác.")
    else:
        if not has_approved_wfh and not has_approved_business and not is_remote_or_business:
            raise HTTPException(status_code=400, detail="Không thể xác định vị trí của bạn. Vui lòng bật chia sẻ vị trí trên trình duyệt.")

    if has_approved_wfh:
        resolved_status = "wfh"
    elif has_approved_business:
        resolved_status = "business"
    else:
        # Check WorkSchedule & Registered Shifts
        registered_shifts = get_employee_registered_shifts(db, resolved_name, date)
        
        # Get previous logs today to check completed shifts and active state
        aliases = get_user_identifiers(db, resolved_name)
        today_logs = db.query(AttendanceLog).filter(
            AttendanceLog.employee_name.in_(aliases),
            AttendanceLog.date == date
        ).order_by(AttendanceLog.id.asc()).all()
        
        try:
            hh, mm = map(int, time.split(':'))
            action_min = hh * 60 + mm
        except Exception:
            action_min = 0

        if action == "check-in":
            if not registered_shifts:
                # No registered shifts today -> OT Shift (4h)
                resolved_status = "ot"
                if not note:
                    note = "OT (Ca 4h)"
            else:
                # Check if action_min falls within any registered shift window [start - 30, end + 15]
                matched_shift = None
                for s in registered_shifts:
                    if (s["start_min"] - 30) <= action_min <= (s["end_min"] + 15):
                        matched_shift = s
                        break
                
                if matched_shift:
                    if action_min <= matched_shift["start_min"]:
                        resolved_status = "on-time"
                    else:
                        resolved_status = "late"
                else:
                    # Outside shift -> OT Shift (4h)
                    resolved_status = "ot"
                    if not note:
                        note = "OT (Ca 4h)"

        elif action == "check-out":
            # Check if matching check-in was OT
            last_checkin = next((l for l in reversed(today_logs) if l.action == "check-in"), None)
            if last_checkin and (last_checkin.status == "ot" or "ot" in (last_checkin.note or "").lower()):
                resolved_status = "ot"
            elif registered_shifts:
                # Find closest shift end
                closest_shift = min(registered_shifts, key=lambda s: abs(action_min - s["end_min"]))
                if action_min < closest_shift["end_min"]:
                    resolved_status = "early-leave"
                else:
                    resolved_status = "on-time"

    db_log = AttendanceLog(
        employee_name=resolved_name,
        avatar=avatar,
        action=action,
        time=time,
        date=date,
        status=resolved_status,
        note=note
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)

    # Notify Admin if check-in is late or OT
    if action == "check-in" and resolved_status == "late":
        from app.modules.notifications import crud as notif_crud, schemas as notif_schemas
        notif_crud.create_notification(db, notif_schemas.NotificationCreate(
            user_id="Admin",
            type="hr",
            title="Nhân sự đi muộn",
            message=f"{resolved_name} vừa check-in muộn lúc {time}",
            link="/admin/hr"
        ))
    elif action == "check-in" and resolved_status == "ot":
        from app.modules.notifications import crud as notif_crud, schemas as notif_schemas
        notif_crud.create_notification(db, notif_schemas.NotificationCreate(
            user_id="Admin",
            type="hr",
            title="Nhân sự bắt đầu ca OT",
            message=f"{resolved_name} vừa bắt đầu ca OT (4 giờ) lúc {time}",
            link="/admin/hr"
        ))

    return db_log


# Leave Requests
def get_all_leave_requests(db: Session) -> list[LeaveRequest]:
    reqs = db.query(LeaveRequest).order_by(LeaveRequest.id.desc()).all()
    
    # Normalize employee_name in requests using user/crew mapping
    from app.modules.crew.models import CrewMember
    from app.modules.users.models import User
    
    crew = db.query(CrewMember).all()
    users = db.query(User).all()
    user_to_crew = {}
    for u in users:
        if u.email:
            crew_member = next((c for c in crew if c.email == u.email), None)
            if crew_member:
                user_to_crew[u.username] = crew_member.name
                if u.display_name:
                    user_to_crew[u.display_name] = crew_member.name
                    
    for req in reqs:
        req.employee_name = user_to_crew.get(req.employee_name, req.employee_name)
        
    return reqs

def create_leave_request_record(db: Session, payload: LeaveRequestCreate) -> LeaveRequest:
    from app.modules.users.models import User
    from app.modules.crew.models import CrewMember

    resolved_name = payload.employee_name
    # 1. Find user by username or display_name
    user = db.query(User).filter((User.display_name == resolved_name) | (User.username == resolved_name)).first()
    if user and user.email:
        # 2. Find crew member by email
        crew_member = db.query(CrewMember).filter(CrewMember.email == user.email).first()
        if crew_member:
            resolved_name = crew_member.name

    db_req = LeaveRequest(
        employee_name=resolved_name,
        avatar=payload.avatar,
        type=payload.type,
        status=payload.status,
        date=payload.date,
        reason=payload.reason,
        submitted_at=payload.submitted_at,
        urgent=payload.urgent
    )
    db.add(db_req)
    db.commit()
    db.refresh(db_req)

    # Notify Admin about new leave request
    from app.modules.notifications import crud as notif_crud, schemas as notif_schemas
    notif_crud.create_notification(db, notif_schemas.NotificationCreate(
        user_id="Admin",
        type="hr",
        title="Đơn từ mới",
        message=f"{resolved_name} vừa nộp đơn {payload.type} cho ngày {payload.date}",
        link="/admin/hr"
    ))

    return db_req

def update_leave_request_status(db: Session, req_id: int, status: str) -> LeaveRequest | None:
    db_req = db.query(LeaveRequest).filter(LeaveRequest.id == req_id).first()
    if not db_req:
        return None
    db_req.status = status
    db.commit()
    db.refresh(db_req)

    # Notify Crew about leave request status
    from app.modules.notifications import crud as notif_crud, schemas as notif_schemas
    notif_crud.create_notification(db, notif_schemas.NotificationCreate(
        user_id=db_req.employee_name,
        type="hr",
        title="Cập nhật đơn từ",
        message=f"Đơn {db_req.type} ngày {db_req.date} của bạn đã được {status}",
        link="/crew-dashboard/hr"
    ))

    return db_req

# Shifts
def get_all_shifts(db: Session) -> list[Shift]:
    return db.query(Shift).all()

# Holidays
def get_all_holidays(db: Session) -> list[Holiday]:
    return db.query(Holiday).all()

# Data Seeding
from calendar import monthrange
from datetime import date
from app.modules.crew.models import CrewMember
from collections import defaultdict

def get_timesheet(db: Session, year: int, month: int) -> list[dict]:
    # Fetch all crew members
    crew = db.query(CrewMember).all()
    
    month_prefix = f"{year:04d}-{month:02d}"
    logs = db.query(AttendanceLog).filter(AttendanceLog.date.startswith(month_prefix)).all()
    
    # Load shifts for late minute calculation
    shifts = db.query(Shift).all()
    
    # Process holidays (Assuming DD/MM/YYYY format)
    holidays = db.query(Holiday).all()
    holiday_dates = set()
    for h in holidays:
        parts = h.date.split('/')
        if len(parts) >= 2:
            try:
                hd_day = int(parts[0])
                hd_month = int(parts[1])
                if hd_month == month:
                    holiday_dates.add(hd_day)
            except ValueError:
                pass
                
    # Build user name/display_name to crew name normalization map
    from app.modules.users.models import User
    users = db.query(User).all()
    user_to_crew = {}
    for u in users:
        if u.email:
            crew_member = next((c for c in crew if c.email == u.email), None)
            if crew_member:
                user_to_crew[u.username] = crew_member.name
                if u.display_name:
                    user_to_crew[u.display_name] = crew_member.name

    # Group logs by employee -> day -> list of logs
    log_map = defaultdict(lambda: defaultdict(list))
    for log in logs:
        try:
            day = int(log.date.split('-')[2])
            emp_name = user_to_crew.get(log.employee_name, log.employee_name)
            log_map[emp_name][day].append(log)
        except Exception:
            pass
            
    num_days = monthrange(year, month)[1]
    timesheet_data = []
    today = date.today()
    
    for member in crew:
        if getattr(member, 'work_mode', 'onsite') != 'onsite':
            continue
            
        days = []
        total_days = 0.0
        late_min = 0
        unscheduled_min = 0
        
        member_logs = log_map.get(member.name, {})
        
        for day in range(1, num_days + 1):
            current_date = date(year, month, day)
            is_weekend = current_date.weekday() >= 5
            
            if current_date > today:
                days.append("-")
                continue
                
            day_logs = member_logs.get(day, [])
            
            if day in holiday_dates:
                days.append("holiday")
                if not is_weekend:
                    total_days += 1.0
                continue
                
            if is_weekend:
                days.append("weekend")
                continue
                
            if not day_logs:
                days.append("absent")
                continue
                
            has_wfh = any(l.status == "wfh" for l in day_logs)
            has_business = any(l.status == "business" for l in day_logs)
            has_late = any(l.status == "late" for l in day_logs)
            
            has_unscheduled = any(l.status == "unscheduled" for l in day_logs)
            
            if has_unscheduled:
                days.append("unscheduled")
                sorted_logs = sorted([l for l in day_logs if l.status == "unscheduled"], key=lambda x: x.time)
                checkin_time = None
                for l in sorted_logs:
                    if l.action == "check-in":
                        if not checkin_time:
                            checkin_time = l.time
                    elif l.action == "check-out":
                        if checkin_time:
                            try:
                                in_hh, in_mm = map(int, checkin_time.split(':'))
                                out_hh, out_mm = map(int, l.time.split(':'))
                                diff_min = (out_hh * 60 + out_mm) - (in_hh * 60 + in_mm)
                                if diff_min > 0:
                                    unscheduled_min += diff_min
                            except Exception:
                                pass
                            checkin_time = None
            elif has_business:
                days.append("business")
                total_days += 1.0
            elif has_wfh:
                days.append("wfh")
                total_days += 1.0
                
                checkins = [l for l in day_logs if l.action == "check-in" and l.status == "wfh"]
                for checkin in checkins:
                    t_str = checkin.time
                    try:
                        hh, mm = map(int, t_str.split(':'))
                        arrival_min = hh * 60 + mm
                        
                        if shifts:
                            closest_shift = None
                            min_diff = float('inf')
                            for s in shifts:
                                s_hh, s_mm = map(int, s.start_time.split(':'))
                                shift_start_min = s_hh * 60 + s_mm
                                diff = abs(arrival_min - shift_start_min)
                                if diff < min_diff:
                                    min_diff = diff
                                    closest_shift = shift_start_min
                                    
                            if closest_shift is not None and arrival_min > closest_shift + 30:
                                late_min += (arrival_min - closest_shift - 30)
                    except Exception:
                        pass
            elif has_late:
                days.append("late")
                total_days += 1.0
                
                checkins = [l for l in day_logs if l.action == "check-in" and l.status == "late"]
                for late_checkin in checkins:
                    t_str = late_checkin.time
                    try:
                        hh, mm = map(int, t_str.split(':'))
                        arrival_min = hh * 60 + mm
                        
                        if shifts:
                            closest_shift = None
                            min_diff = float('inf')
                            for s in shifts:
                                s_hh, s_mm = map(int, s.start_time.split(':'))
                                shift_start_min = s_hh * 60 + s_mm
                                diff = abs(arrival_min - shift_start_min)
                                if diff < min_diff:
                                    min_diff = diff
                                    closest_shift = shift_start_min
                                    
                            if closest_shift is not None and arrival_min > closest_shift:
                                late_min += (arrival_min - closest_shift)
                    except Exception:
                        pass
            else:
                days.append("on-time")
                total_days += 1.0
                
        ot_hours = round(unscheduled_min / 60.0, 1)
        ot_str = f"{ot_hours:g}h" if ot_hours > 0 else "0h"

        timesheet_data.append({
            "employee": {
                "name": member.name,
                "avatar": member.avatar or member.name[:2].upper(),
                "role": member.role or "Member"
            },
            "days": days,
            "totalDays": total_days,
            "ot": ot_str,
            "lateMin": late_min
        })
        
    return timesheet_data

def get_attendance_stats(db: Session) -> dict:
    crew = db.query(CrewMember).all()
    total_employees = len(crew)
    
    today_str = datetime.now().strftime("%Y-%m-%d")
    # Order by id DESC so the most recent check-in/check-out of the day is processed first
    logs = db.query(AttendanceLog).filter(AttendanceLog.date == today_str).order_by(AttendanceLog.id.desc()).all()
    
    # Build user name/display_name to crew name normalization map
    from app.modules.users.models import User
    users = db.query(User).all()
    user_to_crew = {}
    for u in users:
        if u.email:
            crew_member = next((c for c in crew if c.email == u.email), None)
            if crew_member:
                user_to_crew[u.username] = crew_member.name
                if u.display_name:
                    user_to_crew[u.display_name] = crew_member.name

    working_count = 0
    wfh_count = 0
    late_count = 0
    
    valid_crew_names = {c.name for c in crew}
    seen = set()
    for log in logs:
        emp_name = user_to_crew.get(log.employee_name, log.employee_name)
        if emp_name in valid_crew_names and emp_name not in seen:
            seen.add(emp_name)
            if log.action == "check-in":
                working_count += 1
                if log.status == "wfh":
                    wfh_count += 1
                elif log.status == "late":
                    late_count += 1
                    
    absent_count = max(0, total_employees - len(seen))
    
    attendance_rate = "0%"
    if total_employees > 0:
        rate = min(100.0, (len(seen) / total_employees) * 100)
        attendance_rate = f"{rate:.1f}%".replace(".0%", "%")
        
    return {
        "workingCount": working_count,
        "wfhCount": wfh_count,
        "lateCount": late_count,
        "absentCount": absent_count,
        "totalEmployees": total_employees,
        "attendanceRate": attendance_rate
    }
def seed_hr_data(db: Session) -> None:
    # No mock freelancers, shifts, or holidays are seeded. All configs and profiles must be created directly by the user in the database.
    pass

def create_work_schedule(db: Session, schedule_data: dict, employee_name: str, avatar: str, week_start_date: str, employee_id: int | None = None):
    from app.modules.hr.models import WorkSchedule
    # Check if a schedule already exists for this week
    query = db.query(WorkSchedule).filter(WorkSchedule.week_start_date == week_start_date)
    if employee_id is not None:
        query = query.filter(WorkSchedule.employee_id == employee_id)
    else:
        query = query.filter(WorkSchedule.employee_name == employee_name)
    existing = query.first()

    if existing:
        existing.schedule_data = schedule_data
        existing.avatar = avatar
        if employee_id is not None and existing.employee_id is None:
            existing.employee_id = employee_id
    else:
        new_schedule = WorkSchedule(
            employee_id=employee_id,
            employee_name=employee_name,
            avatar=avatar,
            week_start_date=week_start_date,
            schedule_data=schedule_data
        )
        db.add(new_schedule)
    
    db.commit()
    return existing if existing else new_schedule

def get_work_schedules(db: Session, week_start_date: str = None):
    from app.modules.hr.models import WorkSchedule
    query = db.query(WorkSchedule)
    if week_start_date:
        query = query.filter(WorkSchedule.week_start_date == week_start_date)
    return query.all()

def check_and_mark_absences(db: Session, target_date: str):
    """
    Checks if there are registered shifts for the target_date.
    If an employee hasn't checked in, marks them as absent.
    """
    from app.modules.hr.models import WorkSchedule, AttendanceLog
    from datetime import datetime
    
    schedules = db.query(WorkSchedule).all()
    
    for s in schedules:
        shifts = s.schedule_data.get(target_date, [])
        if shifts:
            # Check if this person checked in today
            logs = db.query(AttendanceLog).filter(
                AttendanceLog.employee_id == s.employee_name,
                AttendanceLog.date == target_date
            ).all()
            
            if not logs:
                # Add an absent log
                absent_log = AttendanceLog(
                    employee_id=s.employee_name,
                    date=target_date,
                    time_in="00:00",
                    time_out="00:00",
                    status="vắng",
                    work_mode="office",
                    project="N/A",
                    overtime=False
                )
                db.add(absent_log)
    db.commit()
