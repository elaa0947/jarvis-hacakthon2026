import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_invalid_simulation_time_400():
    """Test HTTP 400 response for invalid simulation_time <= 0."""
    response = client.post("/api/simulation/run", json={"simulation_time": -10.0})
    assert response.status_code == 400
    assert "simulation_time must be greater than 0" in response.json()["detail"]

def test_empty_scenario_name_400():
    """Test HTTP 400 response for empty scenario name."""
    response = client.post("/api/scenarios/run", json={"scenario_name": "  "})
    assert response.status_code == 400
    assert "scenario_name cannot be empty" in response.json()["detail"]

def test_route_not_found_404():
    """Test 404 response for unhandled endpoint."""
    response = client.get("/api/nonexistent_route")
    assert response.status_code == 404

def test_successful_simulation_response():
    """Test 200 successful response format."""
    response = client.post("/api/simulation/run", json={"simulation_time": 480.0, "seed": 42})
    assert response.status_code == 200
    data = response.json()
    assert data["throughput"] > 0
    assert "primary_bottleneck" in data

