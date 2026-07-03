from sqlalchemy.orm import Session
from app.modules.finance.models import (
    Expense, Payout, RevenueBreakdown, Receivable,
    OverdueBill, PendingBill, PipelineDeal, ForecastGoal, Goal, CashHistory
)
from app.modules.finance.schemas import ExpenseCreate
from app.modules.hr.models import Freelancer
from datetime import datetime, timedelta
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
            # Check client invoice status dynamically from client_invoices table
            from app.modules.finance.models import ClientInvoice
            matching_inv = db.query(ClientInvoice).filter(
                ClientInvoice.project == payload.project,
                ClientInvoice.status == "paid"
            ).first()
            if matching_inv:
                client_invoice_paid = True
                payout_status = "pending" if doc_complete else "blocked"
            else:
                client_invoice_paid = False
                payout_status = "blocked"

    # Use explicit payee/bank details from payload if provided
    if getattr(payload, "payee", None):
        payee = payload.payee
    if getattr(payload, "bank_name", None):
        bank_name = payload.bank_name
    if getattr(payload, "bank_account", None):
        bank_account = payload.bank_account
        
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
    # No mock goals are seeded. All goals and targets must be created directly by the user in the database.

    if db.query(CashHistory).count() == 0:
        past_date = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")
        db.add(CashHistory(date=past_date, balance=0.0))
        db.commit()

    if db.query(Receivable).count() == 0:
        db.add(Receivable(
            collected=0.0,
            pending=0.0,
            overdue=0.0,
        ))
        db.commit()

def recalculate_receivables(db: Session) -> None:
    from app.modules.finance.models import ClientInvoice, Receivable
    
    invoices = db.query(ClientInvoice).all()
    
    collected_sum = 0.0
    pending_sum = 0.0
    overdue_sum = 0.0
    
    for inv in invoices:
        status_val = (inv.status or "").lower()
        amount_val = float(inv.amount or 0.0)
        
        if status_val == "paid":
            collected_sum += amount_val
        elif status_val == "overdue":
            overdue_sum += amount_val
        else: # pending / unpaid
            pending_sum += amount_val
            
    receivables = db.query(Receivable).first()
    if not receivables:
        receivables = Receivable(collected=0.0, pending=0.0, overdue=0.0)
        db.add(receivables)
        
    receivables.collected = collected_sum
    receivables.pending = pending_sum
    receivables.overdue = overdue_sum
    db.commit()



def calculate_goal_current(db: Session, goal_id: str, default_val: float) -> float:
    from app.modules.projects.models import Project
    from app.modules.crew.models import CrewMember

    try:
        # Load and parse client invoices for revenue segments
        from app.modules.projects.models import Client
        import json

        clients = db.query(Client).all()
        retainer_sum = 0.0
        media_sum = 0.0
        total_crm_sum = 0.0

        for c in clients:
            if c.notes:
                try:
                    crm = json.loads(c.notes)
                    for inv in crm.get("invoices", []):
                        if inv.get("status") == "Paid":
                            amount = float(inv.get("amount") or 0.0)
                            desc = (inv.get("description") or "").lower()
                            total_crm_sum += amount
                            if "retainer" in desc:
                                retainer_sum += amount
                            elif any(k in desc for k in ["media", "photo", "chụp", "quay", "booking"]):
                                media_sum += amount
                except Exception:
                    pass

        # Common variables
        receivables = db.query(Receivable).first()
        collected = (receivables.collected if receivables else 0.0)
        total_expenses = sum(e.amount for e in db.query(Expense).all())
        opex_expenses = sum(e.amount for e in db.query(Expense).filter(Expense.group == "opex").all())

        if goal_id == "r1":  # Doanh thu Q3
            return collected / 1_000_000
        elif goal_id == "r2":  # Retainer Revenue
            return retainer_sum / 1_000_000
        elif goal_id == "r3":  # Media Booking
            return media_sum / 1_000_000
        elif goal_id == "p1":  # Lợi nhuận Q3
            profit_val = collected - total_expenses
            return profit_val / 1_000_000
        elif goal_id == "p2":  # Net Profit Margin
            profit_val = collected - total_expenses
            p2_val = (profit_val / collected * 100) if collected > 0 else 0.0
            return round(p2_val, 1)
        elif goal_id == "c1":  # Chi phí Outsource
            outsource_expenses = sum(e.amount for e in db.query(Expense).filter(Expense.category == "Thuê ngoài & Talent").all())
            return outsource_expenses / 1_000_000
        elif goal_id == "c2":  # OPEX / Doanh thu
            c2_val = (opex_expenses / collected * 100) if collected > 0 else 0.0
            return round(c2_val, 1)
        elif goal_id == "ca1":  # AR Days (Trung bình)
            overdue_bills = db.query(OverdueBill).all()
            if overdue_bills:
                return round(sum(b.days for b in overdue_bills) / len(overdue_bills), 1)
            return 0.0
        elif goal_id == "ca2":  # Available Cash Buffer
            paid_payouts = sum(p.gross for p in db.query(Payout).filter(Payout.status == "paid").all())
            available_cash = collected - paid_payouts
            return round(available_cash / 1_000_000_000, 2)
        elif goal_id == "a1":  # Mục tiêu Admin (Tuyển dụng)
            crew_count = db.query(CrewMember).count()
            return float(crew_count)
        elif goal_id == "a2":  # Chi phí Vận hành (Admin)
            return opex_expenses / 1_000_000
    except Exception as e:
        print(f"Error calculating goal {goal_id} current value: {e}")
        
    return default_val
