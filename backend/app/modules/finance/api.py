from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db_session
from app.modules.finance.schemas import ExpenseCreate, ExpenseResponse, PayoutResponse
from app.modules.finance.service import (
    list_all_expenses, create_new_expense,
    list_all_payouts, pay_payout_by_id, get_revenue_stats
)

router = APIRouter(prefix="/finance", tags=["finance"])

# Expenses
@router.get("/expenses", response_model=list[ExpenseResponse])
def list_expenses(db: Session = Depends(get_db_session)):
    return list_all_expenses(db)

@router.post("/expenses", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(payload: ExpenseCreate, db: Session = Depends(get_db_session)):
    return create_new_expense(db, payload)

# Payouts
@router.get("/payables", response_model=list[PayoutResponse])
def list_payables(db: Session = Depends(get_db_session)):
    return list_all_payouts(db)

@router.put("/payables/{pay_id}/pay", response_model=PayoutResponse)
def pay_payable(pay_id: str, db: Session = Depends(get_db_session)):
    payout = pay_payout_by_id(db, pay_id)
    if not payout:
        raise HTTPException(status_code=404, detail="Payout not found")
    return payout

# Revenue Overview Statistics
@router.get("/revenue")
def get_revenue_overview(db: Session = Depends(get_db_session)):
    stats = get_revenue_stats(db)
    
    return {
        **stats,
        "monthly_stacked": [],
        "monthly_expenses_trend": [],
        "top_services": [],
        "top_clients": []
    }

@router.get("/overview")
def get_finance_overview_dashboard(db: Session = Depends(get_db_session)):
    # In a real app, these would be calculated from Expense/Invoice tables.
    # Currently returning empty arrays as we've removed mock data.
    return {
        "pl_monthly": [],
        "overdue_invoices": [],
        "upcoming_payouts": [],
        "goals": [],
        "top_projects": []
    }

@router.get("/goals")
def get_finance_goals(db: Session = Depends(get_db_session)):
    # Currently returning empty arrays as we've removed mock data.
    # In a fully fleshed out app, these would be queried from ForecastGoal or similar.
    return {
        "revenue": [],
        "profit": [],
        "cost": [],
        "cash": []
    }

@router.put("/goals/{goal_id}")
def update_finance_goal(goal_id: str, payload: dict, db: Session = Depends(get_db_session)):
    # Mock update endpoint for frontend
    return {"status": "ok", "goal_id": goal_id, "updated_target": payload.get("target")}


