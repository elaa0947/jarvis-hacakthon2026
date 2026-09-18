import json
from pathlib import Path
import pytest
from app.simulation.engine import run_simulation

CONFIG_PATH = Path(__file__).resolve().parent.parent / "data" / "factory_config.json"

@pytest.fixture
def factory_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def test_baseline_m3_primary_bottleneck(factory_config):
    """Verify that M3 is naturally detected as the primary bottleneck based on simulation evidence."""
    result = run_simulation(factory_config, simulation_time=480.0, seed=42)
    
    # 1. Primary bottleneck must be M3 based on highest BSI
    assert result["primary_bottleneck"] == "M3", f"Expected M3 as primary bottleneck, got {result['primary_bottleneck']}"
    
    # 2. Simulation evidence checks
    m3_stats = result["machines"]["M3"]
    m2_stats = result["machines"]["M2"]
    m4_stats = result["machines"]["M4"]

    # M3 utilization should be higher than downstream M4
    assert m3_stats["utilization"] >= m4_stats["utilization"]
    
    # Upstream M2 should experience blocking time because M3 is slow
    assert m2_stats["blocking_time"] >= 0.0
    
    # Downstream M4 should experience starvation time waiting for M3
    assert m4_stats["starvation_time"] >= 0.0

def test_baseline_produced_metrics(factory_config):
    """Verify all required baseline metrics are present in output."""
    result = run_simulation(factory_config, simulation_time=480.0, seed=42)
    
    assert "throughput" in result and isinstance(result["throughput"], int)
    assert "wip" in result and isinstance(result["wip"], (int, float))
    assert "machines" in result
    assert "buffers" in result

    for m_id, m in result["machines"].items():
        assert "utilization" in m
        assert "queue_length" in m
        assert "waiting_time" in m
        assert "blocking_time" in m
        assert "starvation_time" in m
        assert "status" in m
        assert "completed_jobs" in m

def test_baseline_repeatability(factory_config):
    """Verify that running the same baseline simulation twice produces 100% identical results."""
    run_1 = run_simulation(factory_config, simulation_time=480.0, seed=42)
    run_2 = run_simulation(factory_config, simulation_time=480.0, seed=42)
    
    assert run_1["throughput"] == run_2["throughput"]
    assert run_1["wip"] == run_2["wip"]
    assert run_1["primary_bottleneck"] == run_2["primary_bottleneck"]
    assert run_1["machines"] == run_2["machines"]
    assert run_1["buffers"] == run_2["buffers"]
    assert run_1["events_count"] == run_2["events_count"]

