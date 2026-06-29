from datetime import timedelta

from nursind.extensions import db
from nursind.models import CrawlBatch, CrawlJob, CrawlSession, utcnow
from nursind.tasks import enqueue_crawl_batch, execute_crawl_batch


class FakeCredentialStore:
    def __init__(self, *_args, **_kwargs):
        pass

    def get(self, _session_id):
        return {"username": "user", "password": "secret"}

    def delete(self, _session_id):
        return True


class FakePortalSession:
    def close(self):
        pass


class FakeCrawler:
    calls = []

    def login(self, _username, _password):
        return FakePortalSession()

    def download(self, _session, year, month, _username):
        self.calls.append((year, month))
        return b"%PDF-1.7\ncontent"


def test_delayed_enqueue_targets_same_batch(app, monkeypatch):
    calls = []

    class FakeQueue:
        def __init__(self, name, connection):
            assert name == "crawl"
            assert connection == "redis"

        def enqueue_in(self, delay, *args, **kwargs):
            calls.append((delay, args, kwargs))

    monkeypatch.setattr("nursind.tasks.Queue", FakeQueue)
    monkeypatch.setattr("nursind.tasks.get_redis", lambda: "redis")
    with app.app_context():
        enqueue_crawl_batch("batch-123", delay_seconds=3600)

    delay, args, options = calls[0]
    assert delay == timedelta(hours=1)
    assert args == ("nursind.tasks.run_crawl_batch", "batch-123")
    assert options["job_timeout"] == 43200
    assert "on_failure" in options


def test_worker_completes_batch_in_month_order(app, monkeypatch):
    FakeCrawler.calls = []
    monkeypatch.setattr("nursind.tasks.CredentialStore", FakeCredentialStore)
    monkeypatch.setattr(
        "nursind.tasks.crawler_from_config",
        lambda _config, log_callback=None: FakeCrawler(),
    )
    with app.app_context():
        session = CrawlSession(username="user")
        batch = CrawlBatch(
            session=session,
            start_year=2019,
            start_month=1,
            end_year=2019,
            end_month=2,
        )
        db.session.add_all([session, batch])
        db.session.flush()
        jobs = [
            CrawlJob(
                session_id=session.id,
                batch=batch,
                sequence=index,
                username="user",
                year=2019,
                month=month,
                status="queued" if index == 0 else "pending",
            )
            for index, month in enumerate([1, 2])
        ]
        db.session.add_all(jobs)
        db.session.commit()
        batch_id = batch.id

        execute_crawl_batch(batch_id)

        completed = db.session.get(CrawlBatch, batch_id)
        assert completed.status == "completed"
        assert [job.status for job in completed.jobs] == ["completed", "completed"]
        assert FakeCrawler.calls == [(2019, 1), (2019, 2)]
        assert "Starting job" in completed.jobs[0].logs[0].message
        assert completed.jobs[0].logs[-1].message == "Job completed successfully"


def test_worker_retries_five_times_then_schedules_and_releases(
    app, monkeypatch
):
    class FailingCrawler(FakeCrawler):
        def download(self, _session, year, month, _username):
            self.calls.append((year, month))
            raise RuntimeError("portal rejected request")

    FailingCrawler.calls = []
    scheduled = []
    monkeypatch.setattr("nursind.tasks.CredentialStore", FakeCredentialStore)
    monkeypatch.setattr(
        "nursind.tasks.crawler_from_config",
        lambda _config, log_callback=None: FailingCrawler(),
    )
    monkeypatch.setattr(
        "nursind.tasks.enqueue_crawl_batch",
        lambda batch_id, delay_seconds=0: scheduled.append(
            (batch_id, delay_seconds)
        ),
    )
    with app.app_context():
        session = CrawlSession(username="user")
        batch = CrawlBatch(
            session=session,
            start_year=2019,
            start_month=1,
            end_year=2019,
            end_month=2,
        )
        db.session.add_all([session, batch])
        db.session.flush()
        db.session.add_all(
            [
                CrawlJob(
                    session_id=session.id,
                    batch=batch,
                    sequence=index,
                    username="user",
                    year=2019,
                    month=month,
                    status="queued" if index == 0 else "pending",
                )
                for index, month in enumerate([1, 2])
            ]
        )
        db.session.commit()

        execute_crawl_batch(batch.id)

        assert batch.status == "retry_wait"
        assert [job.status for job in batch.jobs] == ["retry_wait", "pending"]
        assert FailingCrawler.calls == [(2019, 1)] * 5
        assert batch.jobs[0].attempts == 5
        assert batch.jobs[0].next_retry_at is not None
        assert scheduled == [(batch.id, 3600)]
        assert batch.jobs[0].logs[-1].level == "warning"
        assert "portal rejected request" in batch.jobs[0].logs[-1].message


def test_hourly_retry_failure_schedules_same_batch_again(app, monkeypatch):
    class FailingCrawler(FakeCrawler):
        def download(self, _session, year, month, _username):
            self.calls.append((year, month))
            raise RuntimeError("still unavailable")

    FailingCrawler.calls = []
    scheduled = []
    monkeypatch.setattr("nursind.tasks.CredentialStore", FakeCredentialStore)
    monkeypatch.setattr(
        "nursind.tasks.crawler_from_config",
        lambda _config, log_callback=None: FailingCrawler(),
    )
    monkeypatch.setattr(
        "nursind.tasks.enqueue_crawl_batch",
        lambda batch_id, delay_seconds=0: scheduled.append(
            (batch_id, delay_seconds)
        ),
    )
    with app.app_context():
        session = CrawlSession(username="user")
        batch = CrawlBatch(
            session=session,
            start_year=2019,
            start_month=1,
            end_year=2019,
            end_month=1,
            status="retry_wait",
        )
        job = CrawlJob(
            session_id="temporary",
            batch=batch,
            username="user",
            year=2019,
            month=1,
            status="retry_wait",
            attempts=5,
            next_retry_at=utcnow() - timedelta(seconds=1),
        )
        db.session.add_all([session, batch, job])
        db.session.flush()
        job.session_id = session.id
        db.session.commit()

        execute_crawl_batch(batch.id)

        assert job.attempts == 6
        assert job.status == "retry_wait"
        assert scheduled == [(batch.id, 3600)]
        assert FailingCrawler.calls == [(2019, 1)]


def test_successful_hourly_retry_continues_same_batch(app, monkeypatch):
    FakeCrawler.calls = []
    monkeypatch.setattr("nursind.tasks.CredentialStore", FakeCredentialStore)
    monkeypatch.setattr(
        "nursind.tasks.crawler_from_config",
        lambda _config, log_callback=None: FakeCrawler(),
    )
    with app.app_context():
        session = CrawlSession(username="user")
        batch = CrawlBatch(
            session=session,
            start_year=2019,
            start_month=1,
            end_year=2019,
            end_month=2,
            status="retry_wait",
        )
        jobs = [
            CrawlJob(
                session_id="temporary",
                batch=batch,
                sequence=index,
                username="user",
                year=2019,
                month=month,
                status="retry_wait" if index == 0 else "pending",
                attempts=5 if index == 0 else 0,
                next_retry_at=(
                    utcnow() - timedelta(seconds=1) if index == 0 else None
                ),
            )
            for index, month in enumerate([1, 2])
        ]
        db.session.add_all([session, batch, *jobs])
        db.session.flush()
        for job in jobs:
            job.session_id = session.id
        db.session.commit()

        execute_crawl_batch(batch.id)

        assert batch.status == "completed"
        assert [job.status for job in jobs] == ["completed", "completed"]
        assert [job.attempts for job in jobs] == [6, 1]
        assert FakeCrawler.calls == [(2019, 1), (2019, 2)]


def test_future_or_cancelled_scheduled_execution_is_a_noop(app, monkeypatch):
    FakeCrawler.calls = []
    monkeypatch.setattr("nursind.tasks.CredentialStore", FakeCredentialStore)
    monkeypatch.setattr(
        "nursind.tasks.crawler_from_config",
        lambda _config, log_callback=None: FakeCrawler(),
    )
    with app.app_context():
        session = CrawlSession(username="user")
        waiting = CrawlBatch(
            session=session,
            start_year=2019,
            start_month=1,
            end_year=2019,
            end_month=1,
            status="retry_wait",
        )
        waiting_job = CrawlJob(
            session_id="temporary",
            batch=waiting,
            username="user",
            year=2019,
            month=1,
            status="retry_wait",
            attempts=5,
            next_retry_at=utcnow() + timedelta(hours=1),
        )
        cancelled = CrawlBatch(
            session=session,
            start_year=2020,
            start_month=1,
            end_year=2020,
            end_month=1,
            status="cancelled",
        )
        cancelled_job = CrawlJob(
            session_id="temporary",
            batch=cancelled,
            username="user",
            year=2020,
            month=1,
            status="cancelled",
        )
        db.session.add_all(
            [session, waiting, waiting_job, cancelled, cancelled_job]
        )
        db.session.flush()
        waiting_job.session_id = session.id
        cancelled_job.session_id = session.id
        db.session.commit()

        execute_crawl_batch(waiting.id)
        execute_crawl_batch(cancelled.id)

        assert FakeCrawler.calls == []
        assert waiting_job.attempts == 5


def test_retry_scheduling_failure_blocks_batch(app, monkeypatch):
    class FailingCrawler(FakeCrawler):
        def download(self, _session, _year, _month, _username):
            raise RuntimeError("portal rejected request")

    monkeypatch.setattr("nursind.tasks.CredentialStore", FakeCredentialStore)
    monkeypatch.setattr(
        "nursind.tasks.crawler_from_config",
        lambda _config, log_callback=None: FailingCrawler(),
    )
    monkeypatch.setattr(
        "nursind.tasks.enqueue_crawl_batch",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(
            RuntimeError("redis unavailable")
        ),
    )
    with app.app_context():
        session = CrawlSession(username="user")
        batch = CrawlBatch(
            session=session,
            start_year=2019,
            start_month=1,
            end_year=2019,
            end_month=1,
        )
        job = CrawlJob(
            session_id="temporary",
            batch=batch,
            username="user",
            year=2019,
            month=1,
        )
        db.session.add_all([session, batch, job])
        db.session.flush()
        job.session_id = session.id
        db.session.commit()

        execute_crawl_batch(batch.id)

        assert batch.status == "blocked"
        assert job.status == "failed"
        assert job.next_retry_at is None
        assert "redis unavailable" in batch.error
