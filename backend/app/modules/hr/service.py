from datetime import datetime
from sqlalchemy.orm import Session
from app.modules.hr.models import Freelancer, AttendanceLog, LeaveRequest, Shift, Holiday
from app.modules.hr.schemas import FreelancerCreate, FreelancerUpdate, LeaveRequestCreate
import json

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

def create_attendance_record(db: Session, employee_name: str, avatar: str, action: str, time: str, date: str, status: str, note: str | None = None) -> AttendanceLog:
    from app.modules.users.models import User
    from app.modules.crew.models import CrewMember

    resolved_name = employee_name
    # 1. Find user by username or display_name
    user = db.query(User).filter((User.display_name == employee_name) | (User.username == employee_name)).first()
    if user and user.email:
        # 2. Find crew member by email
        crew_member = db.query(CrewMember).filter(CrewMember.email == user.email).first()
        if crew_member:
            resolved_name = crew_member.name

    db_log = AttendanceLog(
        employee_name=resolved_name,
        avatar=avatar,
        action=action,
        time=time,
        date=date,
        status=status,
        note=note
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
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
    return db_req

def update_leave_request_status(db: Session, req_id: int, status: str) -> LeaveRequest | None:
    db_req = db.query(LeaveRequest).filter(LeaveRequest.id == req_id).first()
    if not db_req:
        return None
    db_req.status = status
    db.commit()
    db.refresh(db_req)
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
        days = []
        total_days = 0.0
        late_min = 0
        
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
            has_late = any(l.status == "late" for l in day_logs)
            
            if has_wfh:
                days.append("wfh")
                total_days += 1.0
            elif has_late:
                days.append("late")
                total_days += 1.0
                
                checkins = [l for l in day_logs if l.action == "check-in"]
                if checkins:
                    t_str = checkins[0].time
                    try:
                        hh, mm = map(int, t_str.split(':'))
                        arrival_min = hh * 60 + mm
                        # Default shift is 08:00
                        shift_start_min = 8 * 60
                        if arrival_min > shift_start_min:
                            late_min += (arrival_min - shift_start_min)
                    except Exception:
                        pass
            else:
                days.append("on-time")
                total_days += 1.0
                
        timesheet_data.append({
            "employee": {
                "name": member.name,
                "avatar": member.avatar or member.name[:2].upper(),
                "role": member.role or "Member"
            },
            "days": days,
            "totalDays": total_days,
            "ot": "0h",
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
    
    seen = set()
    for log in logs:
        emp_name = user_to_crew.get(log.employee_name, log.employee_name)
        if emp_name not in seen:
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
        rate = (len(seen) / total_employees) * 100
        attendance_rate = f"{rate:.1f}%"
        
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
