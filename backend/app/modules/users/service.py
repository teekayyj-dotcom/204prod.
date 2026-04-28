from app.modules.users.repository import list_users
from app.modules.users.schemas import UserSummary


def get_users() -> list[UserSummary]:
    return list_users()
