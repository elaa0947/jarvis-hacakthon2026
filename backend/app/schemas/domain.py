from typing import List, Optional
from pydantic import BaseModel, Field

class MachineSchema(BaseModel):
    id: str = Field(..., example="M1")
    name: str = Field(..., example="Raw Prep")
    processing_time: float = Field(..., description="Processing time per unit (mins)")
    capacity: int = Field(1, description="Parallel processing capacity")
    availability: float = Field(98.0, description="Availability percentage")
    downtime: float = Field(0.0, description="Expected downtime duration or rate")
    status: str = Field("IDLE", description="Operational status (IDLE, WORKING, BLOCKED, STARVED, DOWN)")
    sequence: int = Field(..., description="Stage order sequence position (1..5)")

class BufferSchema(BaseModel):
    id: str = Field(..., example="B1")
    capacity: int = Field(10, description="Max buffer capacity")
    current_wip: int = Field(0, description="Current Work-In-Progress items in buffer")
    sequence: int = Field(..., description="Sequence position (1..4)")

class JobSchema(BaseModel):
    id: str = Field(..., example="JOB_001")
    arrival_time: float = Field(0.0, description="System entry timestamp")
    current_stage: str = Field(..., example="M1")
    completion_time: Optional[float] = Field(None, description="System exit timestamp")

class ProductionConfigSchema(BaseModel):
    factory_id: str = Field("factory_01")
    factory_name: str = Field("Precision Assembly Plant 1")
    line_sequence: List[str] = Field(
        default=["M1", "B1", "M2", "B2", "M3", "B3", "M4", "B4", "M5"]
    )
    machines: List[MachineSchema]
    buffers: List[BufferSchema]

