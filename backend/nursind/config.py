import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


INSTANCE_DIR = Path(os.getenv("INSTANCE_DIR", BASE_DIR / "instance"))


class Config:
    PORT = int(os.getenv("PORT", "8080"))
    DEBUG = env_bool("FLASK_DEBUG", False)
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{(INSTANCE_DIR / 'app.db').as_posix()}",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"connect_args": {"timeout": 30}}
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CREDENTIAL_ENCRYPTION_KEY = os.getenv("CREDENTIAL_ENCRYPTION_KEY", "")
    CREDENTIAL_TTL_SECONDS = int(os.getenv("CREDENTIAL_TTL_SECONDS", "43200"))
    OUTPUT_DIR = Path(os.getenv("OUTPUT_DIR", INSTANCE_DIR / "crawl_outputs"))
    FILE_RETENTION_SECONDS = int(os.getenv("FILE_RETENTION_SECONDS", "86400"))
    JOB_RETENTION_DAYS = int(os.getenv("JOB_RETENTION_DAYS", "30"))
    CRAWLER_BASE_URL = os.getenv(
        "CRAWLER_BASE_URL",
        "https://sportellodipendenti.policlinicorodolicosanmarco.it/gp4web",
    )
    CRAWLER_EMAIL = os.getenv("CRAWLER_EMAIL", "")
    CRAWLER_TLS_VERIFY = env_bool("CRAWLER_TLS_VERIFY", False)
    CRAWLER_TIMEOUT_SECONDS = int(os.getenv("CRAWLER_TIMEOUT_SECONDS", "30"))
    CRAWLER_POLL_ATTEMPTS = int(os.getenv("CRAWLER_POLL_ATTEMPTS", "10"))
    CRAWLER_POLL_INTERVAL_SECONDS = int(
        os.getenv("CRAWLER_POLL_INTERVAL_SECONDS", "10")
    )
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:2000").split(",")
