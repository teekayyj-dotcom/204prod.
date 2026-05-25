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


settings = Settings()
