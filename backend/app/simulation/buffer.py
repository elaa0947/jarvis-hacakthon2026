"""
SimPy Buffer process component.
Handles queueing between machines, capacity limits, current WIP, queue length statistics, and average waiting time.
"""

import simpy
from typing import List
from app.simulation.job import Job

class Buffer:
    def __init__(self, env: simpy.Environment, buffer_id: str, capacity: int, sequence: int):
        self.env = env
        self.buffer_id = buffer_id
        self.capacity = capacity
        self.sequence = sequence
        self.store = simpy.Store(env, capacity=capacity)
        
        # Statistics tracking
        self.total_wait_time = 0.0
        self.jobs_entered = 0
        self.jobs_exited = 0
        self.max_wip = 0
        self.wip_time_series: List[tuple] = [(0.0, 0)]  # (timestamp, wip_count)

    def put(self, job: Job):
        job.record_stage_entry(self.buffer_id, self.env.now)
        self.jobs_entered += 1
        current_wip = len(self.store.items) + 1
        self.max_wip = max(self.max_wip, current_wip)
        self.wip_time_series.append((self.env.now, current_wip))
        return self.store.put(job)

    def get(self):
        def _on_get(event):
            if event.ok and hasattr(event, 'value'):
                job = event.value
                entry_t = job.stage_entry_times.get(self.buffer_id, self.env.now)
                wait_t = max(0.0, self.env.now - entry_t)
                self.total_wait_time += wait_t
                self.jobs_exited += 1
            current_wip = len(self.store.items)
            self.wip_time_series.append((self.env.now, current_wip))

        get_evt = self.store.get()
        get_evt.callbacks.append(_on_get)
        return get_evt

    @property
    def current_wip(self) -> int:
        return len(self.store.items)

    @property
    def average_waiting_time(self) -> float:
        if self.jobs_exited <= 0:
            return 0.0
        return round(self.total_wait_time / self.jobs_exited, 2)

    def calculate_average_wip(self, simulation_time: float) -> float:
        if simulation_time <= 0 or len(self.wip_time_series) <= 1:
            return float(self.current_wip)
            
        total_area = 0.0
        for i in range(len(self.wip_time_series) - 1):
            t_curr, wip_curr = self.wip_time_series[i]
            t_next, _ = self.wip_time_series[i + 1]
            total_area += wip_curr * (t_next - t_curr)
            
        t_last, wip_last = self.wip_time_series[-1]
        if t_last < simulation_time:
            total_area += wip_last * (simulation_time - t_last)
            
        return round(total_area / simulation_time, 2)
