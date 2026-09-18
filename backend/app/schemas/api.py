from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class SimulationRunRequest(BaseModel):
    simulation_time: float = Field(480.0, description="Simulation period in minutes")
    seed: int = Field(42, description="Random seed for deterministic repeatability")

class ScenarioRunRequest(BaseModel):
    scenario_name: str = Field(..., example="M3 Capacity Increase")
    modified_machines: Optional[List[Dict[str, Any]]] = None
    modified_buffers: Optional[List[Dict[str, Any]]] = None
    simulation_time: float = 480.0
    seed: int = 42

class ScenarioCompareRequest(BaseModel):
    scenarios_list: Optional[List[Dict[str, Any]]] = None
    simulation_time: float = 480.0
    seed: int = 42

class ScenarioApplyRequest(BaseModel):
    modified_machines: Optional[List[Dict[str, Any]]] = None
    modified_buffers: Optional[List[Dict[str, Any]]] = None
    simulation_time: float = 480.0
    seed: int = 42

