"""
conftest.py — Shared pytest fixtures for the Learnova API test suite.
"""

import os

# Required before any `app` import so `Settings()` validates.
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:password@localhost:5432/learnova",
)
os.environ.setdefault(
    "JWT_SECRET_KEY",
    "test-secret-key-for-pytest-min-32-chars!!",
)
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client() -> TestClient:
    """Synchronous TestClient against the FastAPI app."""
    from app.main import app

    return TestClient(app)
