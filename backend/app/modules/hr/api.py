from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db_session
from app.modules.hr.schemas import (
    FreelancerCreate, FreelancerUpdate, FreelancerResponse,
    AttendanceLogCreate, AttendanceLogResponse,
    LeaveRequestCreate, LeaveRequestResponse, LeaveRequestUpdate,
    ShiftCreate, ShiftResponse,
    HolidayCreate, HolidayResponse,
    TimesheetData, AttendanceStats
)
from app.modules.hr.service import (
    get_all_freelancers, get_freelancer_by_id, create_new_freelancer,
    update_freelancer_by_id, delete_freelancer_by_id,
    get_all_attendance_logs, create_attendance_record,
    get_all_leave_requests, create_leave_request_record, update_leave_request_status,
    get_all_shifts, get_all_holidays,
    get_timesheet, get_attendance_stats
)
from app.modules.crew.service import get_crew_members
from app.modules.hr.models import AttendanceLog
from datetime import datetime

router = APIRouter(prefix="/hr", tags=["hr"])

# Freelancers
@router.get("/freelancers", response_model=list[FreelancerResponse])
def list_freelancers(db: Session = Depends(get_db_session)):
    return get_all_freelancers(db)

@router.get("/freelancers/{fid}", response_model=FreelancerResponse)
def get_freelancer(fid: int, db: Session = Depends(get_db_session)):
    freelancer = get_freelancer_by_id(db, fid)
    if not freelancer:
        raise HTTPException(status_code=404, detail="Freelancer not found")
    return freelancer

@router.post("/freelancers", response_model=FreelancerResponse, status_code=status.HTTP_201_CREATED)
def create_freelancer(payload: FreelancerCreate, db: Session = Depends(get_db_session)):
    return create_new_freelancer(db, payload)

@router.put("/freelancers/{fid}", response_model=FreelancerResponse)
def update_freelancer(fid: int, payload: FreelancerUpdate, db: Session = Depends(get_db_session)):
    freelancer = update_freelancer_by_id(db, fid, payload)
    if not freelancer:
        raise HTTPException(status_code=404, detail="Freelancer not found")
    return freelancer

@router.delete("/freelancers/{fid}", status_code=status.HTTP_204_NO_CONTENT)
def delete_freelancer(fid: int, db: Session = Depends(get_db_session)):
    success = delete_freelancer_by_id(db, fid)
    if not success:
        raise HTTPException(status_code=404, detail="Freelancer not found")
    return None

# Attendance Logs
@router.get("/attendance-logs", response_model=list[AttendanceLogResponse])
def list_attendance_logs(db: Session = Depends(get_db_session)):
    return get_all_attendance_logs(db)

@router.post("/attendance-logs", response_model=AttendanceLogResponse, status_code=status.HTTP_201_CREATED)
def add_attendance_log(payload: AttendanceLogCreate, db: Session = Depends(get_db_session)):
    return create_attendance_record(
        db,
        employee_name=payload.employee_name,
        avatar=payload.avatar,
        action=payload.action,
        time=payload.time,
        date=payload.date,
        status=payload.status,
        note=payload.note,
        lat=payload.lat,
        lng=payload.lng
    )

# Leave Requests
@router.get("/leave-requests", response_model=list[LeaveRequestResponse])
def list_leave_requests(db: Session = Depends(get_db_session)):
    return get_all_leave_requests(db)

@router.post("/leave-requests", response_model=LeaveRequestResponse, status_code=status.HTTP_201_CREATED)
def add_leave_request(payload: LeaveRequestCreate, db: Session = Depends(get_db_session)):
    return create_leave_request_record(db, payload)

@router.put("/leave-requests/{req_id}/status", response_model=LeaveRequestResponse)
def update_request_status(req_id: int, payload: LeaveRequestUpdate, db: Session = Depends(get_db_session)):
    req = update_leave_request_status(db, req_id, payload.status)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    return req

# Shifts & Holidays
@router.get("/shifts", response_model=list[ShiftResponse])
def list_shifts(db: Session = Depends(get_db_session)):
    return get_all_shifts(db)

@router.post("/shifts", response_model=ShiftResponse)
def create_shift(payload: ShiftCreate, db: Session = Depends(get_db_session)):
    from app.modules.hr.models import Shift
    db_shift = Shift(
        name=payload.name,
        start_time=payload.start_time,
        end_time=payload.end_time,
        break_time=payload.break_time,
        days=payload.days
    )
    db.add(db_shift)
    db.commit()
    db.refresh(db_shift)
    return db_shift

@router.put("/shifts/{shift_id}", response_model=ShiftResponse)
def update_shift(shift_id: int, payload: ShiftCreate, db: Session = Depends(get_db_session)):
    from app.modules.hr.models import Shift
    db_shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not db_shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    db_shift.name = payload.name
    db_shift.start_time = payload.start_time
    db_shift.end_time = payload.end_time
    db_shift.break_time = payload.break_time
    db_shift.days = payload.days
    db.commit()
    db.refresh(db_shift)
    return db_shift

@router.delete("/shifts/{shift_id}")
def delete_shift(shift_id: int, db: Session = Depends(get_db_session)):
    from app.modules.hr.models import Shift
    db_shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not db_shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    db.delete(db_shift)
    db.commit()
    return {"message": "Shift deleted successfully"}

@router.get("/holidays", response_model=list[HolidayResponse])
def list_holidays(db: Session = Depends(get_db_session)):
    return get_all_holidays(db)

@router.post("/holidays", response_model=HolidayResponse)
def create_holiday(payload: HolidayCreate, db: Session = Depends(get_db_session)):
    from app.modules.hr.models import Holiday
    db_holiday = Holiday(
        date=payload.date,
        name=payload.name
    )
    db.add(db_holiday)
    db.commit()
    db.refresh(db_holiday)
    return db_holiday

@router.put("/holidays/{holiday_id}", response_model=HolidayResponse)
def update_holiday(holiday_id: int, payload: HolidayCreate, db: Session = Depends(get_db_session)):
    from app.modules.hr.models import Holiday
    db_holiday = db.query(Holiday).filter(Holiday.id == holiday_id).first()
    if not db_holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")
    db_holiday.date = payload.date
    db_holiday.name = payload.name
    db.commit()
    db.refresh(db_holiday)
    return db_holiday

@router.delete("/holidays/{holiday_id}")
def delete_holiday(holiday_id: int, db: Session = Depends(get_db_session)):
    from app.modules.hr.models import Holiday
    db_holiday = db.query(Holiday).filter(Holiday.id == holiday_id).first()
    if not db_holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")
    db.delete(db_holiday)
    db.commit()
    return {"message": "Holiday deleted successfully"}

# Timesheet
@router.get("/timesheet", response_model=list[TimesheetData])
def get_timesheet_data(year: int, month: int, db: Session = Depends(get_db_session)):
    return get_timesheet(db, year, month)

# Attendance Stats
@router.get("/attendance-stats", response_model=AttendanceStats)
def get_attendance_stats_data(db: Session = Depends(get_db_session)):
    return get_attendance_stats(db)

# Overview statistics combining team dynamic statuses and alerts
@router.get("/overview")
def get_hr_overview(db: Session = Depends(get_db_session)):
    # 1. Fetch crew members
    crew = get_crew_members(db)
    
    # 2. Get today's attendance logs
    from datetime import datetime
    from app.modules.users.models import User
    
    today_str = datetime.now().strftime("%Y-%m-%d")
    attendance = db.query(AttendanceLog).filter(AttendanceLog.date == today_str).all()
    
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

    # Create checkin lookup
    checkin_lookup = {}
    for log in attendance:
        if log.action == "check-in":
            emp_name = user_to_crew.get(log.employee_name, log.employee_name)
            checkin_lookup[emp_name] = {
                "time": log.time,
                "status": log.status
            }
    
    # Construct team list
    team_list = []
    for member in crew:
        c_info = checkin_lookup.get(member.name)
        status = "absent"
        checkin_time = None
        
        if c_info:
            checkin_time = c_info["time"]
            status = "wfh" if c_info["status"] == "wfh" else "office"
        
        # Determine department based on roles for UI charts
        role_lower = (member.role or "").lower()
        dept = "Production"
        if "designer" in role_lower or "motion" in role_lower:
            dept = "Design"
        elif "developer" in role_lower:
            dept = "Tech"
        elif "copywriter" in role_lower or "script" in role_lower:
            dept = "Content"
        elif "account" in role_lower or "manager" in role_lower:
            dept = "Account"

        team_list.append({
            "id": member.id,
            "name": member.name,
            "avatar": member.avatar or (member.name[0] + member.name.split()[-1][0] if len(member.name.split()) > 1 else member.name[:2]).upper(),
            "role": member.role or "Crew Member",
            "dept": dept,
            "type": "freelancer" if "freelance" in role_lower else "inhouse",
            "status": status,
            "checkin": checkin_time
        })
        
    # Get requests and open roles
    requests = get_all_leave_requests(db)
    
    # Dynamic alerts based on real data
    hr_alerts = []
    pending_reqs = [r for r in requests if r.status == "pending"]
    if pending_reqs:
        hr_alerts.append({
            "id": 1,
            "level": "warning",
            "title": f"Có {len(pending_reqs)} đơn từ đang chờ duyệt",
            "sub": "Vui lòng kiểm tra và duyệt đơn",
            "action": "Xem đơn"
        })
    
    open_roles = []

    return {
        "team": team_list,
        "requests": requests,
        "alerts": hr_alerts,
        "open_roles": open_roles
    }
