from nursind.extensions import db
from nursind.models import CrawlJob
from nursind.tasks import execute_crawl_job


class FakeCredentialStore:
    def __init__(self, *_args, **_kwargs):
        pass

    def get(self, _session_id):
        return {"username": "user", "password": "secret"}


class FakeSession:
    def close(self):
        pass


class FakeCrawler:
    def login(self, _username, _password):
        return FakeSession()

    def download(self, _session, _year, _month, _username):
        return b"%PDF-1.7\ncontent"


def test_worker_completes_job_and_writes_output(app, monkeypatch):
    monkeypatch.setattr("nursind.tasks.CredentialStore", FakeCredentialStore)
    monkeypatch.setattr(
        "nursind.tasks.crawler_from_config",
        lambda _config: FakeCrawler(),
    )
    with app.app_context():
        job = CrawlJob(
            session_id="session",
            username="user",
            year=2019,
            month=1,
        )
        db.session.add(job)
        db.session.commit()
        job_id = job.id

        execute_crawl_job(job_id)

        completed = db.session.get(CrawlJob, job_id)
        assert completed.status == "completed"
        assert completed.attempts == 1
        assert completed.output_path
        assert completed.expires_at is not None
