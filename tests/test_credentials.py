from nursind.credentials import CredentialStore


class MemoryRedis:
    def __init__(self):
        self.data = {}
        self.expirations = {}

    def setex(self, key, ttl, value):
        self.data[key] = value
        self.expirations[key] = ttl

    def get(self, key):
        return self.data.get(key)

    def expire(self, key, ttl):
        self.expirations[key] = ttl

    def delete(self, key):
        return int(self.data.pop(key, None) is not None)


def test_credentials_are_encrypted_and_deleted(app, monkeypatch):
    redis = MemoryRedis()
    monkeypatch.setattr("nursind.credentials.get_redis", lambda: redis)
    with app.app_context():
        store = CredentialStore()
        session_id = store.create("user", "secret")
        raw = redis.data[f"crawl-session:{session_id}"]
        assert b"secret" not in raw
        assert store.get(session_id) == {"username": "user", "password": "secret"}
        assert store.delete(session_id)
        assert store.get(session_id) is None
