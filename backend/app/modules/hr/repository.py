from sqlalchemy import select
from sqlalchemy.orm import Session
from app.modules.hr.models import Freelancer, AttendanceLog, LeaveRequest, Shift, Holiday

def get_freelancer(db: Session, freelancer_id: int) -> Freelancer | None:
    return db.query(Freelancer).filter(Freelancer.id == freelancer_id).first()

def get_freelancers(db: Session) -> list[Freelancer]:
    return db.query(Freelancer).all()

def create_freelancer(db: Session, db_freelancer: Freelancer) -> Freelancer:
    db.add(db_freelancer)
    db.commit()
    db.refresh(db_freelancer)
    return db_freelancer

def delete_freelancer(db: Session, freelancer_id: int) -> bool:
    db_freelancer = get_freelancer(db, freelancer_id)
    if not db_freelancer:
        return False
    db.delete(db_freelancer)
    db.commit()
    return True

def get_attendance_logs(db: Session) -> list[AttendanceLog]:
    return db.query(AttendanceLog).order_by(AttendanceLog.id.desc()).all()

def create_attendance_log(db: Session, db_log: AttendanceLog) -> AttendanceLog:
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

def get_leave_requests(db: Session) -> list[LeaveRequest]:
    return db.query(LeaveRequest).order_by(LeaveRequest.id.desc()).all()

def get_leave_request(db: Session, request_id: int) -> LeaveRequest | None:
    return db.query(LeaveRequest).filter(LeaveRequest.id == request_id).first()

def create_leave_request(db: Session, db_req: LeaveRequest) -> LeaveRequest:
    db.add(db_req)
    db.commit()
    db.refresh(db_req)
    return db_req

def get_shifts(db: Session) -> list[Shift]:
    return db.query(Shift).all()

def create_shift(db: Session, db_shift: Shift) -> Shift:
    db.add(db_shift)
    db.commit()
    db.refresh(db_shift)
    return db_shift

def get_holidays(db: Session) -> list[Holiday]:
    return db.query(Holiday).all()

def create_holiday(db: Session, db_holiday: Holiday) -> Holiday:
    db.add(db_holiday)
    db.commit()
    db.refresh(db_holiday)
    return db_holiday
