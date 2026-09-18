import json
from pathlib import Path
import pytest
from app.simulation.engine import run_simulation
from app.analytics.bottleneck import BottleneckDetector

CONFIG_PATH = Path(__file__).resolve().parent.parent / "data" / "factory_config.json"

@pytest.fixture
def factory_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def test_m3_detected_in_baseline(factory_config):
    """Prove M3 is detected as primary bottleneck in baseline using multi-metric evidence."""
    sim_result = run_simulation(factory_config, simulation_time=480.0, seed=42)
    analysis = BottleneckDetector.detect_bottlenecks(sim_result)
    
    assert analysis["primary_bottleneck"] == "M3"
    assert analysis["primary_bottleneck_score"] > 0.5
    assert "M3" in analysis["primary_reason"]
    
    m3_breakdown = analysis["analysis_breakdown"]["M3"]
    assert m3_breakdown["bottleneck_status"] == "PRIMARY_BOTTLENECK"
    assert m3_breakdown["utilization"] >= 70.0
    assert m3_breakdown["upstream_blocking_caused"] >= 10.0
    assert m3_breakdown["downstream_starvation_caused"] >= 10.0

def test_changing_conditions_changes_bottleneck(factory_config):
    """Prove that changing machine parameters shifts the primary bottleneck (Bottleneck Migration)."""
    # Baseline has M3 as bottleneck
    base_sim = run_simulation(factory_config, simulation_time=480.0, seed=42)
    base_analysis = BottleneckDetector.detect_bottlenecks(base_sim)
    assert base_analysis["primary_bottleneck"] == "M3"

    # Disruption Scenario: Make M2 severely slow (processing time = 12.0 mins vs original 4.5 mins)
    m2_slow_scenario = {
        "modified_machines": [
            {"id": "M2", "processing_time": 12.0}
        ]
    }
    m2_sim = run_simulation(factory_config, scenario=m2_slow_scenario, simulation_time=480.0, seed=42)
    m2_analysis = BottleneckDetector.detect_bottlenecks(m2_sim)
    
    # Primary bottleneck must shift from M3 to M2!
    assert m2_analysis["primary_bottleneck"] == "M2"
    assert m2_analysis["primary_bottleneck"] != base_analysis["primary_bottleneck"]
    assert "M2" in m2_analysis["primary_reason"]

def test_intervention_shifts_bottleneck(factory_config):
    """Prove that fixing M3 (adding parallel capacity / speeding up) shifts bottleneck downstream or upstream."""
    # Intervention Scenario: Increase M3 capacity to 2 and reduce cycle time to 3.0 min
    m3_fix_scenario = {
        "modified_machines": [
            {"id": "M3", "capacity": 2, "processing_time": 3.0}
        ]
    }
    fix_sim = run_simulation(factory_config, scenario=m3_fix_scenario, simulation_time=480.0, seed=42)
    fix_analysis = BottleneckDetector.detect_bottlenecks(fix_sim)
    
    # Primary bottleneck must no longer be M3!
    assert fix_analysis["primary_bottleneck"] != "M3"

