from pydantic import BaseModel, Field
from datetime import datetime
from typing import Any

class FreelancerBase(BaseModel):
    name: str
    avatar: str
    role: str
    category: str
    status: str = "available"
    stars: int = 5
    rate_daily: int = 0
    rate_project: int | None = None
    portfolio: str | None = None
    phone: str
    tax_id: str | None = None
    bank_name: str | None = None
    bank_account: str | None = None
    cccd_done: bool = False
    contract_signed: bool = False
    nda_signed: bool = False
    tncn_consent: bool = False
    projects: list[dict[str, Any]] | None = None
    note: str | None = None

class FreelancerCreate(FreelancerBase):
    pass

class FreelancerUpdate(BaseModel):
    name: str | None = None
    avatar: str | None = None
    role: str | None = None
    category: str | None = None
    status: str | None = None
    stars: int | None = None
    rate_daily: int | None = None
    rate_project: int | None = None
    portfolio: str | None = None
    phone: str | None = None
    tax_id: str | None = None
    bank_name: str | None = None
    bank_account: str | None = None
    cccd_done: bool | None = None
    contract_signed: bool | None = None
    nda_signed: bool | None = None
    tncn_consent: bool | None = None
    projects: list[dict[str, Any]] | None = None
    note: str | None = None

class FreelancerResponse(FreelancerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AttendanceLogBase(BaseModel):
    employee_name: str
    avatar: str
    action: str
    time: str
    date: str
    status: str = "on-time"
    note: str | None = None
    lat: float | None = None
    lng: float | None = None

class AttendanceLogCreate(AttendanceLogBase):
    pass

class AttendanceLogResponse(AttendanceLogBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class LeaveRequestBase(BaseModel):
    employee_name: str
    avatar: str
    type: str
    status: str = "pending"
    date: str
    reason: str
    submitted_at: str
    urgent: bool = False

class LeaveRequestCreate(LeaveRequestBase):
    pass

class LeaveRequestUpdate(BaseModel):
    status: str

class LeaveRequestResponse(LeaveRequestBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ShiftBase(BaseModel):
    name: str
    start_time: str
    end_time: str
    break_time: str
    days: str

class ShiftCreate(ShiftBase):
    pass

class ShiftResponse(ShiftBase):
    id: int

    class Config:
        from_attributes = True


class HolidayBase(BaseModel):
    date: str
    name: str

class HolidayCreate(HolidayBase):
    pass

class HolidayResponse(HolidayBase):
    id: int

    class Config:
        from_attributes = True

class TimesheetEmployee(BaseModel):
    name: str
    avatar: str
    role: str

class TimesheetData(BaseModel):
    employee: TimesheetEmployee
    days: list[str]
    totalDays: float
    ot: str
    lateMin: int

class AttendanceStats(BaseModel):
    workingCount: int
    wfhCount: int
    lateCount: int
    absentCount: int
    totalEmployees: int
    attendanceRate: str

class WorkScheduleBase(BaseModel):
    employee_id: int | None = None
    employee_name: str
    avatar: str | None = None
    week_start_date: str
    schedule_data: dict

class WorkScheduleCreate(WorkScheduleBase):
    pass

class WorkScheduleResponse(WorkScheduleBase):
    id: int
    created_at: datetime | None = None

    class Config:
        from_attributes = True
