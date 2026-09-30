"""Internal authentication and bounded request intake before parsing uploads."""
from __future__ import annotations

import hmac
import json

from starlette.responses import JSONResponse

from app.config import get_settings


class ServiceBoundary:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope["path"] == "/health":
            return await self.app(scope, receive, send)
        settings = get_settings()
        headers = dict(scope.get("headers", []))

        async def reject(status, detail):
            await JSONResponse({"detail": detail}, status_code=status)(scope, receive, send)

        token = settings.ai_service_api_token
        if not token:
            return await reject(503, "AI service authentication is not configured.")
        expected = ("Bearer " + token).encode()
        if not hmac.compare_digest(headers.get(b"authorization", b""), expected):
            return await reject(401, "Service authentication is required.")

        content_type = headers.get(b"content-type", b"").decode("latin-1").lower()
        limit = (settings.max_upload_bytes + 64 * 1024
                 if content_type.startswith("multipart/form-data") else settings.max_json_bytes)
        try:
            declared = int(headers.get(b"content-length", b"0"))
            if declared < 0:
                raise ValueError
        except ValueError:
            return await reject(400, "Invalid content length.")
        if declared > limit:
            return await reject(413, "Request body is too large.")
        body = bytearray()
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            chunk = message.get("body", b"")
            if len(body) + len(chunk) > limit:
                return await reject(413, "Request body is too large.")
            body.extend(chunk)
            if not message.get("more_body", False):
                break
        if content_type.startswith("application/json") and body:
            try:
                payload = json.loads(body)
                self._validate_json(payload)
            except (ValueError, RecursionError):
                return await reject(422, "JSON exceeds the supported text, list, or nesting limits.")

        delivered = False

        async def replay():
            nonlocal delivered
            if not delivered:
                delivered = True
                return {"type": "http.request", "body": bytes(body), "more_body": False}
            return await receive()

        await self.app(scope, replay, send)

    @classmethod
    def _validate_json(cls, value, depth=0):
        if depth > 16 or (isinstance(value, str) and len(value) > 100_000):
            raise ValueError("Input limit")
        if isinstance(value, (list, dict)):
            if len(value) > 200:
                raise ValueError("Collection limit")
            for item in value.values() if isinstance(value, dict) else value:
                cls._validate_json(item, depth + 1)
