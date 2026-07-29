from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    app_name: str = os.getenv("APP_NAME", "204PROD API")
    api_v1_prefix: str = os.getenv("API_V1_PREFIX", "/api/v1")
    frontend_origin: str = os.getenv("FRONTEND_ORIGIN", "https://204prod.vn")
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

    # Cloudflare R2
    r2_endpoint_url: str = os.getenv("R2_ENDPOINT_URL", "")
    r2_access_key_id: str = os.getenv("R2_ACCESS_KEY_ID", "")
    r2_secret_access_key: str = os.getenv("R2_SECRET_ACCESS_KEY", "")
    r2_bucket_name: str = os.getenv("R2_BUCKET_NAME", "204prod-assets")
    r2_public_url: str = os.getenv("R2_PUBLIC_URL", "")

    # JWT
    jwt_secret: str = os.getenv("JWT_SECRET", "204prod-jwt-secret-key-change-in-production")
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = int(os.getenv("JWT_EXPIRE_MINUTES", "43200"))  # 30 days default

    # Google OAuth
    google_client_id: str = os.getenv("GOOGLE_CLIENT_ID", "")

    # Bunny Stream
    bunny_stream_library_id: str = os.getenv("BUNNY_STREAM_LIBRARY_ID", "")
    bunny_stream_api_key: str = os.getenv("BUNNY_STREAM_API_KEY", "")
    bunny_stream_cdn: str = os.getenv("BUNNY_STREAM_CDN", "")


settings = Settings()
