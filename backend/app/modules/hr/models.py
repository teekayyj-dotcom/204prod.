from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, JSON
from app.db.base import Base

class Freelancer(Base):
    __tablename__ = "freelancers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    avatar = Column(String(500), nullable=False)
    role = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False, default="available")  # available, busy, blacklist
    stars = Column(Integer, default=5)
    rate_daily = Column(Integer, nullable=False, default=0)
    rate_project = Column(Integer, nullable=True)
    portfolio = Column(String(500), nullable=True)
    phone = Column(String(50), nullable=False)
    tax_id = Column(String(50), nullable=True)
    bank_name = Column(String(100), nullable=True)
    bank_account = Column(String(100), nullable=True)
    cccd_done = Column(Boolean, default=False)
    contract_signed = Column(Boolean, default=False)
    nda_signed = Column(Boolean, default=False)
    tncn_consent = Column(Boolean, default=False)
    projects = Column(JSON, nullable=True)  # Store array of projects: [{"name": "", "date": "", "paid": bool, "rating": int}]
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Freelancer {self.name}>"

class AttendanceLog(Base):
    __tablename__ = "attendance_logs"

    id = Column(Integer, primary_key=True, index=True)
    employee_name = Column(String(255), nullable=False)
    avatar = Column(String(500), nullable=False)
    action = Column(String(50), nullable=False)  # check-in, check-out
    time = Column(String(50), nullable=False)  # HH:MM
    date = Column(String(50), nullable=False)  # YYYY-MM-DD
    status = Column(String(50), nullable=False, default="on-time")  # on-time, late, absent, wfh
    note = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee_name = Column(String(255), nullable=False)
    avatar = Column(String(500), nullable=False)
    type = Column(String(50), nullable=False)  # leave, sick, ot, wfh, business, explain
    status = Column(String(50), nullable=False, default="pending")  # pending, approved, rejected
    date = Column(String(100), nullable=False)  # e.g., "25–27/06/2026"
    reason = Column(Text, nullable=False)
    submitted_at = Column(String(100), nullable=False)
    urgent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Shift(Base):
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    start_time = Column(String(50), nullable=False)
    end_time = Column(String(50), nullable=False)
    break_time = Column(String(100), nullable=False)
    days = Column(String(100), nullable=False)

class Holiday(Base):
    __tablename__ = "holidays"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)

class WorkSchedule(Base):
    __tablename__ = "work_schedules"

    id = Column(Integer, primary_key=True, index=True)
    employee_name = Column(String(255), nullable=False)
    avatar = Column(String(500), nullable=True)
    week_start_date = Column(String(50), nullable=False)  # e.g., "2026-07-13" (Monday)
    schedule_data = Column(JSON, nullable=False) # {"YYYY-MM-DD": ["morning", "afternoon"]}
    created_at = Column(DateTime, default=datetime.utcnow)
