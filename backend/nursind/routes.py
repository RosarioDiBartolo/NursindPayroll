import json
import time
from pathlib import Path

from flask import (
    Blueprint,
    Response,
    current_app,
    jsonify,
    request,
    send_file,
    stream_with_context,
)
from redis.exceptions import RedisError
from rq import Queue, Retry
from sqlalchemy import text

from .credentials import CredentialStore, CredentialStoreError
from .crawler import (
    AuthenticationError,
    CrawlerError,
    TemporaryCrawlerError,
    crawler_from_config,
)
from .extensions import db
from .models import CrawlBatch, CrawlJob, CrawlSession, utcnow
from .redis_client import get_redis
from .tasks import delete_batch, delete_session, handle_batch_failure


api = Blueprint("api", __name__, url_prefix="/api")


def error(message: str, status: int):
    return jsonify({"error": message}), status


def month_index(year: int, month: int) -> int:
    return year * 12 + month


def parse_month_range(payload: dict):
    try:
        start_year = int(payload.get("start_year"))
        start_month = int(payload.get("start_month"))
        end_year = int(payload.get("end_year"))
        end_month = int(payload.get("end_month"))
    except (TypeError, ValueError):
        raise ValueError("start and end months are required")

    start = month_index(start_year, start_month)
    end = month_index(end_year, end_month)
    if (
        start_month not in range(1, 13)
        or end_month not in range(1, 13)
        or start > end
    ):
        raise ValueError("Invalid payroll range")
    return start_year, start_month, end_year, end_month


def iter_periods(start_year: int, start_month: int, end_year: int, end_month: int):
    year = start_year
    month = start_month
    while month_index(year, month) <= month_index(end_year, end_month):
        yield year, month
        month += 1
        if month == 13:
            year += 1
            month = 1


def enqueue_batch(batch_id: str) -> None:
    queue = Queue("crawl", connection=get_redis())
    queue.enqueue(
        "nursind.tasks.run_crawl_batch",
        batch_id,
        retry=Retry(max=2, interval=[30, 120]),
        on_failure=handle_batch_failure,
        job_timeout=current_app.config["BATCH_JOB_TIMEOUT_SECONDS"],
    )


def session_snapshot(session: CrawlSession) -> dict:
    batches = CrawlBatch.query.filter_by(session_id=session.id).order_by(
        CrawlBatch.created_at
    )
    return {
        "session": session.to_summary(),
        "batches": [batch.to_dict(include_jobs=True) for batch in batches],
    }


def maybe_finish_session_delete(session: CrawlSession) -> None:
    if session.status != "delete_requested":
        return
    if any(batch.status in {"running", "delete_requested"} for batch in session.batches):
        return
    delete_session(session)


@api.post("/crawl-sessions")
def create_crawl_session():
    payload = request.get_json(silent=True) or {}
    username = str(payload.get("username", "")).strip()
    password = str(payload.get("password", ""))
    if not username or not password:
        return error("username and password are required", 400)

    crawler = crawler_from_config(current_app.config)
    try:
        portal_session = crawler.login(username, password)
        portal_session.close()
        session = CrawlSession.query.filter_by(
            username=username,
            status="active",
        ).first()
        created = session is None
        if created:
            session = CrawlSession(username=username)
            db.session.add(session)
            db.session.flush()
        else:
            session.updated_at = utcnow()
        CredentialStore().create(session.id, username, password)
        db.session.commit()
    except AuthenticationError as exc:
        db.session.rollback()
        return error(str(exc), 401)
    except TemporaryCrawlerError as exc:
        db.session.rollback()
        return error(str(exc), 503)
    except (CrawlerError, CredentialStoreError, RedisError) as exc:
        db.session.rollback()
        return error(str(exc), 500)
    return jsonify(session_snapshot(session)), 201 if created else 200


@api.get("/crawl-sessions/<session_id>")
def get_crawl_session(session_id: str):
    session = db.session.get(CrawlSession, session_id)
    if session is None:
        return error("Crawl session not found", 404)
    return jsonify(session_snapshot(session))


@api.delete("/crawl-sessions/<session_id>")
def delete_crawl_session(session_id: str):
    session = db.session.get(CrawlSession, session_id)
    if session is None:
        return "", 204

    running = False
    for batch in list(session.batches):
        if batch.status == "running":
            batch.status = "delete_requested"
            batch.bump()
            running = True
        else:
            delete_batch(batch)
    session = db.session.get(CrawlSession, session_id)
    if session is None:
        CredentialStore().delete(session_id)
        return "", 202 if running else 204
    if running:
        session.status = "delete_requested"
        db.session.commit()
        return jsonify(session_snapshot(session)), 202
    delete_session(session)
    return "", 204


@api.post("/crawl-sessions/<session_id>/batches")
def create_crawl_batch(session_id: str):
    session = db.session.get(CrawlSession, session_id)
    if session is None or session.status != "active":
        return error("Crawl session not found", 404)
    if CredentialStore().get(session_id) is None:
        return error("Stored credentials are unavailable", 409)

    payload = request.get_json(silent=True) or {}
    try:
        start_year, start_month, end_year, end_month = parse_month_range(payload)
    except ValueError as exc:
        return error(str(exc), 400)

    batch = CrawlBatch(
        session_id=session_id,
        start_year=start_year,
        start_month=start_month,
        end_year=end_year,
        end_month=end_month,
    )
    db.session.add(batch)
    for index, (year, month) in enumerate(
        iter_periods(start_year, start_month, end_year, end_month)
    ):
        db.session.add(
            CrawlJob(
                session_id=session_id,
                batch=batch,
                sequence=index,
                username=session.username,
                year=year,
                month=month,
                status="queued" if index == 0 else "pending",
            )
        )
    db.session.commit()

    try:
        enqueue_batch(batch.id)
    except Exception:
        batch.status = "blocked"
        batch.error = "Job queue is unavailable"
        batch.bump()
        db.session.commit()
        return error("Job queue is unavailable", 503)

    return jsonify(batch.to_dict(include_jobs=True)), 202


@api.get("/crawl-batches/<batch_id>")
def get_crawl_batch(batch_id: str):
    batch = db.session.get(CrawlBatch, batch_id)
    if batch is None:
        return error("Crawl batch not found", 404)
    return jsonify(batch.to_dict(include_jobs=True))


@api.post("/crawl-batches/<batch_id>/retry")
def retry_crawl_batch(batch_id: str):
    batch = db.session.get(CrawlBatch, batch_id)
    if batch is None:
        return error("Crawl batch not found", 404)
    if batch.status != "blocked":
        return error("Only blocked batches can be retried", 409)
    if CredentialStore().get(batch.session_id) is None:
        return error("Stored credentials are unavailable", 409)

    failed = next((job for job in batch.jobs if job.status == "failed"), None)
    if failed is None:
        return error("No failed job is available to retry", 409)
    failed.status = "queued"
    failed.error = None
    batch.status = "queued"
    batch.error = None
    batch.bump()
    db.session.commit()
    try:
        enqueue_batch(batch.id)
    except Exception:
        batch.status = "blocked"
        batch.error = "Job queue is unavailable"
        batch.bump()
        db.session.commit()
        return error("Job queue is unavailable", 503)
    return jsonify(batch.to_dict(include_jobs=True))


@api.post("/crawl-batches/<batch_id>/cancel")
def cancel_crawl_batch(batch_id: str):
    batch = db.session.get(CrawlBatch, batch_id)
    if batch is None:
        return error("Crawl batch not found", 404)
    if batch.status in {"completed", "cancelled"}:
        return jsonify(batch.to_dict(include_jobs=True))
    if batch.status == "running":
        batch.status = "cancel_requested"
        batch.bump()
    else:
        for job in batch.jobs:
            if job.status in {"pending", "queued"}:
                job.status = "cancelled"
        batch.status = "cancelled"
        batch.error = None
        batch.bump()
    db.session.commit()
    return jsonify(batch.to_dict(include_jobs=True))


@api.delete("/crawl-batches/<batch_id>")
def delete_crawl_batch(batch_id: str):
    batch = db.session.get(CrawlBatch, batch_id)
    if batch is None:
        return "", 204
    if batch.status == "running":
        batch.status = "delete_requested"
        batch.bump()
        db.session.commit()
        return jsonify(batch.to_dict(include_jobs=True)), 202
    session_id = delete_batch(batch)
    session = db.session.get(CrawlSession, session_id)
    if session is not None:
        maybe_finish_session_delete(session)
    return "", 204


@api.get("/crawl-sessions/<session_id>/events")
def crawl_session_events(session_id: str):
    def stream():
        last_payload = None
        revision = 0
        while True:
            session = db.session.get(CrawlSession, session_id)
            if session is None:
                yield "event: deleted\ndata: {}\n\n"
                return
            payload = json.dumps(session_snapshot(session), sort_keys=True)
            if payload != last_payload:
                revision += 1
                last_payload = payload
                yield f"id: {revision}\nevent: snapshot\ndata: {payload}\n\n"
            else:
                yield "event: heartbeat\ndata: {}\n\n"
            time.sleep(2)

    return Response(
        stream_with_context(stream()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@api.get("/crawl-jobs/<job_id>/download")
def download_crawl_job(job_id: str):
    job = db.session.get(CrawlJob, job_id)
    if job is None:
        return error("Crawl job not found", 404)
    if job.status != "completed":
        return error("Crawl job is not ready", 409)
    if job.expires_at and job.expires_at <= utcnow():
        job.status = "expired"
        if job.batch:
            job.batch.bump()
        db.session.commit()
        return error("Crawl output has expired", 410)
    path = Path(job.output_path or "")
    if not path.is_file():
        job.status = "expired"
        if job.batch:
            job.batch.bump()
        db.session.commit()
        return error("Crawl output is no longer available", 410)
    return send_file(
        path,
        as_attachment=True,
        download_name=f"{job.username}-{job.year}-{job.month:02d}.pdf",
        mimetype="application/pdf",
    )


@api.get("/health")
def health():
    database_ok = redis_ok = True
    try:
        db.session.execute(text("SELECT 1"))
    except Exception:
        database_ok = False
    try:
        get_redis().ping()
    except RedisError:
        redis_ok = False
    status = 200 if database_ok and redis_ok else 503
    return jsonify(
        {
            "status": "ok" if status == 200 else "degraded",
            "database": database_ok,
            "redis": redis_ok,
        }
    ), status
