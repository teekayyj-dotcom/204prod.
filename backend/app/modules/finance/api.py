import uuid
from datetime import datetime, timedelta
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db_session
from app.modules.finance.schemas import (
    ExpenseCreate, ExpenseResponse, PayoutResponse,
    ClientInvoiceCreate, ClientInvoiceResponse
)
from app.modules.finance.service import (
    list_all_expenses, create_new_expense,
    list_all_payouts, pay_payout_by_id, get_revenue_stats
)

from app.modules.finance.models import Goal, ClientInvoice

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
    
    # 1. Calculate top_clients dynamically from client_invoices
    from app.modules.finance.models import ClientInvoice
    from sqlalchemy import func
    
    client_stats = db.query(
        ClientInvoice.client_name,
        func.count(func.distinct(ClientInvoice.project)).label("projects_count"),
        func.sum(ClientInvoice.amount).label("total_spend")
    ).group_by(ClientInvoice.client_name).order_by(func.sum(ClientInvoice.amount).desc()).all()
    
    top_clients = []
    for idx, stat in enumerate(client_stats):
        badge = "vip" if idx == 0 else "key" if idx == 1 else ""
        top_clients.append({
            "name": stat[0],
            "badge": badge,
            "type": "SME" if idx == 0 else "Enterprise",
            "projects": stat[1],
            "spend": stat[2]
        })
        
    # 2. Calculate top_services dynamically from breakdowns
    from app.modules.finance.models import RevenueBreakdown
    breakdowns = db.query(RevenueBreakdown).all()
    total_val = sum(b.value for b in breakdowns) or 1.0
    top_services = []
    for idx, b in enumerate(breakdowns):
        trend = "up" if idx < 2 else "down"
        top_services.append({
            "name": b.name,
            "revenue": b.value,
            "pct": round((b.value / total_val) * 100),
            "trend": trend
        })

    # 3. Monthly stacked trend of revenue (unit in Millions, dynamically calculated)
    invoices = db.query(ClientInvoice).all()
    monthly_stacked_map = {}
    for inv in invoices:
        if not inv.due_date:
            continue
        try:
            parts = inv.due_date.split("-")
            if len(parts) >= 2:
                m_num = int(parts[1])
                month_key = f"T{m_num}"
            else:
                month_key = "T7"
        except:
            month_key = "T7"
            
        if month_key not in monthly_stacked_map:
            monthly_stacked_map[month_key] = {"month": month_key, "project": 0.0, "retainer": 0.0, "media": 0.0}
            
        p_name = (inv.project or "").lower()
        amount_m = (inv.amount or 0.0) / 1_000_000.0
        if "retainer" in p_name:
            monthly_stacked_map[month_key]["retainer"] += amount_m
        elif "media" in p_name:
            monthly_stacked_map[month_key]["media"] += amount_m
        else:
            monthly_stacked_map[month_key]["project"] += amount_m
            
    def month_sort_key(item):
        try:
            return int(item["month"][1:])
        except:
            return 99
            
    monthly_stacked = sorted(monthly_stacked_map.values(), key=month_sort_key)

    # 4. Monthly expenses trend (unit in Millions, dynamically calculated)
    from app.modules.finance.models import Expense
    all_expenses = db.query(Expense).all()
    expenses_map = {}
    for exp in all_expenses:
        if not exp.date:
            continue
        try:
            parts = exp.date.split("-")
            if len(parts) >= 2:
                m_num = int(parts[1])
                month_key = f"T{m_num}"
            else:
                month_key = "T7"
        except:
            month_key = "T7"
            
        if month_key not in expenses_map:
            expenses_map[month_key] = {"month": month_key, "opex": 0.0, "cogs": 0.0, "misc": 0.0}
            
        amount_m = (exp.amount or 0.0) / 1_000_000.0
        grp = (exp.group or "misc").lower()
        if grp in ["opex", "cogs", "misc"]:
            expenses_map[month_key][grp] += amount_m
        else:
            expenses_map[month_key]["misc"] += amount_m
            
    monthly_expenses_trend = sorted(expenses_map.values(), key=month_sort_key)

    # 5. Dynamic previous_revenue from CashHistory balance
    from app.modules.finance.models import CashHistory
    prev_cash = db.query(CashHistory).order_by(CashHistory.date.asc()).first()
    previous_revenue = prev_cash.balance if prev_cash else 0.0

    return {
        **stats,
        "previous_revenue": previous_revenue,
        "monthly_stacked": monthly_stacked,
        "monthly_expenses_trend": monthly_expenses_trend,
        "top_services": top_services,
        "top_clients": top_clients
    }

@router.get("/overview")
def get_finance_overview_dashboard(db: Session = Depends(get_db_session)):
    from app.modules.finance.models import Receivable, OverdueBill, PendingBill, Payout, CashHistory
    
    from app.modules.finance.service import recalculate_receivables
    recalculate_receivables(db)
    
    # 1. Available Cash
    receivables = db.query(Receivable).first()
    collected = receivables.collected if receivables else 0.0
    paid_payouts = sum(p.gross for p in db.query(Payout).filter(Payout.status == "paid").all())
    available_cash = collected - paid_payouts

    # Cash Trend
    past_date = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")
    history = db.query(CashHistory).filter(CashHistory.date <= past_date).order_by(CashHistory.date.desc()).first()
    cash_trend_up = True
    cash_trend_text = "+0M so với tuần trước"
    if history:
        diff = available_cash - history.balance
        cash_trend_up = diff >= 0
        diff_m = abs(diff) / 1000000
        sign = "+" if cash_trend_up else "-"
        cash_trend_text = f"{sign}{diff_m:.1f}M so với tuần trước"

    # 2. Total AR (Accounts Receivable)
    ar_overdue = db.query(OverdueBill).all()
    ar_pending = db.query(PendingBill).all()
    total_ar = sum(b.amount for b in ar_overdue) + sum(b.amount for b in ar_pending)
    if total_ar == 0 and receivables:
        total_ar = receivables.pending + receivables.overdue
    
    ar_trend_up = len(ar_overdue) == 0
    ar_trend_text = "Đang chờ thanh toán" if ar_trend_up else f"Có {len(ar_overdue)} hóa đơn quá hạn"

    # 3. Total AP (Accounts Payable)
    pending_payouts = db.query(Payout).filter(Payout.status != "paid").all()
    total_ap = sum(p.gross for p in pending_payouts)

    overdue_payouts = [p for p in pending_payouts if p.status == "overdue"]
    ap_trend_up = len(overdue_payouts) == 0
    ap_trend_text = "Đang kiểm soát tốt" if ap_trend_up else f"Quá hạn thanh toán {len(overdue_payouts)} khoản"
    if ap_trend_up and len(pending_payouts) > 0:
        ap_trend_text = "Sắp đến hạn thanh toán"

    # 4. Net Cash Flow
    net_cash_flow = available_cash - total_ap
    
    liquidity = (available_cash / total_ap) if total_ap > 0 else 2.0
    net_cash_trend_up = liquidity > 1.2
    net_cash_trend_text = "Dòng tiền khỏe mạnh" if net_cash_trend_up else "Cần chú ý thanh khoản"

    # Format goals including Admin goal
    from app.modules.finance.service import calculate_goal_current
    db_goals = db.query(Goal).all()
    def goal_to_dict(g):
        current_val = calculate_goal_current(db, g.id, g.current)
        return {
            "id": g.id, "label": g.label, "current": current_val,
            "target": g.target, "unit": g.unit, "lowerIsBetter": g.lowerIsBetter,
            "period": g.period
        }
    
    cat_goals = {}
    for g in db_goals:
        if g.category not in cat_goals:
            cat_goals[g.category] = []
        cat_goals[g.category].append(g)

    goals = []
    for cat in ["revenue", "profit", "cost", "admin"]:
        if cat in cat_goals and cat_goals[cat]:
            goals.append(goal_to_dict(cat_goals[cat][0]))

    return {
        "kpis": {
            "available_cash": available_cash,
            "cash_trend": cash_trend_text,
            "cash_trend_up": cash_trend_up,
            "total_ar": total_ar,
            "ar_trend": ar_trend_text,
            "ar_trend_up": ar_trend_up,
            "total_ap": total_ap,
            "ap_trend": ap_trend_text,
            "ap_trend_up": ap_trend_up,
            "net_cash_flow": net_cash_flow,
            "net_cash_trend": net_cash_trend_text,
            "net_cash_trend_up": net_cash_trend_up,
            "ar_overdue_count": len(ar_overdue)
        },
        "pl_monthly": [],
        "overdue_invoices": [
            {"client": o.client, "invoice": o.invoice, "amount": o.amount, "days": o.days}
            for o in ar_overdue
        ],
        "upcoming_payouts": [
            {
                "description": p.payee,
                "type": "outsource" if p.is_freelancer else "salary" if "lương" in p.payee.lower() else "software",
                "amount": p.gross,
                "dueDate": p.due_date,
                "daysLeft": 5
            }
            for p in pending_payouts
        ],
        "goals": goals,
        "top_projects": []
    }

@router.get("/goals")
def get_finance_goals(db: Session = Depends(get_db_session)):
    from app.modules.finance.service import calculate_goal_current
    db_goals = db.query(Goal).all()
    categories = {"revenue": [], "profit": [], "cost": [], "cash": [], "admin": []}
    for g in db_goals:
        if g.category in categories:
            current_val = calculate_goal_current(db, g.id, g.current)
            categories[g.category].append({
                "id": g.id, "label": g.label, "current": current_val,
                "target": g.target, "unit": g.unit, "lowerIsBetter": g.lowerIsBetter,
                "period": g.period
            })
    return categories

@router.put("/goals/{goal_id}")
def update_finance_goal(goal_id: str, payload: dict, db: Session = Depends(get_db_session)):
    target = payload.get("target")
    db_goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if db_goal:
        db_goal.target = target
        db.commit()
        return {"status": "ok", "goal_id": goal_id, "updated_target": target}
    return {"status": "not found"}

@router.delete("/goals/{goal_id}")
def delete_finance_goal(goal_id: str, db: Session = Depends(get_db_session)):
    db_goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if db_goal:
        db.delete(db_goal)
        db.commit()
        return {"status": "ok", "goal_id": goal_id}
    raise HTTPException(status_code=404, detail="Goal not found")
class GoalCreate(BaseModel):
    category: str
    label: str
    target: float
    unit: str
    lowerIsBetter: bool = False
    period: str = "2026-h1"

@router.post("/goals")
def create_finance_goal(payload: GoalCreate, db: Session = Depends(get_db_session)):
    g_id = payload.category[0] + "_" + uuid.uuid4().hex[:6]
    new_goal = Goal(
        id=g_id,
        category=payload.category,
        label=payload.label,
        current=0.0,
        target=payload.target,
        unit=payload.unit,
        lowerIsBetter=payload.lowerIsBetter,
        period=payload.period
    )
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    return {
        "status": "ok", 
        "goal": {
            "id": new_goal.id, 
            "category": new_goal.category,
            "label": new_goal.label, 
            "current": new_goal.current, 
            "target": new_goal.target, 
            "unit": new_goal.unit, 
            "lowerIsBetter": new_goal.lowerIsBetter,
            "period": new_goal.period
        }
    }

# ─── Client Invoices ──────────────────────────────────────────────────────────

@router.get("/invoices", response_model=list[ClientInvoiceResponse])
def list_invoices(client_slug: str | None = None, db: Session = Depends(get_db_session)):
    """List all invoices. Optionally filter by client_slug."""
    q = db.query(ClientInvoice)
    if client_slug is not None:
        q = q.filter(ClientInvoice.client_slug == client_slug)
    return q.order_by(ClientInvoice.created_at.desc()).all()

@router.post("/invoices", response_model=ClientInvoiceResponse, status_code=201)
def create_invoice(payload: ClientInvoiceCreate, db: Session = Depends(get_db_session)):
    """Admin creates an invoice for a client."""
    inv_id = "204-INV-" + uuid.uuid4().hex[:6].upper()
    inv = ClientInvoice(
        id=inv_id,
        client_slug=payload.client_slug,
        client_name=payload.client_name,
        project=payload.project,
        term=payload.term,
        amount=payload.amount,
        due_date=payload.due_date,
        status=payload.status,
        note=payload.note,
    )
    db.add(inv)
    db.commit()
    
    from app.modules.projects.models import Client
    db_client = db.query(Client).filter(Client.slug == payload.client_slug).first()
    if db_client:
        import json
        try:
            crm = json.loads(db_client.notes) if db_client.notes else {}
            crm_invoices = crm.get("invoices", [])
            status_map_rev = {
                "paid": "Paid",
                "pending": "Unpaid",
                "overdue": "Overdue"
            }
            crm_status = status_map_rev.get(payload.status, "Unpaid")
            
            crm_invoices.append({
                "id": inv_id,
                "code": inv_id,
                "description": payload.term,
                "date": payload.due_date,
                "amount": str(payload.amount),
                "status": crm_status
            })
            crm["invoices"] = crm_invoices
            db_client.notes = json.dumps(crm, ensure_ascii=False)
            db.commit()
        except Exception as e:
            print(f"Error adding invoice to client notes: {e}")
            
    db.refresh(inv)
    from app.modules.finance.service import recalculate_receivables
    recalculate_receivables(db)
    return inv

@router.put("/invoices/{inv_id}/pay", response_model=ClientInvoiceResponse)
def pay_invoice(inv_id: str, db: Session = Depends(get_db_session)):
    """Mark an invoice as paid."""
    inv = db.query(ClientInvoice).filter(ClientInvoice.id == inv_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    inv.status = "paid"
    inv.paid_at = datetime.utcnow()
    db.commit()
    
    from app.modules.projects.models import Client
    db_client = db.query(Client).filter(Client.slug == inv.client_slug).first()
    if db_client:
        import json
        try:
            if db_client.notes:
                crm = json.loads(db_client.notes)
                crm_invoices = crm.get("invoices", [])
                for ci in crm_invoices:
                    if ci.get("id") == inv_id or ci.get("code") == inv_id:
                        ci["status"] = "Paid"
                crm["invoices"] = crm_invoices
                db_client.notes = json.dumps(crm, ensure_ascii=False)
                db.commit()
        except Exception as e:
            print(f"Error updating payment in client notes: {e}")
            
    db.refresh(inv)
    from app.modules.finance.service import recalculate_receivables
    recalculate_receivables(db)
    return inv

@router.delete("/invoices/{inv_id}")
def delete_invoice(inv_id: str, db: Session = Depends(get_db_session)):
    """Admin deletes an invoice."""
    inv = db.query(ClientInvoice).filter(ClientInvoice.id == inv_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    client_slug = inv.client_slug
    db.delete(inv)
    db.commit()
    
    from app.modules.projects.models import Client
    db_client = db.query(Client).filter(Client.slug == client_slug).first()
    if db_client:
        import json
        try:
            if db_client.notes:
                crm = json.loads(db_client.notes)
                crm["invoices"] = [i for i in crm.get("invoices", []) if (i.get("id") != inv_id and i.get("code") != inv_id)]
                db_client.notes = json.dumps(crm, ensure_ascii=False)
                db.commit()
        except Exception as e:
            print(f"Error deleting invoice from client notes: {e}")
            
    from app.modules.finance.service import recalculate_receivables
    recalculate_receivables(db)
    return {"status": "ok", "deleted_id": inv_id}

@router.get("/client-summary")
def get_client_billing_summary(client_slug: str, db: Session = Depends(get_db_session)):
    """Returns billing summary stats for a specific client."""
    invoices = db.query(ClientInvoice).filter(ClientInvoice.client_slug == client_slug).all()
    total = sum(i.amount for i in invoices)
    paid = sum(i.amount for i in invoices if i.status == "paid")
    pending = sum(i.amount for i in invoices if i.status != "paid")
    overdue_count = sum(1 for i in invoices if i.status == "overdue")
    return {
        "total": total,
        "paid": paid,
        "pending": pending,
        "overdue_count": overdue_count,
        "invoice_count": len(invoices)
    }
