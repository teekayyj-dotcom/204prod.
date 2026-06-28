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
        note=payload.note
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

@router.get("/holidays", response_model=list[HolidayResponse])
def list_holidays(db: Session = Depends(get_db_session)):
    return get_all_holidays(db)

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
    today_str = datetime.now().strftime("%Y-%m-%d")
    attendance = db.query(AttendanceLog).filter(AttendanceLog.date == today_str).all()
    
    # Create checkin lookup
    checkin_lookup = {}
    for log in attendance:
        if log.action == "check-in":
            checkin_lookup[log.employee_name] = {
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
