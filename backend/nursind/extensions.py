import sqlite3

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import event, inspect, text
from sqlalchemy.engine import Engine


db = SQLAlchemy()
_sqlite_initialized = False


def init_sqlite() -> None:
    global _sqlite_initialized
    if _sqlite_initialized:
        return

    @event.listens_for(Engine, "connect")
    def configure_sqlite(connection, _record):
        if isinstance(connection, sqlite3.Connection):
            cursor = connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA busy_timeout=30000")
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

    _sqlite_initialized = True


def migrate_legacy_schema() -> None:
    inspector = inspect(db.engine)
    if "crawl_jobs" not in inspector.get_table_names():
        return
    columns = {column["name"] for column in inspector.get_columns("crawl_jobs")}
    required = {"id", "session_id", "year", "month", "status"}
    if required.issubset(columns):
        return

    tables = set(inspector.get_table_names())
    legacy_name = "crawl_jobs_legacy"
    suffix = 1
    while legacy_name in tables:
        legacy_name = f"crawl_jobs_legacy_{suffix}"
        suffix += 1
    with db.engine.begin() as connection:
        connection.execute(
            text(f'ALTER TABLE crawl_jobs RENAME TO "{legacy_name}"')
        )


def migrate_current_schema() -> None:
    inspector = inspect(db.engine)
    if "crawl_jobs" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("crawl_jobs")}
    migrations = {
        "batch_id": "ALTER TABLE crawl_jobs ADD COLUMN batch_id VARCHAR(36)",
        "sequence": (
            "ALTER TABLE crawl_jobs ADD COLUMN sequence INTEGER NOT NULL DEFAULT 0"
        ),
    }
    with db.engine.begin() as connection:
        for column, statement in migrations.items():
            if column not in columns:
                connection.execute(text(statement))
