from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.modules.auth.dependencies import require_admin_token
from app.modules.users.service import get_users

router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
def list_users_route(db: Session = Depends(get_db_session), _: str = Depends(require_admin_token)):
    return get_users(db)
