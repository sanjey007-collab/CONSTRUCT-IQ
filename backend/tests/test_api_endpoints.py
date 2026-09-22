from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "ConstructIQ"

def test_auth_login():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "procurement@constructiq.com", "password": "demo1234"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "PROCUREMENT_MANAGER"

def test_get_projects():
    response = client.get("/api/v1/projects")
    assert response.status_code == 200
    projects = response.json()
    assert len(projects) >= 5
    names = [p["name"] for p in projects]
    assert any("Madurai" in n for n in names)
    assert any("Chennai" in n for n in names)

def test_get_materials():
    response = client.get("/api/v1/materials")
    assert response.status_code == 200
    materials = response.json()
    assert len(materials) >= 10

def test_get_shortages_and_surplus():
    resp_shortages = client.get("/api/v1/shortages")
    assert resp_shortages.status_code == 200
    assert len(resp_shortages.json()) > 0

    resp_surplus = client.get("/api/v1/surplus")
    assert resp_surplus.status_code == 200
    assert len(resp_surplus.json()) > 0

def test_get_dashboard_analytics():
    response = client.get("/api/v1/analytics/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert data["active_projects"] >= 5
    assert data["predicted_shortages_count"] >= 1
    assert data["potential_surplus_count"] >= 1
    assert data["estimated_savings_identified"] > 0
