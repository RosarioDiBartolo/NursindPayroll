from datetime import timedelta

import pytest

from nursind.extensions import db
from nursind.models import CrawlJob, utcnow


class FakeCredentials:
    def __init__(self, *_args, **_kwargs):
        pass

    def get(self, session_id):
        if session_id == "valid":
            return {"username": "user", "password": "secret"}
        return None


class FakeQueue:
    def __init__(self, *_args, **_kwargs):
        pass

    def enqueue(self, *_args, **_kwargs):
        return None


@pytest.mark.parametrize(
    "method,path",
    [
        ("post", "/api/request"),
        ("post", "/api/request/login"),
        ("get", "/api/aziende"),
        ("post", "/api/conteggio/x"),
        ("post", "/api/differenziale"),
        ("post", "/api/parse/x/y"),
    ],
)
def test_legacy_endpoints_are_not_available(client, method, path):
    response = getattr(client, method)(path)

    assert response.status_code == 404


def test_create_job_requires_valid_session(client, monkeypatch):
    monkeypatch.setattr("nursind.routes.CredentialStore", FakeCredentials)
    response = client.post(
        "/api/crawl-jobs",
        json={"session_id": "expired", "year": 2019, "month": 1},
    )
    assert response.status_code == 404


def test_create_and_read_job(client, monkeypatch):
    monkeypatch.setattr("nursind.routes.CredentialStore", FakeCredentials)
    monkeypatch.setattr("nursind.routes.Queue", FakeQueue)
    response = client.post(
        "/api/crawl-jobs",
        json={"session_id": "valid", "year": 2019, "month": 1},
    )
    assert response.status_code == 202
    job_id = response.get_json()["id"]
    status = client.get(f"/api/crawl-jobs/{job_id}")
    assert status.get_json()["status"] == "queued"


def test_download_rejects_expired_output(app, client, tmp_path):
    output = tmp_path / "job.pdf"
    output.write_bytes(b"%PDF")
    with app.app_context():
        job = CrawlJob(
            session_id="valid",
            username="user",
            year=2019,
            month=1,
            status="completed",
            output_path=str(output),
            expires_at=utcnow() - timedelta(seconds=1),
        )
        db.session.add(job)
        db.session.commit()
        job_id = job.id

    response = client.get(f"/api/crawl-jobs/{job_id}/download")
    assert response.status_code == 410
