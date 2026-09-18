"""
Deterministic Intervention Generator.
Generates candidate what-if intervention scenarios for a detected bottleneck machine.
No ML or complex optimization—purely explainable, rule-based manufacturing engineering heuristics.
"""

from typing import Dict, Any, List

class InterventionGenerator:
    """
    Generates structured intervention scenario payloads for a given bottleneck machine.
    Supports:
    1. Capacity increase (parallel server)
    2. Processing time reduction (speedup/tooling upgrade)
    3. Preceding buffer expansion
    4. Maintenance / downtime reduction
    """

    @staticmethod
    def generate_interventions(factory_config: Dict[str, Any], bottleneck_machine_id: str = "M3") -> List[Dict[str, Any]]:
        machines = factory_config.get("machines", [])
        buffers = factory_config.get("buffers", [])

        target_m = next((m for m in machines if m["id"] == bottleneck_machine_id), None)
        if not target_m:
            target_m = {"id": "M3", "processing_time": 6.5, "capacity": 1, "downtime": 45.0}

        m_id = target_m["id"]
        curr_proc = target_m.get("processing_time", 6.5)
        curr_cap = target_m.get("capacity", 1)
        curr_downtime = target_m.get("downtime", 45.0)

        # Preceding buffer ID (e.g., M3 -> B2)
        ordered_m = ["M1", "M2", "M3", "M4", "M5"]
        m_idx = ordered_m.index(m_id) if m_id in ordered_m else 2
        inbound_b_id = f"B{m_idx}" if m_idx > 0 else "B1"
        target_b = next((b for b in buffers if b["id"] == inbound_b_id), {"capacity": 8})
        curr_buf_cap = target_b.get("capacity", 8)

        candidates = []

        # 1. Increase Capacity / Add Parallel Machine
        candidates.append({
            "id": f"intervention_cap_{m_id}",
            "name": f"Add Parallel Unit to {m_id}",
            "description": f"Increase {m_id} capacity from {curr_cap} to {curr_cap + 1} parallel unit(s).",
            "modified_machines": [
                {"id": m_id, "capacity": curr_cap + 1}
            ],
            "modified_buffers": [],
            "rationale": "Doubles stage processing capability to eliminate queue accumulation."
        })

        # 2. Reduce Processing Time (Tooling / Speedup)
        reduced_proc = round(max(1.0, curr_proc * 0.75), 2)
        candidates.append({
            "id": f"intervention_speed_{m_id}",
            "name": f"Reduce {m_id} Processing Time",
            "description": f"Reduce {m_id} cycle time from {curr_proc}m to {reduced_proc}m (-25%).",
            "modified_machines": [
                {"id": m_id, "processing_time": reduced_proc}
            ],
            "modified_buffers": [],
            "rationale": "Speeds up cycle time to balance flow with upstream/downstream stages."
        })

        # 3. Increase Buffer Capacity
        expanded_buf_cap = curr_buf_cap * 2
        candidates.append({
            "id": f"intervention_buf_{inbound_b_id}",
            "name": f"Expand Buffer {inbound_b_id} Capacity",
            "description": f"Increase inbound buffer {inbound_b_id} capacity from {curr_buf_cap} to {expanded_buf_cap} units.",
            "modified_machines": [],
            "modified_buffers": [
                {"id": inbound_b_id, "capacity": expanded_buf_cap}
            ],
            "rationale": "Buffers stochastic fluctuations to prevent upstream machine blocking."
        })

        # 4. Reduce Downtime (Preventive Maintenance)
        reduced_dt = round(max(5.0, curr_downtime * 0.4), 1)
        candidates.append({
            "id": f"intervention_maint_{m_id}",
            "name": f"Preventive Maintenance on {m_id}",
            "description": f"Reduce {m_id} mean downtime (MTTR) from {curr_downtime}m to {reduced_dt}m.",
            "modified_machines": [
                {"id": m_id, "downtime": reduced_dt, "availability": 98.0}
            ],
            "modified_buffers": [],
            "rationale": "Improves machine availability to reduce breakdown disruptions."
        })

        return candidates

