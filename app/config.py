import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"
UPLOAD_DIR = FRONTEND_DIR / "static" / "uploads"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class Settings:
    """Настройки приложения. Для продакшена задаются через переменные окружения."""

    app_name: str = "Ремонтная мастерская"
    database_url: str = os.getenv(
        "DATABASE_URL", f"sqlite:///{(BASE_DIR / 'workshop.db').as_posix()}"
    )
    jwt_secret: str = os.getenv("JWT_SECRET", "dev-secret-please-change-in-production")
    jwt_algorithm: str = "HS256"
    access_token_ttl_minutes: int = int(os.getenv("ACCESS_TOKEN_TTL_MINUTES", "720"))
    max_upload_bytes: int = 5 * 1024 * 1024


settings = Settings()
