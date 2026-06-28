from sqlalchemy.orm import Session
from app.modules.finance.models import (
    Expense, Payout, RevenueBreakdown, Receivable,
    OverdueBill, PendingBill, PipelineDeal, ForecastGoal
)

def get_expenses(db: Session) -> list[Expense]:
    return db.query(Expense).order_by(Expense.date.desc(), Expense.created_at.desc()).all()

def get_expense_by_id(db: Session, exp_id: str) -> Expense | None:
    return db.query(Expense).filter(Expense.id == exp_id).first()

def create_expense(db: Session, db_expense: Expense) -> Expense:
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

def delete_expense(db: Session, exp_id: str) -> bool:
    db_expense = get_expense_by_id(db, exp_id)
    if not db_expense:
        return False
    db.delete(db_expense)
    db.commit()
    return True

def get_payouts(db: Session) -> list[Payout]:
    return db.query(Payout).order_by(Payout.due_date.asc(), Payout.created_at.desc()).all()

def get_payout_by_id(db: Session, pay_id: str) -> Payout | None:
    return db.query(Payout).filter(Payout.id == pay_id).first()

def create_payout(db: Session, db_payout: Payout) -> Payout:
    db.add(db_payout)
    db.commit()
    db.refresh(db_payout)
    return db_payout

def update_payout_status(db: Session, pay_id: str, status: str) -> Payout | None:
    db_payout = get_payout_by_id(db, pay_id)
    if not db_payout:
        return None
    db_payout.status = status
    db.commit()
    db.refresh(db_payout)
    return db_payout

def get_revenue_breakdowns(db: Session) -> list[RevenueBreakdown]:
    return db.query(RevenueBreakdown).all()

def get_receivables(db: Session) -> Receivable | None:
    return db.query(Receivable).first()

def get_overdue_bills(db: Session) -> list[OverdueBill]:
    return db.query(OverdueBill).all()

def get_pending_bills(db: Session) -> list[PendingBill]:
    return db.query(PendingBill).all()

def get_pipeline_deals(db: Session) -> list[PipelineDeal]:
    return db.query(PipelineDeal).all()

def get_forecast_goals(db: Session) -> list[ForecastGoal]:
    return db.query(ForecastGoal).all()
