from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, Float
from app.db.base import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(String(50), primary_key=True, index=True)
    date = Column(String(50), nullable=False)  # MM/DD or YYYY-MM-DD
    description = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    group = Column(String(50), nullable=False)  # opex, cogs, misc
    amount = Column(Float, nullable=False, default=0.0)
    budget = Column(Float, nullable=True)
    project = Column(String(255), nullable=True)
    submitter = Column(String(255), nullable=False)
    avatar = Column(String(500), nullable=False)
    status = Column(String(50), nullable=False, default="ok")  # ok, warning, over
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Payout(Base):
    __tablename__ = "payouts"

    id = Column(String(50), primary_key=True, index=True)
    payee = Column(String(255), nullable=False)
    avatar = Column(String(500), nullable=False)
    category = Column(String(100), nullable=False)
    project = Column(String(255), nullable=False)
    gross = Column(Float, nullable=False, default=0.0)
    tax = Column(Float, nullable=False, default=0.0)
    net = Column(Float, nullable=False, default=0.0)
    due_date = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False, default="pending")  # pending, blocked, overdue, paid
    client_invoice_paid = Column(Boolean, default=True)
    doc_complete = Column(Boolean, default=True)
    bank_name = Column(String(255), nullable=False)
    bank_account = Column(String(255), nullable=False)
    tncn_consent = Column(Boolean, default=False)
    is_freelancer = Column(Boolean, default=False)
    expense_group = Column(String(50), nullable=False)  # opex, cogs
    note = Column(Text, nullable=True)
    auto_created = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class RevenueBreakdown(Base):
    __tablename__ = "revenue_breakdowns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    value = Column(Float, nullable=False)
    color = Column(String(50), nullable=False)

class Receivable(Base):
    __tablename__ = "receivables"

    id = Column(Integer, primary_key=True, index=True)
    collected = Column(Float, nullable=False)
    pending = Column(Float, nullable=False)
    overdue = Column(Float, nullable=False)

class OverdueBill(Base):
    __tablename__ = "overdue_bills"

    id = Column(Integer, primary_key=True, index=True)
    client = Column(String(255), nullable=False)
    invoice = Column(String(50), nullable=False)
    amount = Column(Float, nullable=False)
    days = Column(Integer, nullable=False)
    contact = Column(String(255), nullable=False)

class PendingBill(Base):
    __tablename__ = "pending_bills"

    id = Column(Integer, primary_key=True, index=True)
    client = Column(String(255), nullable=False)
    invoice = Column(String(50), nullable=False)
    amount = Column(Float, nullable=False)
    due_in = Column(Integer, nullable=False)
    stage = Column(String(255), nullable=False)

class PipelineDeal(Base):
    __tablename__ = "pipeline_deals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    value = Column(Float, nullable=False)
    prob = Column(Integer, nullable=False)  # probability %
    stage = Column(String(100), nullable=False)
    closes = Column(String(50), nullable=False)

class ForecastGoal(Base):
    __tablename__ = "forecast_goals"

    id = Column(Integer, primary_key=True, index=True)
    month = Column(String(50), nullable=False)
    low = Column(Float, nullable=False)
    mid = Column(Float, nullable=False)
    high = Column(Float, nullable=False)

class Goal(Base):
    __tablename__ = "goals"

    id = Column(String(50), primary_key=True, index=True)
    category = Column(String(50), nullable=False)
    label = Column(String(255), nullable=False)
    current = Column(Float, nullable=False, default=0.0)
    target = Column(Float, nullable=False, default=0.0)
    unit = Column(String(50), nullable=False)
    lowerIsBetter = Column(Boolean, default=False)
    period = Column(String(50), nullable=True, default="2026-h1")
    created_at = Column(DateTime, default=datetime.utcnow)

class CashHistory(Base):
    __tablename__ = "cash_history"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String(50), nullable=False)
    balance = Column(Float, nullable=False)

class ClientInvoice(Base):
    __tablename__ = "client_invoices"

    id = Column(String(50), primary_key=True, index=True)  # e.g. 204-INV-098
    client_slug = Column(String(120), nullable=False, index=True)  # FK to clients.slug
    client_name = Column(String(255), nullable=False)       # denormalized for easy display
    project = Column(String(255), nullable=False)
    term = Column(String(255), nullable=False)               # e.g. "Tạm ứng 50% đợt 1"
    amount = Column(Float, nullable=False, default=0.0)
    due_date = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False, default="pending")  # pending | paid | overdue
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)
