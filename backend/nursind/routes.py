from datetime import date
from pathlib import Path

from flask import Blueprint, current_app, jsonify, request, send_file
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
from .models import CrawlJob, utcnow
from .redis_client import get_redis
from .tasks import handle_job_failure


api = Blueprint("api", __name__, url_prefix="/api")


def error(message: str, status: int):
    return jsonify({"error": message}), status


@api.post("/crawl-sessions")
def create_crawl_session():
    payload = request.get_json(silent=True) or {}
    username = str(payload.get("username", "")).strip()
    password = str(payload.get("password", ""))
    if not username or not password:
        return error("username and password are required", 400)

    crawler = crawler_from_config(current_app.config)
    try:
        session = crawler.login(username, password)
        session.close()
        session_id = CredentialStore().create(username, password)
    except AuthenticationError as exc:
        return error(str(exc), 401)
    except TemporaryCrawlerError as exc:
        return error(str(exc), 503)
    except (CrawlerError, CredentialStoreError, RedisError) as exc:
        return error(str(exc), 500)
    return jsonify(
        {
            "id": session_id,
            "expires_in": current_app.config["CREDENTIAL_TTL_SECONDS"],
        }
    ), 201


@api.delete("/crawl-sessions/<session_id>")
def delete_crawl_session(session_id: str):
    try:
        deleted = CredentialStore().delete(session_id)
    except (CredentialStoreError, RedisError) as exc:
        return error(str(exc), 500)
    return ("", 204) if deleted else error("Crawl session not found", 404)


@api.post("/crawl-jobs")
def create_crawl_job():
    payload = request.get_json(silent=True) or {}
    session_id = str(payload.get("session_id", "")).strip()
    try:
        year = int(payload.get("year"))
        month = int(payload.get("month"))
    except (TypeError, ValueError):
        return error("year and month must be integers", 400)

    try:
        credentials = CredentialStore().get(session_id)
    except (CredentialStoreError, RedisError) as exc:
        return error(str(exc), 500)
    if credentials is None:
        return error("Crawl session not found or expired", 404)

    today = date.today()
    if year < 2019 or month not in range(1, 13) or (year, month) > (
        today.year,
        today.month,
    ):
        return error("Invalid payroll period", 400)

    job = CrawlJob(
        session_id=session_id,
        username=credentials["username"],
        year=year,
        month=month,
    )
    db.session.add(job)
    db.session.commit()

    try:
        queue = Queue("crawl", connection=get_redis())
        queue.enqueue(
            "nursind.tasks.run_crawl_job",
            job.id,
            job_id=job.id,
            retry=Retry(max=2, interval=[30, 120]),
            on_failure=handle_job_failure,
            job_timeout=300,
        )
    except Exception:
        job.status = "failed"
        job.error = "Job queue is unavailable"
        db.session.commit()
        return error("Job queue is unavailable", 503)

    return jsonify(job.to_dict()), 202


@api.get("/crawl-jobs/<job_id>")
def get_crawl_job(job_id: str):
    job = db.session.get(CrawlJob, job_id)
    if job is None:
        return error("Crawl job not found", 404)
    if job.status == "completed" and job.expires_at and job.expires_at <= utcnow():
        job.status = "expired"
        db.session.commit()
    return jsonify(job.to_dict())


@api.get("/crawl-jobs/<job_id>/download")
def download_crawl_job(job_id: str):
    job = db.session.get(CrawlJob, job_id)
    if job is None:
        return error("Crawl job not found", 404)
    if job.status != "completed":
        return error("Crawl job is not ready", 409)
    if job.expires_at and job.expires_at <= utcnow():
        job.status = "expired"
        db.session.commit()
        return error("Crawl output has expired", 410)
    path = Path(job.output_path or "")
    if not path.is_file():
        job.status = "expired"
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
