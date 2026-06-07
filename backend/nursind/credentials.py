import json

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

    def create(self, session_id: str, username: str, password: str) -> None:
        payload = json.dumps(
            {"username": username, "password": password}
        ).encode("utf-8")
        self.redis.set(
            f"{self.prefix}{session_id}",
            self.fernet.encrypt(payload),
        )

    def get(self, session_id: str) -> dict | None:
        key = f"{self.prefix}{session_id}"
        encrypted = self.redis.get(key)
        if encrypted is None:
            return None
        try:
            payload = json.loads(self.fernet.decrypt(encrypted))
        except (InvalidToken, ValueError, json.JSONDecodeError) as exc:
            raise CredentialStoreError("Stored credentials are invalid") from exc
        return payload

    def delete(self, session_id: str) -> bool:
        return bool(self.redis.delete(f"{self.prefix}{session_id}"))
