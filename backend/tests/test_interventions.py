import json
from pathlib import Path
import pytest
from app.scenarios.interventions import InterventionGenerator
from app.scenarios.manager import ScenarioEngine

CONFIG_PATH = Path(__file__).resolve().parent.parent / "data" / "factory_config.json"

@pytest.fixture
def factory_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def test_generate_interventions_for_m3(factory_config):
    """Verify that 4 deterministic explainable interventions are generated for M3."""
    interventions = InterventionGenerator.generate_interventions(factory_config, bottleneck_machine_id="M3")
    
    assert len(interventions) == 4
    
    names = [i["name"] for i in interventions]
    assert "Add Parallel Unit to M3" in names
    assert "Reduce M3 Processing Time" in names
    assert "Expand Buffer B2 Capacity" in names
    assert "Preventive Maintenance on M3" in names

    for item in interventions:
        assert "id" in item
        assert "description" in item
        assert "rationale" in item
        assert "modified_machines" in item or "modified_buffers" in item

def test_interventions_executable_in_simulation(factory_config):
    """Verify that every generated candidate intervention runs in the simulation engine cleanly."""
    interventions = InterventionGenerator.generate_interventions(factory_config, bottleneck_machine_id="M3")
    engine = ScenarioEngine(factory_config)

    for item in interventions:
        res = engine.run_scenario(
            scenario_name=item["name"],
            modified_machines=item.get("modified_machines"),
            modified_buffers=item.get("modified_buffers")
        )

        assert res["simulation_result"]["throughput"] > 0
        assert "primary_bottleneck" in res["bottleneck_analysis"]
        assert "propagation_chain" in res["propagation_analysis"]

