"""
Structured event logger for SimPy discrete-event simulation events.
"""

from typing import Dict, Any, List, Optional
from enum import Enum

class EventType(str, Enum):
    JOB_ARRIVAL = "job_arrival"
    QUEUE_ENTRY = "queue_entry"
    PROCESSING_START = "processing_start"
    PROCESSING_COMPLETION = "processing_completion"
    MACHINE_IDLE = "machine_idle"
    MACHINE_BUSY = "machine_busy"
    MACHINE_BREAKDOWN = "machine_breakdown"
    MACHINE_RECOVERY = "machine_recovery"
    BLOCKING = "blocking"
    STARVATION = "starvation"
    JOB_COMPLETION = "job_completion"

class SimulationEvent:
    def __init__(self, timestamp: float, event_type: EventType, machine_id: Optional[str] = None, job_id: Optional[int] = None, details: Optional[Dict[str, Any]] = None):
        self.timestamp = round(timestamp, 2)
        self.event_type = event_type
        self.machine_id = machine_id
        self.job_id = job_id
        self.details = details or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "timestamp": self.timestamp,
            "event_type": self.event_type.value if isinstance(self.event_type, EventType) else str(self.event_type),
            "machine_id": self.machine_id,
            "job_id": self.job_id,
            "details": self.details
        }

class EventLogger:
    def __init__(self):
        self.events: List[SimulationEvent] = []

    def log(self, timestamp: float, event_type: EventType, machine_id: Optional[str] = None, job_id: Optional[int] = None, details: Optional[Dict[str, Any]] = None):
        evt = SimulationEvent(timestamp, event_type, machine_id, job_id, details)
        self.events.append(evt)

    def get_logs(self) -> List[Dict[str, Any]]:
        return [evt.to_dict() for evt in self.events]

