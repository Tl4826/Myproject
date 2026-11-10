"""Vercel entry point for the existing FastAPI model service."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "ml" / "service"))

from app import app as _service_app  # noqa: E402


class StripApiPrefix:
    """Allow Vercel's /api/* function URL to reach the service's /predict routes."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] in ("http", "websocket") and scope["path"].startswith("/api/"):
            scope = {**scope, "path": scope["path"][4:] or "/"}
        await self.app(scope, receive, send)


app = StripApiPrefix(_service_app)
