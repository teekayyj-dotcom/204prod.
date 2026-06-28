from sqlalchemy.orm import Session
from app.modules.finance.models import (
    Expense, Payout, RevenueBreakdown, Receivable,
    OverdueBill, PendingBill, PipelineDeal, ForecastGoal
)
from app.modules.finance.schemas import ExpenseCreate
from app.modules.hr.models import Freelancer
from datetime import datetime
import uuid

def list_all_expenses(db: Session) -> list[Expense]:
    return db.query(Expense).order_by(Expense.date.desc(), Expense.created_at.desc()).all()

def create_new_expense(db: Session, payload: ExpenseCreate) -> Expense:
    # 1. Generate ID (e.g. e + random hex digits)
    exp_id = "e_" + uuid.uuid4().hex[:6]
    
    # 2. Determine status based on amount vs budget
    status = "ok"
    if payload.budget:
        ratio = payload.amount / payload.budget
        if ratio > 1.0:
            status = "over"
        elif ratio > 0.85:
            status = "warning"
            
    db_expense = Expense(
        id=exp_id,
        date=payload.date,
        description=payload.description,
        category=payload.category,
        group=payload.group,
        amount=payload.amount,
        budget=payload.budget,
        project=payload.project,
        submitter=payload.submitter,
        avatar=payload.avatar,
        status=status,
        note=payload.note
    )
    db.add(db_expense)
    
    # 3. Automatically create a Payout if this requires a payout
    # The categories requiring payouts are: Thuê ngoài, Thuê văn phòng, điện nước, vv.
    # In general, let's create a payout for any OPEX or COGS expense that doesn't represent direct cash/credit card checkout,
    # or just create it for everything to track outflow cash control.
    # Let's see: we map the expense to a payout payee.
    payee = payload.submitter
    is_freelancer = False
    tax = 0.0
    net = payload.amount
    tncn_consent = False
    bank_name = "Thẻ tín dụng DN"
    bank_account = "xxxx-xxxx-xxxx-8876"
    doc_complete = True
    payout_status = "pending"
    client_invoice_paid = True
    
    # Check if this is an outsource talent
    if payload.group == "cogs" and payload.category == "Thuê ngoài & Talent":
        # Check if submitter name is a freelancer in HR
        freelancer = db.query(Freelancer).filter(Freelancer.name == payload.submitter).first()
        if freelancer:
            is_freelancer = True
            payee = freelancer.name
            tncn_consent = freelancer.tncn_consent
            bank_name = freelancer.bank_name or "VCB"
            bank_account = freelancer.bank_account or "—"
            doc_complete = freelancer.cccd_done and freelancer.contract_signed and freelancer.nda_signed
            
            # Tax 10% if tncn_consent
            if tncn_consent:
                tax = round(payload.amount * 0.1)
                net = payload.amount - tax
                
            payout_status = "pending" if doc_complete else "blocked"
            # Blocked if payee invoice not paid by client (mock flag)
            if payload.project and "Vingroup" not in payload.project:
                client_invoice_paid = False
                payout_status = "blocked"

    # For general opex like office rent, electricity
    if "thuê văn phòng" in payload.description.lower():
        payee = "Lộc Phát Real Estate"
        bank_name = "Techcombank"
        bank_account = "1913xxxx999"
    elif "điện" in payload.description.lower() or "nước" in payload.description.lower():
        payee = "EVN TP.Hồ Chí Minh"
        bank_name = "BIDV"
        bank_account = "220xxxx888"
    elif "adobe" in payload.description.lower() or " Creative Cloud" in payload.description.lower():
        payee = "Adobe Creative Cloud"
    elif "midjourney" in payload.description.lower():
        payee = "Midjourney Inc."
    elif "lương" in payload.description.lower():
        payee = "Nhân sự nội bộ (6 người)"
        bank_name = "VCB (Bảng kê lương)"
        bank_account = "(6 tài khoản cá nhân)"
        net = payload.amount
        
    p_id = "p_" + uuid.uuid4().hex[:6]
    db_payout = Payout(
        id=p_id,
        payee=payee,
        avatar=payload.avatar,
        category=payload.category,
        project=payload.project or "Vận hành chung",
        gross=payload.amount,
        tax=tax,
        net=net,
        due_date=payload.date,
        status=payout_status,
        client_invoice_paid=client_invoice_paid,
        doc_complete=doc_complete,
        bank_name=bank_name,
        bank_account=bank_account,
        tncn_consent=tncn_consent,
        is_freelancer=is_freelancer,
        expense_group=payload.group,
        note=payload.note,
        auto_created=True
    )
    db.add(db_payout)
    
    db.commit()
    db.refresh(db_expense)
    return db_expense

def list_all_payouts(db: Session) -> list[Payout]:
    return db.query(Payout).order_by(Payout.due_date.asc(), Payout.created_at.desc()).all()

def pay_payout_by_id(db: Session, pay_id: str) -> Payout | None:
    db_payout = db.query(Payout).filter(Payout.id == pay_id).first()
    if not db_payout:
        return None
    db_payout.status = "paid"
    db.commit()
    db.refresh(db_payout)
    return db_payout

def get_revenue_stats(db: Session) -> dict:
    breakdowns = db.query(RevenueBreakdown).all()
    receivables = db.query(Receivable).first()
    overdues = db.query(OverdueBill).all()
    pendings = db.query(PendingBill).all()
    pipeline = db.query(PipelineDeal).all()
    forecast = db.query(ForecastGoal).all()

    return {
        "breakdowns": breakdowns,
        "receivables": {
            "collected": receivables.collected if receivables else 0.0,
            "pending": receivables.pending if receivables else 0.0,
            "overdue": receivables.overdue if receivables else 0.0
        } if receivables else {"collected": 0, "pending": 0, "overdue": 0},
        "overdue_bills": overdues,
        "pending_bills": pendings,
        "pipeline": pipeline,
        "forecast": forecast
    }

def seed_finance_data(db: Session) -> None:
    pass

