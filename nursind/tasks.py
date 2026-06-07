from datetime import timedelta
from pathlib import Path

from flask import current_app

from . import create_app
from .credentials import CredentialStore
from .crawler import TemporaryCrawlerError, crawler_from_config
from .extensions import db
from .models import CrawlJob, utcnow


def _sanitize_error(exc: Exception) -> str:
    message = str(exc).strip()
    return message[:500] if message else exc.__class__.__name__


def run_crawl_job(job_id: str) -> None:
    app = create_app()
    with app.app_context():
        execute_crawl_job(job_id)


def execute_crawl_job(job_id: str) -> None:
    job = db.session.get(CrawlJob, job_id)
    if job is None or job.status == "completed":
        return

    job.status = "running"
    job.attempts += 1
    job.started_at = utcnow()
    job.error = None
    db.session.commit()

    try:
        credentials = CredentialStore().get(job.session_id)
        if credentials is None:
            raise RuntimeError("Crawl session expired")

        crawler = crawler_from_config(current_app.config)
        session = crawler.login(
            credentials["username"],
            credentials["password"],
        )
        try:
            content = crawler.download(
                session,
                job.year,
                job.month,
                credentials["username"],
            )
        finally:
            session.close()

        output_dir = Path(current_app.config["OUTPUT_DIR"])
        output_dir.mkdir(parents=True, exist_ok=True)
        final_path = output_dir / f"{job.id}.pdf"
        temporary_path = output_dir / f"{job.id}.tmp"
        temporary_path.write_bytes(content)
        temporary_path.replace(final_path)

        now = utcnow()
        job.status = "completed"
        job.output_path = str(final_path)
        job.completed_at = now
        job.expires_at = now + timedelta(
            seconds=current_app.config["FILE_RETENTION_SECONDS"]
        )
        db.session.commit()
    except TemporaryCrawlerError as exc:
        job.status = "queued"
        job.error = _sanitize_error(exc)
        db.session.commit()
        raise
    except Exception as exc:
        job.status = "failed"
        job.error = _sanitize_error(exc)
        db.session.commit()


def handle_job_failure(_job, _connection, _type, value, _traceback):
    app = create_app()
    with app.app_context():
        job = db.session.get(CrawlJob, _job.id)
        if job is not None and job.status != "completed":
            job.status = "failed"
            job.error = _sanitize_error(value)
            db.session.commit()
