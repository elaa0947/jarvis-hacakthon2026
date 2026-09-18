import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_api_factory():
    response = client.get("/api/factory")
    assert response.status_code == 200
    data = response.json()
    assert "factory_name" in data
    assert "machines" in data
    assert len(data["machines"]) == 5

def test_api_simulation_run_end_to_end():
    """
    CRITICAL REQUIREMENT:
    POST /api/simulation/run -> simulation -> analytics -> bottleneck -> JSON response
    """
    response = client.post("/api/simulation/run", json={"simulation_time": 480.0, "seed": 42})
    assert response.status_code == 200
    data = response.json()
    
    assert "run_id" in data
    assert "throughput" in data and isinstance(data["throughput"], int)
    assert "wip" in data
    assert "machines" in data
    assert "primary_bottleneck" in data
    assert data["primary_bottleneck"] == "M3"
    assert "bottleneck_analysis" in data
    assert "kpis" in data

def test_api_scenario_run():
    payload = {
        "scenario_name": "M3 Slowdown Test",
        "modified_machines": [{"id": "M3", "processing_time": 8.45}],
        "simulation_time": 480.0,
        "seed": 42
    }
    response = client.post("/api/scenarios/run", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "scenario_id" in data
    assert "simulation_result" in data
    assert "bottleneck_analysis" in data

def test_api_bottleneck_analysis():
    sim_res = client.post("/api/simulation/run").json()
    run_id = sim_res["run_id"]
    
    response = client.get(f"/api/analysis/bottleneck/{run_id}")
    assert response.status_code == 200
    data = response.json()
    assert "primary_bottleneck" in data
    assert data["primary_bottleneck"] == "M3"

def test_api_propagation_analysis():
    sim_res = client.post("/api/simulation/run").json()
    run_id = sim_res["run_id"]
    
    response = client.get(f"/api/analysis/propagation/{run_id}")
    assert response.status_code == 200
    data = response.json()
    assert "propagation_chain" in data
    assert len(data["propagation_chain"]) >= 5

def test_api_scenarios_compare():
    response = client.post("/api/scenarios/compare", json={})
    assert response.status_code == 200
    data = response.json()
    assert "comparison_matrix" in data
    assert len(data["comparison_matrix"]) == 5

def test_api_scenarios_apply_end_to_end():
    # Apply M3 speedup
    payload = {
        "modified_machines": [{"id": "M3", "processing_time": 3.5}],
        "simulation_time": 480.0,
        "seed": 42
    }
    response = client.post("/api/scenarios/scen_test_speed/apply", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "applied"
    assert data["migration_occurred"] is True
    assert data["previous_bottleneck"] == "M3"
    assert data["new_bottleneck"] != "M3"

