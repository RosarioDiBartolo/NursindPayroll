from datetime import timedelta

import pytest

from nursind.extensions import db
from nursind.models import CrawlBatch, CrawlJob, CrawlSession, utcnow


class FakePortalSession:
    def close(self):
        pass


class FakeCrawler:
    def login(self, _username, _password):
        return FakePortalSession()


class FakeCredentials:
    values = {}

    def __init__(self, *_args, **_kwargs):
        pass

    def create(self, session_id, username, password):
        self.values[session_id] = {"username": username, "password": password}

    def get(self, session_id):
        return self.values.get(session_id)

    def delete(self, session_id):
        return self.values.pop(session_id, None) is not None


class FakeQueue:
    calls = []

    def __init__(self, *_args, **_kwargs):
        pass

    def enqueue(self, *args, **kwargs):
        self.calls.append((args, kwargs))

    def enqueue_in(self, delay, *args, **kwargs):
        self.calls.append(((delay, *args), kwargs))


@pytest.fixture(autouse=True)
def fake_dependencies(monkeypatch):
    FakeCredentials.values = {}
    FakeQueue.calls = []
    monkeypatch.setattr("nursind.routes.CredentialStore", FakeCredentials)
    monkeypatch.setattr("nursind.tasks.CredentialStore", FakeCredentials)
    monkeypatch.setattr("nursind.routes.crawler_from_config", lambda _config: FakeCrawler())
    monkeypatch.setattr("nursind.tasks.Queue", FakeQueue)


def create_session(client):
    response = client.post(
        "/api/crawl-sessions",
        json={"username": "user", "password": "secret"},
    )
    assert response.status_code == 201
    return response.get_json()["session"]["id"]


def test_create_session_and_explicit_month_range(client):
    session_id = create_session(client)
    response = client.post(
        f"/api/crawl-sessions/{session_id}/batches",
        json={
            "start_year": 2000,
            "start_month": 11,
            "end_year": 2001,
            "end_month": 2,
        },
    )

    assert response.status_code == 202
    batch = response.get_json()
    assert [(job["year"], job["month"]) for job in batch["jobs"]] == [
        (2000, 11),
        (2000, 12),
        (2001, 1),
        (2001, 2),
    ]
    assert [job["status"] for job in batch["jobs"]] == [
        "queued",
        "pending",
        "pending",
        "pending",
    ]
    assert FakeQueue.calls
    _, enqueue_options = FakeQueue.calls[0]
    assert "retry" not in enqueue_options

    invalid = client.post(
        f"/api/crawl-sessions/{session_id}/batches",
        json={
            "start_year": 2020,
            "start_month": 1,
            "end_year": 2000,
            "end_month": 1,
        },
    )
    assert invalid.status_code == 400


def test_login_reuses_existing_session_for_username(client):
    session_id = create_session(client)
    response = client.post(
        "/api/crawl-sessions",
        json={"username": "user", "password": "new-secret"},
    )

    assert response.status_code == 200
    assert response.get_json()["session"]["id"] == session_id
    assert FakeCredentials.values[session_id] == {
        "username": "user",
        "password": "new-secret",
    }


def test_batch_delete_removes_jobs_and_files(app, client, tmp_path):
    session_id = create_session(client)
    output = tmp_path / "job.pdf"
    output.write_bytes(b"%PDF")
    with app.app_context():
        batch = CrawlBatch(
            session_id=session_id,
            start_year=2019,
            start_month=1,
            end_year=2019,
            end_month=1,
            status="completed",
        )
        db.session.add(batch)
        job = CrawlJob(
            session_id=session_id,
            batch=batch,
            sequence=0,
            username="user",
            year=2019,
            month=1,
            status="completed",
            output_path=str(output),
        )
        db.session.add(job)
        db.session.commit()
        batch_id = batch.id

    response = client.delete(f"/api/crawl-batches/{batch_id}")
    assert response.status_code == 204
    assert not output.exists()
    with app.app_context():
        assert db.session.get(CrawlBatch, batch_id) is None


def test_session_delete_cascades_batches(client):
    session_id = create_session(client)
    response = client.post(
        f"/api/crawl-sessions/{session_id}/batches",
        json={
            "start_year": 2019,
            "start_month": 1,
            "end_year": 2019,
            "end_month": 1,
        },
    )
    batch_id = response.get_json()["id"]

    deleted = client.delete(f"/api/crawl-sessions/{session_id}")
    assert deleted.status_code == 204
    assert client.get(f"/api/crawl-sessions/{session_id}").status_code == 404
    assert client.get(f"/api/crawl-batches/{batch_id}").status_code == 404


def test_download_rejects_expired_output(app, client, tmp_path):
    output = tmp_path / "job.pdf"
    output.write_bytes(b"%PDF")
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
            status="completed",
            output_path=str(output),
            expires_at=utcnow() - timedelta(seconds=1),
        )
        db.session.add_all([session, batch, job])
        db.session.flush()
        job.session_id = session.id
        db.session.commit()
        job_id = job.id

    response = client.get(f"/api/crawl-jobs/{job_id}/download")
    assert response.status_code == 410


def test_waiting_retry_is_serialized_and_can_be_cancelled(app, client):
    session_id = create_session(client)
    with app.app_context():
        batch = CrawlBatch(
            session_id=session_id,
            start_year=2019,
            start_month=1,
            end_year=2019,
            end_month=1,
            status="retry_wait",
        )
        job = CrawlJob(
            session_id=session_id,
            batch=batch,
            username="user",
            year=2019,
            month=1,
            status="retry_wait",
            attempts=5,
            next_retry_at=utcnow() + timedelta(hours=1),
        )
        db.session.add_all([batch, job])
        db.session.commit()
        batch_id = batch.id

    snapshot = client.get(f"/api/crawl-batches/{batch_id}").get_json()
    assert snapshot["status"] == "retry_wait"
    assert snapshot["counts"]["pending"] == 1
    assert snapshot["jobs"][0]["next_retry_at"] is not None

    cancelled = client.post(f"/api/crawl-batches/{batch_id}/cancel")
    assert cancelled.status_code == 200
    payload = cancelled.get_json()
    assert payload["status"] == "cancelled"
    assert payload["jobs"][0]["status"] == "cancelled"
    assert payload["jobs"][0]["next_retry_at"] is None


def test_manual_retry_endpoint_is_removed(client):
    assert client.post("/api/crawl-batches/missing/retry").status_code == 404
