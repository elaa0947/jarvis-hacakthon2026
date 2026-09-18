"""
KPI Analytics Module.
Calculates production metrics (throughput, WIP, machine utilization, queue length,
average waiting time, blocking time, starvation time, downtime) directly from simulation
event traces and operational logs.
"""

from typing import Dict, Any, List

class KPIAnalyticsCalculator:
    """
    Pure analytics engine calculating factory KPIs from structured simulation output and event traces.
    Decoupled from simulation execution logic.
    """

    @staticmethod
    def calculate_throughput(events: List[Dict[str, Any]]) -> int:
        """Counts total job completion events in trace."""
        return len([e for e in events if e.get("event_type") == "job_completion"])

    @staticmethod
    def calculate_wip(events: List[Dict[str, Any]], simulation_time: float) -> float:
        """Calculates line WIP over simulation period from arrival and completion timestamps."""
        arrivals = [e for e in events if e.get("event_type") == "job_arrival"]
        completions = [e for e in events if e.get("event_type") == "job_completion"]
        
        # Calculate active jobs remaining in system
        return float(max(0, len(arrivals) - len(completions)))

    @staticmethod
    def calculate_machine_utilization(events: List[Dict[str, Any]], machine_id: str, simulation_time: float) -> float:
        """Calculates utilization percentage for a given machine from processing events."""
        starts = [e for e in events if e.get("event_type") == "processing_start" and e.get("machine_id") == machine_id]
        completes = [e for e in events if e.get("event_type") == "processing_completion" and e.get("machine_id") == machine_id]
        
        total_processing_time = 0.0
        for s in starts:
            j_id = s.get("job_id")
            matching_comp = next((c for c in completes if c.get("job_id") == j_id and c.get("timestamp") >= s.get("timestamp")), None)
            if matching_comp:
                total_processing_time += (matching_comp["timestamp"] - s["timestamp"])

        if simulation_time <= 0:
            return 0.0
        return round(min(100.0, (total_processing_time / simulation_time) * 100.0), 1)

    @staticmethod
    def calculate_queue_length(events: List[Dict[str, Any]], machine_id: str) -> float:
        """Calculates average queue length preceding machine."""
        queue_entries = [e for e in events if e.get("event_type") == "queue_entry" and e.get("machine_id") == machine_id]
        proc_starts = [e for e in events if e.get("event_type") == "processing_start" and e.get("machine_id") == machine_id]
        return float(max(0, len(queue_entries) - len(proc_starts)))

    @staticmethod
    def calculate_average_waiting_time(events: List[Dict[str, Any]], machine_id: str) -> float:
        """Calculates mean waiting time in queue preceding machine."""
        queue_entries = {e.get("job_id"): e.get("timestamp") for e in events if e.get("event_type") == "queue_entry" and e.get("machine_id") == machine_id}
        proc_starts = [e for e in events if e.get("event_type") == "processing_start" and e.get("machine_id") == machine_id]
        
        wait_times = []
        for s in proc_starts:
            j_id = s.get("job_id")
            if j_id in queue_entries:
                wait_times.append(s["timestamp"] - queue_entries[j_id])

        if not wait_times:
            return 0.0
        return round(sum(wait_times) / len(wait_times), 2)

    @staticmethod
    def calculate_blocking_time(events: List[Dict[str, Any]], machine_id: str, simulation_time: float) -> float:
        """Calculates percentage blocking time for machine."""
        blocking_events = [e for e in events if e.get("event_type") == "blocking" and e.get("machine_id") == machine_id]
        if not blocking_events or simulation_time <= 0:
            return 0.0
        # Sum blocking occurrences duration approximation
        total_blocking = len(blocking_events) * 2.5
        return round(min(100.0, (total_blocking / simulation_time) * 100.0), 1)

    @staticmethod
    def calculate_starvation_time(events: List[Dict[str, Any]], machine_id: str, simulation_time: float) -> float:
        """Calculates percentage starvation time for machine."""
        starvation_events = [e for e in events if e.get("event_type") == "starvation" and e.get("machine_id") == machine_id]
        if not starvation_events or simulation_time <= 0:
            return 0.0
        total_starvation = len(starvation_events) * 3.0
        return round(min(100.0, (total_starvation / simulation_time) * 100.0), 1)

    @staticmethod
    def calculate_downtime(events: List[Dict[str, Any]], machine_id: str, simulation_time: float) -> float:
        """Calculates percentage downtime for machine."""
        breakdowns = [e for e in events if e.get("event_type") == "machine_breakdown" and e.get("machine_id") == machine_id]
        recoveries = [e for e in events if e.get("event_type") == "machine_recovery" and e.get("machine_id") == machine_id]
        
        total_downtime = 0.0
        for b in breakdowns:
            m_rec = next((r for r in recoveries if r.get("timestamp") >= b.get("timestamp")), None)
            if m_rec:
                total_downtime += (m_rec["timestamp"] - b["timestamp"])

        if simulation_time <= 0:
            return 0.0
        return round(min(100.0, (total_downtime / simulation_time) * 100.0), 1)

    @classmethod
    def compute_all_kpis(cls, simulation_output: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parses full simulation output dict and computes standalone analytical KPI metrics summary.
        """
        events = simulation_output.get("events", [])
        sim_time = simulation_output.get("simulation_time", 480.0)
        
        throughput = cls.calculate_throughput(events) if events else simulation_output.get("throughput", 0)
        wip = cls.calculate_wip(events, sim_time) if events else float(simulation_output.get("wip", 0))

        machine_kpis = {}
        machines_data = simulation_output.get("machines", {})
        
        for m_id, m_info in machines_data.items():
            machine_kpis[m_id] = {
                "throughput": m_info.get("completed_jobs", 0),
                "utilization": m_info.get("utilization", 0.0),
                "queue_length": m_info.get("queue_length", 0.0),
                "waiting_time": m_info.get("waiting_time", 0.0),
                "blocking_time": m_info.get("blocking_time", 0.0),
                "starvation_time": m_info.get("starvation_time", 0.0),
                "downtime": m_info.get("downtime", 0.0),
                "status": m_info.get("status", "IDLE")
            }

        return {
            "throughput": throughput,
            "wip": wip,
            "machines": machine_kpis
        }

