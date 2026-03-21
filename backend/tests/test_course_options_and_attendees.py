"""
Phase 6 — Course options, enrollments, and attendees API tests.
Requires PostgreSQL at DATABASE_URL (see conftest).
"""

from __future__ import annotations

import uuid

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="module")
def client() -> TestClient:
    """Module-scoped client so module-scoped auth can reuse the same TestClient."""
    from app.main import app

    return TestClient(app)


@pytest.fixture(scope="module")
def instructor_headers(client: TestClient) -> dict[str, str]:
    uid = uuid.uuid4().hex[:12]
    email = f"phase6_instr_{uid}@test.example"
    try:
        r = client.post(
            "/api/v1/auth/register",
            json={
                "email": email,
                "password": "password123",
                "full_name": "Phase Six Instructor",
                "role": "instructor",
            },
        )
    except Exception as exc:
        pytest.skip(f"PostgreSQL/API unavailable (start DB and set DATABASE_URL): {exc}")
    if r.status_code != 201:
        pytest.skip(f"Register failed ({r.status_code}): {r.text}")
    token = r.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def course_id(client: TestClient, instructor_headers: dict[str, str]) -> str:
    r = client.post(
        "/api/v1/courses",
        json={"title": f"Phase6 Course {uuid.uuid4().hex[:8]}"},
        headers=instructor_headers,
    )
    assert r.status_code == 201, r.text
    return r.json()["data"]["id"]


def test_put_options_saves_visibility_and_access_rule(
    client: TestClient,
    instructor_headers: dict[str, str],
    course_id: str,
) -> None:
    r = client.put(
        f"/api/v1/courses/{course_id}/options",
        headers=instructor_headers,
        json={
            "visibility": "signed_in",
            "access_rule": "on_invitation",
            "price_cents": None,
            "responsible_user_id": None,
        },
    )
    assert r.status_code == 200, r.text
    data = r.json()["data"]
    assert data["visibility"] == "signed_in"
    assert data["access_rule"] == "on_invitation"


def test_put_options_on_payment_without_positive_price_fails(
    client: TestClient,
    instructor_headers: dict[str, str],
    course_id: str,
) -> None:
    r = client.put(
        f"/api/v1/courses/{course_id}/options",
        headers=instructor_headers,
        json={
            "access_rule": "on_payment",
            "price_cents": None,
        },
    )
    assert r.status_code == 400, r.text
    assert "Price is required" in r.json()["detail"]

    r2 = client.put(
        f"/api/v1/courses/{course_id}/options",
        headers=instructor_headers,
        json={
            "access_rule": "on_payment",
            "price_cents": 0,
        },
    )
    assert r2.status_code == 400, r2.text


def test_put_options_on_payment_with_price_ok(
    client: TestClient,
    instructor_headers: dict[str, str],
    course_id: str,
) -> None:
    r = client.put(
        f"/api/v1/courses/{course_id}/options",
        headers=instructor_headers,
        json={
            "access_rule": "on_payment",
            "price_cents": 1999,
        },
    )
    assert r.status_code == 200, r.text
    assert r.json()["data"]["price_cents"] == 1999
    assert r.json()["data"]["access_rule"] == "on_payment"


def test_post_attendees_creates_enrollment_and_user(
    client: TestClient,
    instructor_headers: dict[str, str],
    course_id: str,
) -> None:
    email = f"learner_{uuid.uuid4().hex[:10]}@test.example"
    r = client.post(
        f"/api/v1/courses/{course_id}/attendees",
        headers=instructor_headers,
        json={"emails": [email]},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["added"] == 1
    assert body["already_enrolled"] == 0
    assert body["emails_queued"] == 1

    r2 = client.get(
        f"/api/v1/courses/{course_id}/attendees",
        headers=instructor_headers,
    )
    assert r2.status_code == 200, r2.text
    emails = {u["email"] for u in r2.json()["data"]}
    assert email in emails


def test_post_attendees_duplicate_returns_already_enrolled(
    client: TestClient,
    instructor_headers: dict[str, str],
    course_id: str,
) -> None:
    email = f"dup_{uuid.uuid4().hex[:10]}@test.example"
    r1 = client.post(
        f"/api/v1/courses/{course_id}/attendees",
        headers=instructor_headers,
        json={"emails": [email]},
    )
    assert r1.status_code == 200
    r2 = client.post(
        f"/api/v1/courses/{course_id}/attendees",
        headers=instructor_headers,
        json={"emails": [email]},
    )
    assert r2.status_code == 200, r2.text
    assert r2.json()["added"] == 0
    assert r2.json()["already_enrolled"] == 1


def test_contact_attendees_returns_queued_count(
    client: TestClient,
    instructor_headers: dict[str, str],
    course_id: str,
) -> None:
    email = f"contact_{uuid.uuid4().hex[:10]}@test.example"
    client.post(
        f"/api/v1/courses/{course_id}/attendees",
        headers=instructor_headers,
        json={"emails": [email]},
    )
    r = client.post(
        f"/api/v1/courses/{course_id}/contact",
        headers=instructor_headers,
        json={"subject": "Hello", "body": "Test message body."},
    )
    assert r.status_code == 200, r.text
    assert r.json()["queued"] >= 1
