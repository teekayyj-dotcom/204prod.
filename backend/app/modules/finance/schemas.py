from pydantic import BaseModel
from datetime import datetime

class ExpenseBase(BaseModel):
    date: str
    description: str
    category: str
    group: str
    amount: float
    budget: float | None = None
    project: str | None = None
    submitter: str
    avatar: str
    status: str = "ok"
    note: str | None = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseResponse(ExpenseBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


class PayoutBase(BaseModel):
    id: str
    payee: str
    avatar: str
    category: str
    project: str
    gross: float
    tax: float
    net: float
    due_date: str
    status: str = "pending"
    client_invoice_paid: bool = True
    doc_complete: bool = True
    bank_name: str
    bank_account: str
    tncn_consent: bool = False
    is_freelancer: bool = False
    expense_group: str
    note: str | None = None
    auto_created: bool = False

class PayoutCreate(PayoutBase):
    pass

class PayoutResponse(PayoutBase):
    created_at: datetime

    class Config:
        from_attributes = True


class RevenueBreakdownResponse(BaseModel):
    id: int
    name: str
    value: float
    color: str

    class Config:
        from_attributes = True

class ReceivableResponse(BaseModel):
    id: int
    collected: float
    pending: float
    overdue: float

    class Config:
        from_attributes = True

class OverdueBillResponse(BaseModel):
    id: int
    client: str
    invoice: str
    amount: float
    days: int
    contact: str

    class Config:
        from_attributes = True

class PendingBillResponse(BaseModel):
    id: int
    client: str
    invoice: str
    amount: float
    due_in: int
    stage: str

    class Config:
        from_attributes = True

class PipelineDealResponse(BaseModel):
    id: int
    name: str
    value: float
    prob: int
    stage: str
    closes: str

    class Config:
        from_attributes = True

class ForecastGoalResponse(BaseModel):
    id: int
    month: str
    low: float
    mid: float
    high: float

    class Config:
        from_attributes = True
