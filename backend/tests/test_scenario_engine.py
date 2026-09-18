import json
import copy
from pathlib import Path
import pytest
from app.scenarios.manager import ScenarioEngine

CONFIG_PATH = Path(__file__).resolve().parent.parent / "data" / "factory_config.json"

@pytest.fixture
def baseline_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def test_immutability_baseline_unmodified(baseline_config):
    """
    IMPORTANT: Test proving that executing a scenario NEVER modifies the original baseline configuration.
    """
    engine = ScenarioEngine(baseline_config)
    original_baseline_snapshot = copy.deepcopy(baseline_config)

    # Execute drastic scenario
    engine.run_scenario(
        scenario_name="M3 Major Slowdown",
        modified_machines=[{"id": "M3", "processing_time": 25.0, "capacity": 5}],
        modified_buffers=[{"id": "B2", "capacity": 100}]
    )

    current_baseline = engine.get_baseline_config()

    # Original snapshot and current baseline must be 100% identical!
    assert current_baseline == original_baseline_snapshot, "Scenario execution MUST NOT mutate baseline configuration!"

def test_processing_time_scenario(baseline_config):
    """Test processing-time change scenario (Primary Demo: M3 slowdown 6.5 -> 8.45 mins)."""
    engine = ScenarioEngine(baseline_config)
    res = engine.run_scenario(
        scenario_name="M3 Slowdown 60s to 78s",
        modified_machines=[{"id": "M3", "processing_time": 8.45}]
    )

    assert res["scenario_name"] == "M3 Slowdown 60s to 78s"
    assert res["simulation_result"]["throughput"] < 61
    assert res["propagation_analysis"]["throughput_delta_pct"] < 0.0

def test_capacity_change_scenario(baseline_config):
    """Test machine capacity change scenario (M3 capacity 1 -> 2)."""
    engine = ScenarioEngine(baseline_config)
    res = engine.run_scenario(
        scenario_name="M3 Dual Parallel Capacity",
        modified_machines=[{"id": "M3", "capacity": 2}]
    )

    # Primary bottleneck shifts from M3 to M2
    assert res["bottleneck_analysis"]["primary_bottleneck"] != "M3"
    assert res["bottleneck_analysis"]["primary_bottleneck"] == "M2"

def test_downtime_change_scenario(baseline_config):
    """Test machine downtime change scenario (M3 downtime 45 -> 15 mins)."""
    engine = ScenarioEngine(baseline_config)
    res = engine.run_scenario(
        scenario_name="M3 Reduced Downtime",
        modified_machines=[{"id": "M3", "downtime": 15.0}]
    )

    assert res["simulation_result"]["machines"]["M3"]["downtime"] <= 18.0

def test_buffer_capacity_change_scenario(baseline_config):
    """Test buffer capacity change scenario (B2 capacity 8 -> 20)."""
    engine = ScenarioEngine(baseline_config)
    res = engine.run_scenario(
        scenario_name="B2 Buffer Expansion",
        modified_buffers=[{"id": "B2", "capacity": 20}]
    )

    assert res["simulation_result"]["buffers"]["B2"]["capacity"] == 20

