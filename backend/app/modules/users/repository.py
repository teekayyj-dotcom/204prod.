from app.modules.users.schemas import UserSummary


def list_users() -> list[UserSummary]:
    return [UserSummary(id=1, username="admin", role="editor")]
