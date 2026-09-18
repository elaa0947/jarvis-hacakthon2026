import json
from pathlib import Path
import pytest
from app.scenarios.comparison import ScenarioComparator

CONFIG_PATH = Path(__file__).resolve().parent.parent / "data" / "factory_config.json"

@pytest.fixture
def factory_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def test_compare_exact_phase_10_scenarios(factory_config):
    """
    Test comparing exact prompt scenarios:
    1. Baseline
    2. M3 slowdown
    3. Increase M3 capacity
    4. Parallel M3
    5. Increase buffer
    """
    res = ScenarioComparator.compare_scenarios(factory_config, simulation_time=480.0, seed=42)

    assert "comparison_matrix" in res
    matrix = res["comparison_matrix"]

    assert len(matrix) == 5

    names = [row["scenario_name"] for row in matrix]
    assert "Baseline" in names
    assert "M3 slowdown" in names
    assert "Increase M3 capacity" in names
    assert "Parallel M3" in names
    assert "Increase buffer" in names

    # Verify exact metric keys
    for row in matrix:
        assert "throughput" in row and isinstance(row["throughput"], int)
        assert "wip" in row and isinstance(row["wip"], (int, float))
        assert "utilization" in row and isinstance(row["utilization"], float)
        assert "queue" in row and isinstance(row["queue"], float)
        assert "blocking" in row and isinstance(row["blocking"], float)
        assert "starvation" in row and isinstance(row["starvation"], float)
        assert "primary_bottleneck" in row
        assert "trade_offs" in row and len(row["trade_offs"]) > 0

def test_trade_offs_are_explainable_and_different(factory_config):
    """Verify that trade-offs vary objectively across scenarios without forcing a universal choice."""
    res = ScenarioComparator.compare_scenarios(factory_config, simulation_time=480.0, seed=42)
    matrix = res["comparison_matrix"]

    slowdown = next(r for r in matrix if r["scenario_name"] == "M3 slowdown")
    assert "-" in slowdown["throughput_delta"]

    parallel = next(r for r in matrix if r["scenario_name"] == "Parallel M3")
    assert parallel["primary_bottleneck"] == "M2"

    buffer_exp = next(r for r in matrix if r["scenario_name"] == "Increase buffer")
    assert "WIP" in buffer_exp["trade_offs"] or "blocking" in buffer_exp["trade_offs"]
