from app.modules.auth.schemas import LoginRequest, LoginResponse


def login(payload: LoginRequest) -> LoginResponse:
    return LoginResponse(access_token=f"demo-token-for-{payload.username}")
