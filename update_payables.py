import re

with open("backend/app/modules/finance/api.py", "r") as f:
    content = f.read()

put_route = """@router.put("/payables/{pay_id}", response_model=PayoutResponse)
def update_payable(pay_id: str, payload: PayoutCreate, db: Session = Depends(get_db_session)):
    from app.modules.finance.models import Payout
    payout = db.query(Payout).filter(Payout.id == pay_id).first()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout not found")
    
    payout.payee = payload.payee
    payout.avatar = payload.avatar
    payout.category = payload.category
    payout.project = payload.project
    payout.gross = payload.gross
    payout.tax = payload.tax
    payout.net = payload.net
    payout.due_date = payload.due_date
    payout.status = payload.status
    payout.client_invoice_paid = payload.client_invoice_paid
    payout.doc_complete = payload.doc_complete
    payout.bank_name = payload.bank_name
    payout.bank_account = payload.bank_account
    payout.tncn_consent = payload.tncn_consent
    payout.is_freelancer = payload.is_freelancer
    payout.expense_group = payload.expense_group
    payout.note = payload.note
    
    db.commit()
    db.refresh(payout)
    return payout

@router.delete("/payables/{pay_id}")
def delete_payable(pay_id: str, db: Session = Depends(get_db_session)):
    from app.modules.finance.models import Payout
    payout = db.query(Payout).filter(Payout.id == pay_id).first()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout not found")
    db.delete(payout)
    db.commit()
    return {"status": "ok", "deleted_id": pay_id}
"""

if "@router.delete(\"/payables/{pay_id}\")" not in content:
    content = content.replace(
        "@router.put(\"/payables/{pay_id}/pay\", response_model=PayoutResponse)",
        put_route + "\n@router.put(\"/payables/{pay_id}/pay\", response_model=PayoutResponse)"
    )
    with open("backend/app/modules/finance/api.py", "w") as f:
        f.write(content)
    print("Backend routes updated.")
else:
    print("Already updated.")
