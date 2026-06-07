from datetime import timedelta
from pathlib import Path

from flask import current_app

from . import create_app
from .credentials import CredentialStore
from .crawler import TemporaryCrawlerError, crawler_from_config
from .extensions import db
from .models import CrawlBatch, CrawlJob, CrawlJobLog, CrawlSession, utcnow


def _sanitize_error(exc: Exception) -> str:
    message = str(exc).strip()
    return message[:500] if message else exc.__class__.__name__


def _delete_job_output(job: CrawlJob) -> None:
    if job.output_path:
        Path(job.output_path).unlink(missing_ok=True)


def _job_log(job: CrawlJob, message: str, level: str = "info") -> None:
    db.session.add(
        CrawlJobLog(
            job_id=job.id,
            level=level,
            message=message[:1000],
        )
    )
    if job.batch:
        job.batch.bump()
    db.session.commit()


def delete_batch(batch: CrawlBatch) -> str:
    session_id = batch.session_id
    for job in batch.jobs:
        _delete_job_output(job)
    db.session.delete(batch)
    db.session.commit()
    return session_id


def delete_session(session: CrawlSession) -> None:
    session_id = session.id
    for batch in session.batches:
        for job in batch.jobs:
            _delete_job_output(job)
    db.session.delete(session)
    db.session.commit()
    CredentialStore().delete(session_id)


def _finish_requested_transition(batch: CrawlBatch) -> bool:
    if batch.status == "cancel_requested":
        for job in batch.jobs:
            if job.status in {"pending", "queued"}:
                job.status = "cancelled"
        batch.status = "cancelled"
        batch.error = None
        batch.bump()
        db.session.commit()
        return True

    if batch.status == "delete_requested":
        session = batch.session
        session_delete_requested = session.status == "delete_requested"
        session_id = delete_batch(batch)
        if session_delete_requested:
            remaining = db.session.get(CrawlSession, session_id)
            if remaining is not None and not remaining.batches:
                delete_session(remaining)
        return True

    return False


def run_crawl_batch(batch_id: str) -> None:
    app = create_app()
    with app.app_context():
        execute_crawl_batch(batch_id)


def execute_crawl_batch(batch_id: str) -> None:
    while True:
        db.session.expire_all()
        batch = db.session.get(CrawlBatch, batch_id)
        if batch is None:
            return
        if _finish_requested_transition(batch):
            return
        if batch.status in {"blocked", "cancelled", "completed"}:
            return

        job = next(
            (
                item
                for item in batch.jobs
                if item.status not in {"completed", "cancelled", "expired"}
            ),
            None,
        )
        if job is None:
            batch.status = "completed"
            batch.error = None
            batch.bump()
            db.session.commit()
            return

        credentials = CredentialStore().get(batch.session_id)
        if credentials is None:
            job.status = "failed"
            job.error = "Stored credentials are unavailable"
            batch.status = "blocked"
            batch.error = job.error
            _job_log(job, job.error, "error")
            batch.bump()
            db.session.commit()
            return

        batch.status = "running"
        batch.error = None
        job.status = "running"
        job.attempts += 1
        job.started_at = utcnow()
        job.error = None
        batch.bump()
        db.session.commit()
        _job_log(
            job,
            f"Starting job for payroll period {job.year}-{job.month:02d} "
            f"(attempt {job.attempts})",
        )

        try:
            crawler = crawler_from_config(
                current_app.config,
                log_callback=lambda level, message: _job_log(
                    job, message, level
                ),
            )
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
            _job_log(job, "Saved PDF to temporary payroll storage")

            now = utcnow()
            job.status = "completed"
            job.output_path = str(final_path)
            job.completed_at = now
            job.expires_at = now + timedelta(
                seconds=current_app.config["FILE_RETENTION_SECONDS"]
            )
            batch.bump()
            db.session.commit()
            _job_log(job, "Job completed successfully")
        except TemporaryCrawlerError as exc:
            db.session.refresh(batch)
            job.status = "queued"
            job.error = _sanitize_error(exc)
            batch.error = job.error
            if batch.status not in {"cancel_requested", "delete_requested"}:
                batch.status = "queued"
            batch.bump()
            db.session.commit()
            _job_log(job, f"Temporary failure: {job.error}", "warning")
            if batch.status in {"cancel_requested", "delete_requested"}:
                continue
            raise
        except Exception as exc:
            db.session.refresh(batch)
            job.status = "failed"
            job.error = _sanitize_error(exc)
            batch.error = job.error
            if batch.status not in {"cancel_requested", "delete_requested"}:
                batch.status = "blocked"
            batch.bump()
            db.session.commit()
            _job_log(job, f"Job failed: {job.error}", "error")
            if batch.status in {"cancel_requested", "delete_requested"}:
                continue
            return


def handle_batch_failure(rq_job, _connection, _type, value, _traceback):
    app = create_app()
    with app.app_context():
        batch_id = rq_job.args[0] if rq_job.args else None
        batch = db.session.get(CrawlBatch, batch_id)
        if batch is None or batch.status in {
            "completed",
            "cancelled",
            "delete_requested",
        }:
            return
        current = next(
            (
                job
                for job in batch.jobs
                if job.status in {"queued", "running", "failed"}
            ),
            None,
        )
        message = _sanitize_error(value)
        if current is not None:
            current.status = "failed"
            current.error = message
        batch.status = "blocked"
        batch.error = message
        batch.bump()
        db.session.commit()


# Kept as a narrow compatibility entry point for old queued jobs.
def run_crawl_job(job_id: str) -> None:
    app = create_app()
    with app.app_context():
        job = db.session.get(CrawlJob, job_id)
        if job is None or not job.batch_id:
            return
        execute_crawl_batch(job.batch_id)


def handle_job_failure(rq_job, connection, type_, value, traceback):
    handle_batch_failure(rq_job, connection, type_, value, traceback)
