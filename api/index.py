"""Vercel entry point for the existing FastAPI model service."""
from pathlib import Path
import sys
from urllib.parse import parse_qs

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from ml.service.app import app as _service_app  # noqa: E402


class StripApiPrefix:
    """Preserve the public AI routes across internal rewrites."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] in ("http", "websocket"):
            original = scope["path"]
            path = original[4:] if original.startswith("/api/") else original
            if path in ("/api", "/", "/index", "/index.py"):
                query = parse_qs(scope.get("query_string", b"").decode("utf-8", errors="replace"))
                route = query.get("__nutrivn_route")
                if route == ["health"]:
                    path = "/health"
                elif route == ["predict"]:
                    path = "/predict"
            if path != original:
                scope = {**scope, "path": path, "raw_path": path.encode("utf-8")}
        await self.app(scope, receive, send)


app = StripApiPrefix(_service_app)
