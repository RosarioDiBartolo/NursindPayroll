import json
from uuid import uuid4

from cryptography.fernet import Fernet, InvalidToken
from flask import current_app

from .redis_client import get_redis


class CredentialStoreError(Exception):
    pass


class CredentialStore:
    prefix = "crawl-session:"

    def __init__(self):
        key = current_app.config["CREDENTIAL_ENCRYPTION_KEY"]
        if not key:
            raise CredentialStoreError("CREDENTIAL_ENCRYPTION_KEY is not configured")
        self.fernet = Fernet(key.encode("ascii"))
        self.redis = get_redis()
        self.ttl = current_app.config["CREDENTIAL_TTL_SECONDS"]

    def create(self, username: str, password: str) -> str:
        session_id = str(uuid4())
        payload = json.dumps(
            {"username": username, "password": password}
        ).encode("utf-8")
        self.redis.setex(
            f"{self.prefix}{session_id}",
            self.ttl,
            self.fernet.encrypt(payload),
        )
        return session_id

    def get(self, session_id: str, refresh: bool = True) -> dict | None:
        key = f"{self.prefix}{session_id}"
        encrypted = self.redis.get(key)
        if encrypted is None:
            return None
        try:
            payload = json.loads(self.fernet.decrypt(encrypted))
        except (InvalidToken, ValueError, json.JSONDecodeError) as exc:
            raise CredentialStoreError("Stored credentials are invalid") from exc
        if refresh:
            self.redis.expire(key, self.ttl)
        return payload

    def delete(self, session_id: str) -> bool:
        return bool(self.redis.delete(f"{self.prefix}{session_id}"))
