from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db_session
from app.modules.crew.service import get_crew_members


router = APIRouter(prefix="/crew", tags=["crew"])

@router.get("/")
def list_crew_route(db: Session = Depends(get_db_session)):
    return get_crew_members(db)
