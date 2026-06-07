import time
from datetime import timedelta
from pathlib import Path

from . import create_app
from .extensions import db
from .models import CrawlBatch, CrawlJob, utcnow


def cleanup_once() -> None:
    app = create_app()
    with app.app_context():
        now = utcnow()
        expired = CrawlJob.query.filter(
            CrawlJob.status == "completed",
            CrawlJob.expires_at <= now,
        ).all()
        for job in expired:
            if job.output_path:
                Path(job.output_path).unlink(missing_ok=True)
            job.status = "expired"
            if job.batch:
                job.batch.bump()

        cutoff = now - timedelta(days=app.config["JOB_RETENTION_DAYS"])
        old_batches = CrawlBatch.query.filter(
            CrawlBatch.created_at < cutoff,
            CrawlBatch.status.in_(["completed", "cancelled"]),
        ).all()
        for batch in old_batches:
            for job in batch.jobs:
                if job.output_path:
                    Path(job.output_path).unlink(missing_ok=True)
            db.session.delete(batch)

        CrawlJob.query.filter(
            CrawlJob.batch_id.is_(None),
            CrawlJob.created_at < cutoff,
        ).delete(
            synchronize_session=False
        )
        db.session.commit()


def main() -> None:
    while True:
        cleanup_once()
        time.sleep(3600)


if __name__ == "__main__":
    main()
