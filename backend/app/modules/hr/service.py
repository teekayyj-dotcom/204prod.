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
    return db.query(AttendanceLog).order_by(AttendanceLog.id.desc()).all()

def create_attendance_record(db: Session, employee_name: str, avatar: str, action: str, time: str, date: str, status: str, note: str | None = None) -> AttendanceLog:
    db_log = AttendanceLog(
        employee_name=employee_name,
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
    return db.query(LeaveRequest).order_by(LeaveRequest.id.desc()).all()

def create_leave_request_record(db: Session, payload: LeaveRequestCreate) -> LeaveRequest:
    db_req = LeaveRequest(
        employee_name=payload.employee_name,
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
                
    # Group logs by employee -> day -> list of logs
    log_map = defaultdict(lambda: defaultdict(list))
    for log in logs:
        try:
            day = int(log.date.split('-')[2])
            log_map[log.employee_name][day].append(log)
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
    logs = db.query(AttendanceLog).filter(AttendanceLog.date == today_str).all()
    
    working_count = 0
    wfh_count = 0
    late_count = 0
    
    seen = set()
    for log in logs:
        if log.employee_name not in seen:
            seen.add(log.employee_name)
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
    # 1. Seed Freelancers
    if db.query(Freelancer).count() == 0:
        freelancers = [
            Freelancer(
                name="Trịnh Minh Tuấn", avatar="TT", role="Cameraman / DP", category="Camera",
                status="available", stars=5, rate_daily=2500000, rate_project=8000000,
                portfolio="https://drive.google.com", phone="0901 234 567", tax_id="012345678901", 
                bank_name="VCB", bank_account="103xxxx789", cccd_done=True, contract_signed=True,
                nda_signed=True, tncn_consent=True, projects=[
                    {"name": "Vingroup TVC Q2", "date": "10/06/2026", "paid": True, "rating": 5},
                    {"name": "Highlands Rebranding", "date": "28/04/2026", "paid": True, "rating": 5},
                    {"name": "F88 Social Q1", "date": "15/02/2026", "paid": True, "rating": 4}
                ]
            ),
            Freelancer(
                name="Lê Phương Anh", avatar="LA", role="Editor / Post-prod", category="Edit",
                status="busy", stars=4, rate_daily=1800000, portfolio="https://behance.net",
                phone="0912 345 678", tax_id="098765432109", bank_name="Techcombank", bank_account="190xxxx321",
                cccd_done=True, contract_signed=True, nda_signed=False, tncn_consent=True, note="NDA chưa ký — cần gửi lại trước dự án tới",
                projects=[
                    {"name": "MediaPro KOL Campaign", "date": "20/06/2026", "paid": False, "rating": 4},
                    {"name": "StartupX Launch Kit", "date": "05/05/2026", "paid": True, "rating": 4}
                ]
            ),
            Freelancer(
                name="Nguyễn Bảo Châu", avatar="NC", role="Makeup Artist", category="Makeup",
                status="available", stars=5, rate_daily=1500000, rate_project=4000000,
                phone="0933 456 789", bank_name="ACB", bank_account="217xxxx654",
                cccd_done=True, contract_signed=True, nda_signed=True, tncn_consent=False,
                projects=[
                    {"name": "Vingroup TVC Q2", "date": "08/06/2026", "paid": True, "rating": 5},
                    {"name": "Highlands Rebranding", "date": "30/04/2026", "paid": True, "rating": 5}
                ]
            ),
            Freelancer(
                name="Vũ Thanh Hùng", avatar="VH", role="Stylist / Wardrobe", category="Stylist",
                status="available", stars=3, rate_daily=1200000, phone="0944 567 890",
                cccd_done=True, contract_signed=False, nda_signed=False, tncn_consent=False, note="Trễ hẹn 2 lần — cần báo trước 48h",
                projects=[
                    {"name": "Highlands Rebranding", "date": "02/05/2026", "paid": True, "rating": 3}
                ]
            ),
            Freelancer(
                name="Phan Thị Mỹ Duyên", avatar="PD", role="Voice Talent", category="Voice",
                status="available", stars=5, rate_daily=800000, rate_project=2500000,
                portfolio="https://soundcloud.com", phone="0955 678 901", tax_id="056789012345",
                bank_name="MB Bank", bank_account="091xxxx432", cccd_done=True, contract_signed=True,
                nda_signed=True, tncn_consent=True, projects=[
                    {"name": "F88 Social Q2", "date": "18/06/2026", "paid": False, "rating": 5},
                    {"name": "Vingroup TVC Q2", "date": "12/06/2026", "paid": True, "rating": 5}
                ]
            ),
            Freelancer(
                name="Cao Duy Khang", avatar="CK", role="Diễn viên", category="Actor",
                status="blacklist", stars=1, rate_daily=3000000, phone="0966 789 012",
                cccd_done=True, contract_signed=True, nda_signed=False, tncn_consent=False, note="Bỏ set giữ chừng không báo trước — đã đưa vào blacklist",
                projects=[
                    {"name": "F88 Social Q1", "date": "20/01/2026", "paid": True, "rating": 1}
                ]
            ),
            Freelancer(
                name="Đinh Anh Kiệt", avatar="DK", role="Drone Pilot", category="Camera",
                status="available", stars=4, rate_daily=2000000, rate_project=5500000,
                portfolio="https://youtube.com", phone="0977 890 123", tax_id="034567890123",
                bank_name="VPBank", bank_account="145xxxx876", cccd_done=True, contract_signed=True,
                nda_signed=True, tncn_consent=True, projects=[
                    {"name": "Vingroup TVC Q2", "date": "09/06/2026", "paid": True, "rating": 4}
                ]
            ),
            Freelancer(
                name="Trần Khánh Linh", avatar="KL", role="Copywriter / Script", category="Content",
                status="busy", stars=4, rate_daily=900000, rate_project=2000000, phone="0988 901 234",
                cccd_done=False, contract_signed=False, nda_signed=False, tncn_consent=False, note="Freelancer mới — chưa hoàn thiện hồ sơ pháp lý",
                projects=[
                    {"name": "MediaPro KOL Campaign", "date": "15/06/2026", "paid": False, "rating": 4}
                ]
            )
        ]
        db.add_all(freelancers)
        db.commit()

    # Attendance Logs and Leave Requests mock data removed

    # 4. Seed Shifts
    if db.query(Shift).count() == 0:
        shifts = [
            Shift(name="Ca Hành Chính", start_time="08:00", end_time="17:00", break_time="12:00–13:00", days="T2–T6"),
            Shift(name="Ca Sáng Sớm", start_time="06:00", end_time="14:00", break_time="10:00–10:30", days="T2–T7"),
            Shift(name="Ca Chiều", start_time="13:00", end_time="21:00", break_time="17:00–17:30", days="T2–T7")
        ]
        db.add_all(shifts)
        db.commit()

    # 5. Seed Holidays
    if db.query(Holiday).count() == 0:
        holidays = [
            Holiday(date="30/04/2026", name="Ngày Giải phóng miền Nam"),
            Holiday(date="01/05/2026", name="Quốc tế Lao động"),
            Holiday(date="02/09/2026", name="Quốc khánh"),
            Holiday(date="10/03/2026 (âl)", name="Giỗ Tổ Hùng Vương")
        ]
        db.add_all(holidays)
        db.commit()
