import json
import copy
from pathlib import Path
import pytest
from app.scenarios.manager import ScenarioEngine
from app.analytics.bottleneck import BottleneckDetector

CONFIG_PATH = Path(__file__).resolve().parent.parent / "data" / "factory_config.json"

@pytest.fixture
def baseline_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def test_apply_scenario_workflow(baseline_config):
    """
    Workflow regression test:
    Apply Scenario -> update digital model -> create new baseline -> re-simulate -> recalculate KPIs -> re-run bottleneck detection.
    """
    engine = ScenarioEngine(baseline_config)
    
    # 1. Before applying scenario: M3 is primary bottleneck
    base_cfg = engine.get_baseline_config()
    assert base_cfg["machines"][2]["id"] == "M3"
    assert base_cfg["machines"][2]["processing_time"] == 6.5

    # 2. Apply scenario: Improve M3 processing time from 6.5m to 3.8m
    apply_result = engine.apply_scenario(
        modified_machines=[{"id": "M3", "processing_time": 3.8}]
    )

    # 3. Verify digital model updated
    assert apply_result["status"] == "applied"
    updated_cfg = engine.get_baseline_config()
    m3_updated = next(m for m in updated_cfg["machines"] if m["id"] == "M3")
    assert m3_updated["processing_time"] == 3.8

    # 4. Verify re-simulation results and recalculated KPIs present
    sim_res = apply_result["new_simulation_result"]
    assert sim_res["throughput"] > 0
    assert "recalculated_kpis" in apply_result
    assert apply_result["recalculated_kpis"]["throughput"] == sim_res["throughput"]

    # 5. Verify bottleneck detection re-ran dynamically
    new_bm_analysis = apply_result["new_bottleneck_analysis"]
    assert new_bm_analysis["primary_bottleneck"] != "M3"
    assert apply_result["migration_occurred"] is True
    assert apply_result["previous_bottleneck"] == "M3"

def test_bottleneck_migration_dynamically_computed(baseline_config):
    """
    Regression Test: Prove that improving M3 causes the primary bottleneck to migrate dynamically.
    Do NOT hardcode the resulting bottleneck machine—it must come from the re-analysis!
    """
    engine = ScenarioEngine(baseline_config)

    # Apply improvement to M3 (processing_time = 3.5 min)
    res = engine.apply_scenario(
        modified_machines=[{"id": "M3", "processing_time": 3.5}]
    )

    new_bottleneck = res["new_bottleneck"]

    # M3 constraint must decrease and new bottleneck must be detected dynamically
    assert new_bottleneck != "M3"
    assert new_bottleneck in ["M1", "M2", "M4", "M5"]
    assert res["new_bottleneck_analysis"]["analysis_breakdown"][new_bottleneck]["bottleneck_status"] == "PRIMARY_BOTTLENECK"

