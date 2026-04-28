from fastapi import APIRouter, Depends

from app.modules.auth.dependencies import require_admin_token
from app.modules.users.service import get_users

router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
def list_users_route(_: str = Depends(require_admin_token)):
    return get_users()
