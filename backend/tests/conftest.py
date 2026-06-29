from cryptography.fernet import Fernet
import pytest

from nursind import create_app


class TestConfig:
    TESTING = True
    PORT = 8080
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {}
    REDIS_URL = "redis://test/0"
    CREDENTIAL_ENCRYPTION_KEY = Fernet.generate_key().decode("ascii")
    OUTPUT_DIR = None
    FILE_RETENTION_SECONDS = 86400
    JOB_RETENTION_DAYS = 30
    BATCH_JOB_TIMEOUT_SECONDS = 43200
    CRAWL_JOB_IMMEDIATE_ATTEMPTS = 5
    CRAWL_JOB_RETRY_DELAY_SECONDS = 3600
    CRAWLER_BASE_URL = "https://portal.test"
    CRAWLER_EMAIL = "test@example.invalid"
    CRAWLER_TLS_VERIFY = False
    CRAWLER_TIMEOUT_SECONDS = 1
    CRAWLER_POLL_ATTEMPTS = 1
    CRAWLER_POLL_INTERVAL_SECONDS = 0
    CORS_ORIGINS = ["http://localhost:2000"]


@pytest.fixture()
def app(tmp_path):
    TestConfig.OUTPUT_DIR = tmp_path
    return create_app(TestConfig)


@pytest.fixture()
def client(app):
    return app.test_client()
