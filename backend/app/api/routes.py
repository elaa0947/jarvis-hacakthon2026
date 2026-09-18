"""
Thin REST API Router.
Delegates all business logic, simulation execution, analytics, and scenario management to service modules.
Validates input parameters and handles exceptions.
"""

from fastapi import APIRouter, HTTPException, status
from typing import Optional
from app.schemas.api import (
    SimulationRunRequest,
    ScenarioRunRequest,
    ScenarioCompareRequest,
    ScenarioApplyRequest
)
from app.services.simulation_service import (
    get_active_factory_config,
    execute_simulation,
    get_bottleneck_analysis,
    get_propagation_analysis
)
from app.services.scenario_service import (
    execute_scenario_run,
    execute_scenario_comparison,
    apply_selected_scenario
)

router = APIRouter(prefix="/api")

@router.get("/health")
def health_check():
    """System health check endpoint."""
    return {"status": "ok"}

@router.get("/factory")
def get_factory():
    """Returns active digital twin factory configuration."""
    return get_active_factory_config()

@router.post("/simulation/run")
def run_simulation_endpoint(req: SimulationRunRequest = SimulationRunRequest()):
    """
    Executes discrete-event simulation, runs multi-metric bottleneck analytics,
    and returns full operational results.
    """
    if req.simulation_time <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="simulation_time must be greater than 0 minutes."
        )
    try:
        return execute_simulation(simulation_time=req.simulation_time, seed=req.seed)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Simulation execution error: {str(e)}"
        )

@router.post("/scenarios/run")
def run_scenario_endpoint(req: ScenarioRunRequest):
    """Executes isolated what-if scenario simulation without mutating baseline."""
    if not req.scenario_name or not req.scenario_name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="scenario_name cannot be empty."
        )
    if req.simulation_time <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="simulation_time must be greater than 0 minutes."
        )
    try:
        return execute_scenario_run(
            scenario_name=req.scenario_name,
            modified_machines=req.modified_machines,
            modified_buffers=req.modified_buffers,
            simulation_time=req.simulation_time,
            seed=req.seed
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scenario execution error: {str(e)}"
        )

@router.get("/analysis/bottleneck/{run_id}")
def get_bottleneck_analysis_endpoint(run_id: str):
    """Returns multi-metric bottleneck analysis breakdown for a given run ID."""
    if not run_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="run_id required.")
    return get_bottleneck_analysis(run_id)

@router.get("/analysis/propagation/{run_id}")
def get_propagation_analysis_endpoint(run_id: str, machine_id: Optional[str] = "M3"):
    """Returns step-by-step event propagation analysis chain for a given run ID."""
    return get_propagation_analysis(run_id, disrupted_machine_id=machine_id or "M3")

@router.post("/scenarios/compare")
def compare_scenarios_endpoint(req: ScenarioCompareRequest = ScenarioCompareRequest()):
    """Generates side-by-side comparative matrix evaluating baseline vs candidate scenarios."""
    return execute_scenario_comparison(
        scenarios_list=req.scenarios_list,
        simulation_time=req.simulation_time,
        seed=req.seed
    )

@router.post("/scenarios/{scenario_id}/apply")
def apply_scenario_endpoint(scenario_id: str, req: ScenarioApplyRequest = ScenarioApplyRequest()):
    """
    Human-in-the-loop Decision Endpoint:
    Applies chosen scenario, updates active digital model, re-simulates, recalculates KPIs,
    re-evaluates bottleneck migration, and returns updated production state.
    """
    if not scenario_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="scenario_id required.")
    try:
        return apply_selected_scenario(
            scenario_id=scenario_id,
            modified_machines=req.modified_machines,
            modified_buffers=req.modified_buffers,
            simulation_time=req.simulation_time,
            seed=req.seed
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to apply scenario: {str(e)}"
        )
