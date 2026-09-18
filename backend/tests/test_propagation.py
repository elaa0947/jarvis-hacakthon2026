import json
from pathlib import Path
import pytest
from app.simulation.engine import run_simulation
from app.analytics.propagation import PropagationAnalyzer

CONFIG_PATH = Path(__file__).resolve().parent.parent / "data" / "factory_config.json"

@pytest.fixture
def factory_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def test_m3_slowdown_propagation(factory_config):
    """
    Test propagation analysis for M3 slowdown (processing time increases from 6.5 min to 8.5 min).
    Demonstrates M3 slowdown -> capacity drop -> B2 queue buildup -> M2 blocking -> M4 starvation -> throughput drop.
    """
    # 1. Baseline simulation
    base_res = run_simulation(factory_config, simulation_time=480.0, seed=42)

    # 2. M3 Slowdown Disruption Scenario (30% increase: 6.5 -> 8.45 mins, matching 60s -> 78s ratio)
    slowdown_scenario = {
        "modified_machines": [
            {"id": "M3", "processing_time": 8.45}
        ]
    }
    scen_res = run_simulation(factory_config, scenario=slowdown_scenario, simulation_time=480.0, seed=42)

    # 3. Analyze Propagation
    propagation = PropagationAnalyzer.analyze_propagation(base_res, scen_res, disrupted_machine_id="M3")

    assert propagation["disrupted_machine"] == "M3"
    assert propagation["scenario_throughput"] < propagation["baseline_throughput"]
    assert propagation["throughput_delta_pct"] < 0.0

    chain = propagation["propagation_chain"]
    assert len(chain) >= 5

    # Step stages in propagation chain
    stages = [step["stage"] for step in chain]
    assert "M3" in stages
    assert "B2" in stages
    assert "M2" in stages
    assert "M4" in stages
    assert "FACTORY_LINE" in stages

    # Check summary narrative presence
    assert "M3" in propagation["summary"]
    assert "B2" in propagation["summary"]

