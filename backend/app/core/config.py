from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    app_name: str = os.getenv("APP_NAME", "204PROD API")
    api_v1_prefix: str = os.getenv("API_V1_PREFIX", "/api/v1")
    frontend_origin: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    database_url: str = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://"
        f"{os.getenv('MYSQL_USER', '204admin')}:"
        f"{os.getenv('MYSQL_PASSWORD', '204admin-password')}@"
        f"{os.getenv('MYSQL_HOST', 'mysql')}:"
        f"{os.getenv('MYSQL_PORT', '3306')}/"
        f"{os.getenv('MYSQL_DATABASE', '204prod_database')}",
    )
    backend_url: str = os.getenv("BACKEND_URL", "http://localhost:8000")
    storage_provider: str = os.getenv("STORAGE_PROVIDER", "local")

    # JWT
    jwt_secret: str = os.getenv("JWT_SECRET", "204prod-jwt-secret-key-change-in-production")
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))  # 24h default

    # Google OAuth
    google_client_id: str = os.getenv("GOOGLE_CLIENT_ID", "")


settings = Settings()
