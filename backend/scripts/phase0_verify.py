"""
phase0_verify.py — Run from `backend/` to print Phase 0 backend smoke results.

Usage: python scripts/phase0_verify.py
"""

from __future__ import annotations

import sys
from pathlib import Path

# Ensure `backend/` is on path when run as `python scripts/phase0_verify.py`
_BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))


def main() -> None:
    print("1. FastAPI import ...")
    from app.main import app

    print(f"   OK - app title: {app.title!r}")

    print("2. Settings ...")
    from app.core.config import settings

    du = settings.database_url
    print(f"   OK - settings.database_url starts with: {du[:28]}...")

    print("3. HTTP routes (in-process) ...")
    from fastapi.testclient import TestClient

    client = TestClient(app)
    live = client.get("/api/v1/health/live")
    print(f"   GET /api/v1/health/live -> {live.status_code} {live.json()}")

    ready = client.get("/api/v1/health")
    body = ready.json() if ready.content else {}
    print(f"   GET /api/v1/health (DB) -> {ready.status_code} {body}")
    if ready.status_code == 503:
        print(
            "   NOTE: 503 means PostgreSQL rejected the connection. "
            "Fix DATABASE_URL in backend/.env (user, password, host, db name `learnova`).",
        )


if __name__ == "__main__":
    main()
