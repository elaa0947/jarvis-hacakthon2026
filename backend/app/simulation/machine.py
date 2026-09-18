"""
SimPy Machine process modeling processing, queueing, downtime, blocking, starvation, and machine state transitions.
"""

import simpy
import random
from typing import Optional, List
from app.simulation.buffer import Buffer
from app.simulation.job import Job
from app.simulation.events import EventLogger, EventType

class Machine:
    def __init__(
        self,
        env: simpy.Environment,
        machine_id: str,
        name: str,
        processing_time: float,
        capacity: int,
        availability: float,
        downtime: float,
        sequence: int,
        logger: EventLogger,
        inbound_buffer: Optional[Buffer] = None,
        outbound_buffer: Optional[Buffer] = None
    ):
        self.env = env
        self.machine_id = machine_id
        self.name = name
        self.processing_time = processing_time
        self.capacity = capacity
        self.availability = availability
        self.downtime = downtime  # MTTR or repair duration
        self.sequence = sequence
        self.logger = logger
        self.inbound_buffer = inbound_buffer
        self.outbound_buffer = outbound_buffer

        self.resource = simpy.Resource(env, capacity=capacity)
        self.status = "IDLE"

        # Operational metrics tracking
        self.working_time = 0.0
        self.blocking_time = 0.0
        self.starvation_time = 0.0
        self.downtime_total = 0.0
        self.completed_count = 0
        self.job_counter = 1
        self.is_down = False

    def run_process(self, job_sink: List[Job]):
        """Main machine process loop."""
        while True:
            # 1. Fetch job from inbound buffer or create for M1
            if self.inbound_buffer is not None:
                self.status = "STARVED"
                start_starve = self.env.now
                self.logger.log(self.env.now, EventType.STARVATION, self.machine_id)
                job = yield self.inbound_buffer.get()
                starve_dur = self.env.now - start_starve
                self.starvation_time += starve_dur
            else:
                # Raw material stage (M1)
                yield self.env.timeout(0)
                job = Job(self.job_counter, self.env.now)
                self.logger.log(self.env.now, EventType.JOB_ARRIVAL, self.machine_id, job.job_id)
                self.job_counter += 1

            # 2. Wait if machine is down due to breakdown
            while self.is_down:
                start_down_wait = self.env.now
                yield self.env.timeout(0.5)
                self.downtime_total += (self.env.now - start_down_wait)

            # 3. Process unit
            with self.resource.request() as req:
                yield req
                self.status = "WORKING"
                if job:
                    job.record_stage_entry(self.machine_id, self.env.now)
                self.logger.log(self.env.now, EventType.PROCESSING_START, self.machine_id, job.job_id if job else None)
                
                proc_start = self.env.now
                yield self.env.timeout(self.processing_time)
                self.working_time += (self.env.now - proc_start)
                
                if job:
                    job.record_stage_exit(self.machine_id, self.env.now)
                self.logger.log(self.env.now, EventType.PROCESSING_COMPLETION, self.machine_id, job.job_id if job else None)

            # 4. Outbound buffer push & blocking tracking
            if self.outbound_buffer is not None:
                self.status = "BLOCKED"
                start_block = self.env.now
                self.logger.log(self.env.now, EventType.BLOCKING, self.machine_id, job.job_id if job else None)
                yield self.outbound_buffer.put(job)
                block_dur = self.env.now - start_block
                self.blocking_time += block_dur
                self.status = "IDLE"
            else:
                # Last station in line (M5)
                self.completed_count += 1
                if job:
                    job.completion_time = self.env.now
                    job_sink.append(job)
                self.logger.log(self.env.now, EventType.JOB_COMPLETION, self.machine_id, job.job_id if job else None)
                self.status = "IDLE"

    def run_downtime_process(self):
        """Failure and repair downtime loop if availability < 100%."""
        if self.availability >= 100.0 or self.downtime <= 0:
            return

        # MTBF calculation based on availability target
        mtbf = (self.processing_time * 10.0) * (self.availability / (100.0 - self.availability))
        while True:
            yield self.env.timeout(random.expovariate(1.0 / max(mtbf, 1.0)))
            self.is_down = True
            old_status = self.status
            self.status = "DOWN"
            self.logger.log(self.env.now, EventType.MACHINE_BREAKDOWN, self.machine_id)
            
            repair_time = random.exponential(self.downtime) if hasattr(random, 'exponential') else self.downtime
            yield self.env.timeout(repair_time)
            self.downtime_total += repair_time
            self.is_down = False
            self.status = old_status
            self.logger.log(self.env.now, EventType.MACHINE_RECOVERY, self.machine_id)

