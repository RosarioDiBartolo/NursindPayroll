from nursind.credentials import CredentialStore


class MemoryRedis:
    def __init__(self):
        self.data = {}

    def set(self, key, value):
        self.data[key] = value

    def get(self, key):
        return self.data.get(key)

    def delete(self, key):
        return int(self.data.pop(key, None) is not None)


def test_credentials_are_encrypted_permanent_and_explicitly_deleted(
    app, monkeypatch
):
    redis = MemoryRedis()
    monkeypatch.setattr("nursind.credentials.get_redis", lambda: redis)
    with app.app_context():
        store = CredentialStore()
        store.create("session-1", "user", "secret")
        raw = redis.data["crawl-session:session-1"]
        assert b"secret" not in raw
        assert store.get("session-1") == {
            "username": "user",
            "password": "secret",
        }
        assert store.delete("session-1")
        assert store.get("session-1") is None
