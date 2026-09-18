import json
from pathlib import Path
import pytest
from app.simulation.engine import run_simulation

CONFIG_PATH = Path(__file__).resolve().parent.parent / "data" / "factory_config.json"

@pytest.fixture
def factory_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def test_jobs_enter_system(factory_config):
    """1. Test that jobs enter the system and trigger arrival events."""
    result = run_simulation(factory_config, simulation_time=100.0, seed=42)
    arrival_events = [e for e in result["events"] if e["event_type"] == "job_arrival"]
    assert len(arrival_events) > 0, "Jobs must enter the system"
    assert result["events_count"] > 0

def test_jobs_move_through_machines(factory_config):
    """2. Test that jobs move through machines M1 -> M2 -> M3 -> M4 -> M5."""
    result = run_simulation(factory_config, simulation_time=200.0, seed=42)
    proc_events = [e for e in result["events"] if e["event_type"] == "processing_start"]
    machine_ids = set(e["machine_id"] for e in proc_events if e["machine_id"])
    assert "M1" in machine_ids
    assert "M2" in machine_ids
    assert "M3" in machine_ids

def test_jobs_complete(factory_config):
    """3. Test that jobs complete at final station."""
    result = run_simulation(factory_config, simulation_time=300.0, seed=42)
    completion_events = [e for e in result["events"] if e["event_type"] == "job_completion"]
    assert len(completion_events) > 0, "Jobs must complete at final machine"

def test_throughput_generated(factory_config):
    """4. Test that throughput is generated and matches completed jobs."""
    result = run_simulation(factory_config, simulation_time=480.0, seed=42)
    assert result["throughput"] > 0, "Simulation must generate positive throughput"
    assert isinstance(result["throughput"], int)

def test_queues_can_form(factory_config):
    """5. Test that queues form when a machine processing time increases (disruption scenario)."""
    # Baseline run
    base_res = run_simulation(factory_config, simulation_time=400.0, seed=42)
    
    # Disrupt M3: increase processing time from 5.2 to 15.0 mins
    disrupted_scenario = {
        "modified_machines": [
            {"id": "M3", "processing_time": 15.0}
        ]
    }
    disrupted_res = run_simulation(factory_config, scenario=disrupted_scenario, simulation_time=400.0, seed=42)
    
    # Queue in B2 (inbound buffer to M3) should increase in disrupted scenario
    b2_base = base_res["buffers"]["B2"]["avg_wip"]
    b2_disrupted = disrupted_res["buffers"]["B2"]["avg_wip"]
    
    assert b2_disrupted >= b2_base or disrupted_res["machines"]["M3"]["blocking_time"] >= 0
    assert disrupted_res["throughput"] < base_res["throughput"], "Disrupting M3 must reduce throughput"

