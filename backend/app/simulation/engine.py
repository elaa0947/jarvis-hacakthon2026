"""
Discrete-Event Simulation Engine powered by SimPy.
Exposes clean interface run_simulation(factory, scenario=None, simulation_time=480.0, seed=42).
Produces baseline metrics: throughput, WIP, utilization, queue length, waiting time, blocking, starvation, machine state.
"""

import copy
import random
import simpy
from typing import Dict, Any, Optional, List
from app.simulation.job import Job
from app.simulation.buffer import Buffer
from app.simulation.machine import Machine
from app.simulation.events import EventLogger

def run_simulation(
    factory: Dict[str, Any],
    scenario: Optional[Dict[str, Any]] = None,
    simulation_time: float = 480.0,
    seed: int = 42
) -> Dict[str, Any]:
    """
    Executes SimPy discrete event simulation for the given factory configuration.
    Applies scenario modifications if provided without mutating original factory dict.
    Returns structured simulation results dictionary.
    """
    random.seed(seed)
    
    # Deepcopy factory config so baseline remains pristine
    config = copy.deepcopy(factory)
    
    # Apply scenario modifications if present
    if scenario and "modified_machines" in scenario:
        m_map = {m["id"]: m for m in config.get("machines", [])}
        for mod in scenario["modified_machines"]:
            m_id = mod.get("id")
            if m_id in m_map:
                for k, v in mod.items():
                    if k != "id" and v is not None:
                        m_map[m_id][k] = v

    if scenario and "modified_buffers" in scenario:
        b_map = {b["id"]: b for b in config.get("buffers", [])}
        for mod in scenario["modified_buffers"]:
            b_id = mod.get("id")
            if b_id in b_map:
                for k, v in mod.items():
                    if k != "id" and v is not None:
                        b_map[b_id][k] = v

    env = simpy.Environment()
    logger = EventLogger()

    # 1. Instantiate Buffers (B1, B2, B3, B4)
    buffers: Dict[str, Buffer] = {}
    for b_cfg in config.get("buffers", []):
        buffers[b_cfg["id"]] = Buffer(
            env=env,
            buffer_id=b_cfg["id"],
            capacity=b_cfg["capacity"],
            sequence=b_cfg["sequence"]
        )

    # 2. Map Inbound/Outbound connections (M1 -> B1 -> M2 -> B2 -> M3 -> B3 -> M4 -> B4 -> M5)
    connection_map = {
        "M1": (None, buffers.get("B1")),
        "M2": (buffers.get("B1"), buffers.get("B2")),
        "M3": (buffers.get("B2"), buffers.get("B3")),
        "M4": (buffers.get("B3"), buffers.get("B4")),
        "M5": (buffers.get("B4"), None),
    }

    # 3. Instantiate Machines (M1..M5)
    machines: Dict[str, Machine] = {}
    job_sink: List[Job] = []

    for m_cfg in config.get("machines", []):
        m_id = m_cfg["id"]
        in_buf, out_buf = connection_map.get(m_id, (None, None))
        machines[m_id] = Machine(
            env=env,
            machine_id=m_id,
            name=m_cfg["name"],
            processing_time=m_cfg["processing_time"],
            capacity=m_cfg["capacity"],
            availability=m_cfg.get("availability", 100.0),
            downtime=m_cfg.get("downtime", 0.0),
            sequence=m_cfg["sequence"],
            logger=logger,
            inbound_buffer=in_buf,
            outbound_buffer=out_buf
        )

    # 4. Launch Machine processes & downtime processes
    for m_id, m in machines.items():
        env.process(m.run_process(job_sink))
        if m.availability < 100.0:
            env.process(m.run_downtime_process())

    # 5. Run Simulation
    env.run(until=simulation_time)

    # 6. Raw Machine Stats Gathering
    raw_stats = {}
    ordered_m_ids = ["M1", "M2", "M3", "M4", "M5"]

    for m_id in ordered_m_ids:
        m = machines[m_id]
        utilization = min(1.0, round(m.working_time / (simulation_time * m.capacity), 3))
        blocking_pct = round((m.blocking_time / simulation_time) * 100, 1)
        starvation_pct = round((m.starvation_time / simulation_time) * 100, 1)
        downtime_pct = round((m.downtime_total / simulation_time) * 100, 1)
        in_buf = m.inbound_buffer
        avg_queue = in_buf.calculate_average_wip(simulation_time) if in_buf else 0.0
        waiting_time = in_buf.average_waiting_time if in_buf else 0.0

        raw_stats[m_id] = {
            "machine": m,
            "utilization": utilization,
            "blocking_pct": blocking_pct,
            "starvation_pct": starvation_pct,
            "downtime_pct": downtime_pct,
            "avg_queue": avg_queue,
            "waiting_time": waiting_time
        }

    # 7. Compute Multi-Metric Bottleneck Severity Index (BSI)
    # BSI(M_i) = 0.4*Utilization(M_i) + 0.3*UpstreamBlocking(M_{i-1}) + 0.2*DownstreamStarvation(M_{i+1}) + 0.1*BufferRatio(B_{i-1})
    machine_results = {}
    highest_bsi = -1.0
    primary_bottleneck = "M3"

    for idx, m_id in enumerate(ordered_m_ids):
        curr = raw_stats[m_id]
        m = curr["machine"]
        util = curr["utilization"]
        
        # Upstream machine blocking (if M_{i-1} is blocked, M_i is causing the block)
        upstream_blocking = raw_stats[ordered_m_ids[idx - 1]]["blocking_pct"] if idx > 0 else 0.0
        
        # Downstream machine starvation (if M_{i+1} is starved, M_i is restricting flow)
        downstream_starvation = raw_stats[ordered_m_ids[idx + 1]]["starvation_pct"] if idx < len(ordered_m_ids) - 1 else 0.0
        
        # Inbound buffer ratio
        buf_ratio = min(1.0, curr["avg_queue"] / max(1.0, float(m.inbound_buffer.capacity if m.inbound_buffer else 1)))

        bsi = (0.4 * util) + (0.3 * (upstream_blocking / 100.0)) + (0.2 * (downstream_starvation / 100.0)) + (0.1 * buf_ratio)
        bsi = round(bsi, 3)

        if bsi > highest_bsi:
            highest_bsi = bsi
            primary_bottleneck = m_id

        machine_results[m_id] = {
            "machine_id": m_id,
            "name": m.name,
            "utilization": round(util * 100, 1),
            "queue_length": curr["avg_queue"],
            "waiting_time": curr["waiting_time"],
            "blocking_time": curr["blocking_pct"],
            "starvation_time": curr["starvation_pct"],
            "downtime": curr["downtime_pct"],
            "completed_jobs": m.completed_count,
            "status": m.status,
            "sequence": m.sequence,
            "bottleneck_score": bsi
        }

    buffer_results = {}
    for b_id, b in buffers.items():
        buffer_results[b_id] = {
            "buffer_id": b_id,
            "capacity": b.capacity,
            "current_wip": b.current_wip,
            "avg_wip": b.calculate_average_wip(simulation_time),
            "max_wip": b.max_wip,
            "waiting_time": b.average_waiting_time,
            "sequence": b.sequence
        }

    total_throughput = len(job_sink)
    final_wip = sum(b.current_wip for b in buffers.values()) + sum(m.resource.count for m in machines.values())

    return {
        "run_id": f"sim_{seed}_{int(simulation_time)}",
        "simulation_time": simulation_time,
        "throughput": total_throughput,
        "wip": final_wip,
        "machines": machine_results,
        "buffers": buffer_results,
        "primary_bottleneck": primary_bottleneck,
        "events_count": len(logger.events),
        "events": logger.get_logs()
    }
