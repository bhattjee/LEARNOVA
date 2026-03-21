"""
test_health.py — Health endpoint smoke test (requires PostgreSQL).
"""


def test_health_ok(client) -> None:
    """GET /api/v1/health returns ok when the database is reachable."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "ok"
    assert data.get("version") == "1.0.0"
