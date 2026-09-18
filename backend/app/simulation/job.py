"""
Job entity representing a workpiece moving through M1 -> B1 -> M2 -> B2 -> M3 -> B3 -> M4 -> B4 -> M5.
"""

from typing import Dict, Optional

class Job:
    def __init__(self, job_id: int, creation_time: float):
        self.job_id = job_id
        self.creation_time = creation_time
        self.completion_time: Optional[float] = None
        self.stage_entry_times: Dict[str, float] = {}
        self.stage_exit_times: Dict[str, float] = {}
        self.current_stage: str = "ENTER"

    def record_stage_entry(self, stage_id: str, time: float):
        self.current_stage = stage_id
        self.stage_entry_times[stage_id] = time

    def record_stage_exit(self, stage_id: str, time: float):
        self.stage_exit_times[stage_id] = time

