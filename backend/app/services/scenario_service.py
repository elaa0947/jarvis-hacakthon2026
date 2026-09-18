"""
Scenario Service Layer.
Orchestrates isolated scenario execution, scenario comparison matrix generation,
and human decision application to update the active factory model.
"""

from typing import Dict, Any, List, Optional
from app.services.simulation_service import get_active_factory_config, set_active_factory_config, execute_simulation
from app.scenarios.manager import ScenarioEngine
from app.scenarios.comparison import ScenarioComparator

def execute_scenario_run(
    scenario_name: str,
    modified_machines: Optional[List[Dict[str, Any]]] = None,
    modified_buffers: Optional[List[Dict[str, Any]]] = None,
    simulation_time: float = 480.0,
    seed: int = 42
) -> Dict[str, Any]:
    config = get_active_factory_config()
    engine = ScenarioEngine(config)
    return engine.run_scenario(
        scenario_name=scenario_name,
        modified_machines=modified_machines,
        modified_buffers=modified_buffers,
        simulation_time=simulation_time,
        seed=seed
    )

def execute_scenario_comparison(
    scenarios_list: Optional[List[Dict[str, Any]]] = None,
    simulation_time: float = 480.0,
    seed: int = 42
) -> Dict[str, Any]:
    config = get_active_factory_config()
    return ScenarioComparator.compare_scenarios(
        factory_config=config,
        scenarios_list=scenarios_list,
        simulation_time=simulation_time,
        seed=seed
    )

def apply_selected_scenario(
    scenario_id: str,
    modified_machines: Optional[List[Dict[str, Any]]] = None,
    modified_buffers: Optional[List[Dict[str, Any]]] = None,
    simulation_time: float = 480.0,
    seed: int = 42
) -> Dict[str, Any]:
    config = get_active_factory_config()
    engine = ScenarioEngine(config)
    
    # If explicit modifications not passed, infer preset for known scenario_ids
    if not modified_machines and not modified_buffers:
        if "parallel" in scenario_id.lower() or "capacity" in scenario_id.lower():
            modified_machines = [{"id": "M3", "capacity": 2}]
        elif "slowdown" in scenario_id.lower():
            modified_machines = [{"id": "M3", "processing_time": 8.45}]
        elif "speed" in scenario_id.lower() or "time" in scenario_id.lower():
            modified_machines = [{"id": "M3", "processing_time": 3.8}]
        elif "buffer" in scenario_id.lower():
            modified_buffers = [{"id": "B2", "capacity": 16}]
        else:
            # Default M3 improvement for demonstration
            modified_machines = [{"id": "M3", "processing_time": 3.5}]

    apply_result = engine.apply_scenario(
        modified_machines=modified_machines,
        modified_buffers=modified_buffers,
        simulation_time=simulation_time,
        seed=seed
    )

    # Update active factory config in service layer
    set_active_factory_config(apply_result["updated_factory_config"])
    return apply_result

