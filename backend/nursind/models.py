from datetime import UTC, datetime
from uuid import uuid4

from .extensions import db


def utcnow():
    return datetime.now(UTC).replace(tzinfo=None)


class CrawlSession(db.Model):
    __tablename__ = "crawl_sessions"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid4()))
    username = db.Column(db.String(128), nullable=False)
    status = db.Column(db.String(24), nullable=False, default="active", index=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=utcnow,
        onupdate=utcnow,
    )

    batches = db.relationship(
        "CrawlBatch",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="CrawlBatch.created_at",
    )

    def to_summary(self):
        return {
            "id": self.id,
            "username": self.username,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class CrawlBatch(db.Model):
    __tablename__ = "crawl_batches"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid4()))
    session_id = db.Column(
        db.String(36),
        db.ForeignKey("crawl_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status = db.Column(db.String(24), nullable=False, default="queued", index=True)
    start_year = db.Column(db.Integer, nullable=False)
    start_month = db.Column(db.Integer, nullable=False)
    end_year = db.Column(db.Integer, nullable=False)
    end_month = db.Column(db.Integer, nullable=False)
    error = db.Column(db.Text)
    revision = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=utcnow,
        onupdate=utcnow,
    )

    session = db.relationship("CrawlSession", back_populates="batches")
    jobs = db.relationship(
        "CrawlJob",
        back_populates="batch",
        cascade="all, delete-orphan",
        order_by="CrawlJob.sequence",
    )

    def bump(self):
        self.revision += 1
        self.updated_at = utcnow()

    def to_dict(self, include_jobs=True):
        jobs = list(self.jobs)
        counts = {
            "total": len(jobs),
            "completed": sum(1 for job in jobs if job.status == "completed"),
            "failed": sum(1 for job in jobs if job.status == "failed"),
            "pending": sum(
                1
                for job in jobs
                if job.status in {"pending", "queued", "running", "retry_wait"}
            ),
        }
        payload = {
            "id": self.id,
            "session_id": self.session_id,
            "status": self.status,
            "start_year": self.start_year,
            "start_month": self.start_month,
            "end_year": self.end_year,
            "end_month": self.end_month,
            "error": self.error,
            "revision": self.revision,
            "counts": counts,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_jobs:
            payload["jobs"] = [job.to_dict() for job in jobs]
        return payload


class CrawlJob(db.Model):
    __tablename__ = "crawl_jobs"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid4()))
    session_id = db.Column(db.String(36), nullable=False, index=True)
    batch_id = db.Column(
        db.String(36),
        db.ForeignKey("crawl_batches.id", ondelete="CASCADE"),
        index=True,
    )
    sequence = db.Column(db.Integer, nullable=False, default=0)
    username = db.Column(db.String(128), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    month = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(16), nullable=False, default="queued", index=True)
    attempts = db.Column(db.Integer, nullable=False, default=0)
    error = db.Column(db.Text)
    output_path = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)
    started_at = db.Column(db.DateTime(timezone=True))
    completed_at = db.Column(db.DateTime(timezone=True))
    expires_at = db.Column(db.DateTime(timezone=True))
    next_retry_at = db.Column(db.DateTime(timezone=True))

    batch = db.relationship("CrawlBatch", back_populates="jobs")
    logs = db.relationship(
        "CrawlJobLog",
        back_populates="job",
        cascade="all, delete-orphan",
        order_by="CrawlJobLog.created_at",
    )

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "batch_id": self.batch_id,
            "sequence": self.sequence,
            "username": self.username,
            "year": self.year,
            "month": self.month,
            "status": self.status,
            "attempts": self.attempts,
            "error": self.error,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": (
                self.completed_at.isoformat() if self.completed_at else None
            ),
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "next_retry_at": (
                self.next_retry_at.isoformat() if self.next_retry_at else None
            ),
            "download_url": (
                f"/api/crawl-jobs/{self.id}/download"
                if self.status == "completed"
                else None
            ),
            "logs": [entry.to_dict() for entry in self.logs[-200:]],
        }


class CrawlJobLog(db.Model):
    __tablename__ = "crawl_job_logs"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    job_id = db.Column(
        db.String(36),
        db.ForeignKey("crawl_jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    level = db.Column(db.String(16), nullable=False, default="info")
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)

    job = db.relationship("CrawlJob", back_populates="logs")

    def to_dict(self):
        return {
            "id": self.id,
            "level": self.level,
            "message": self.message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
