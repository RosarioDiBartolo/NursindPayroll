from nursind.extensions import db
from nursind.models import CrawlBatch, CrawlJob, CrawlSession
from nursind.tasks import execute_crawl_batch


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


class FakeLock:
    def acquire(self, blocking=False):
        return True

    def release(self):
        pass


class FakeRedis:
    def lock(self, *_args, **_kwargs):
        return FakeLock()


def test_worker_completes_batch_in_month_order(app, monkeypatch):
    FakeCrawler.calls = []
    monkeypatch.setattr("nursind.tasks.CredentialStore", FakeCredentialStore)
    monkeypatch.setattr(
        "nursind.tasks.crawler_from_config",
        lambda _config: FakeCrawler(),
    )
    monkeypatch.setattr("nursind.tasks.get_redis", lambda: FakeRedis())

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


def test_worker_blocks_batch_and_does_not_start_next_month(app, monkeypatch):
    class FailingCrawler(FakeCrawler):
        def download(self, _session, year, month, _username):
            self.calls.append((year, month))
            raise RuntimeError("portal rejected request")

    FailingCrawler.calls = []
    monkeypatch.setattr("nursind.tasks.CredentialStore", FakeCredentialStore)
    monkeypatch.setattr(
        "nursind.tasks.crawler_from_config",
        lambda _config: FailingCrawler(),
    )
    monkeypatch.setattr("nursind.tasks.get_redis", lambda: FakeRedis())

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

        assert batch.status == "blocked"
        assert [job.status for job in batch.jobs] == ["failed", "pending"]
        assert FailingCrawler.calls == [(2019, 1)]
