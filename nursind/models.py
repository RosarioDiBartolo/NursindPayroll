from datetime import UTC, datetime
from uuid import uuid4

from .extensions import db


def utcnow():
    return datetime.now(UTC).replace(tzinfo=None)


class CrawlJob(db.Model):
    __tablename__ = "crawl_jobs"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid4()))
    session_id = db.Column(db.String(36), nullable=False, index=True)
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

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
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
            "download_url": (
                f"/api/crawl-jobs/{self.id}/download"
                if self.status == "completed"
                else None
            ),
        }
