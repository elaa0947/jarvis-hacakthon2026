from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class MachineConfig(BaseModel):
    id: str = Field(..., example="M1")
    name: str = Field(..., example="Raw Prep")
    processing_time: float = Field(..., description="Mean processing time per unit (mins)")
    capacity: int = Field(1, description="Parallel processing capacity")
    availability: float = Field(100.0, description="Target availability percentage")
    mtbf: float = Field(600.0, description="Mean time between failures (mins)")
    mttr: float = Field(30.0, description="Mean time to repair (mins)")
    buffer_capacity: int = Field(10, description="Max units in inbound queue before upstream blocks")

class ProductionLineConfig(BaseModel):
    line_id: str = Field("baseline_line")
    name: str = Field("5-Stage Assembly Line")
    simulation_time: float = Field(480.0, description="Total simulation duration (mins)")
    machines: List[MachineConfig]

class MachineMetrics(BaseModel):
    machine_id: str
    utilization: float
    throughput: int
    avg_wip: float
    avg_queue_length: float
    blocking_time_pct: float
    starvation_time_pct: float
    downtime_pct: float
    bottleneck_score: float

class SimulationRunRequest(BaseModel):
    simulation_time: Optional[float] = 480.0
    seed: Optional[int] = 42

class SimulationResult(BaseModel):
    simulation_id: str
    duration: float
    total_throughput: int
    avg_line_wip: float
    machine_metrics: Dict[str, MachineMetrics]
    primary_bottleneck: str
    secondary_bottleneck: Optional[str] = None

class ScenarioModification(BaseModel):
    id: str
    processing_time: Optional[float] = None
    capacity: Optional[int] = None
    buffer_capacity: Optional[int] = None
    availability: Optional[float] = None
    mtbf: Optional[float] = None
    mttr: Optional[float] = None

class ScenarioRunRequest(BaseModel):
    scenario_name: str
    description: Optional[str] = ""
    modified_machines: List[ScenarioModification]
    simulation_time: Optional[float] = 480.0
    seed: Optional[int] = 42

class PropagationEvent(BaseModel):
    timestamp: float
    source_machine: str
    event_type: str
    impacted_machines: List[str]
    direction: str
    description: str

class BottleneckAnalysisResult(BaseModel):
    primary_bottleneck: Dict[str, Any]
    propagation_events: List[PropagationEvent]

class ScenarioComparisonResult(BaseModel):
    scenario_id: str
    scenario_name: str
    throughput_delta: str
    wip_delta: str
    bottleneck_shift: str
    recommendation: str

class DecisionApplyRequest(BaseModel):
    scenario_id: str

