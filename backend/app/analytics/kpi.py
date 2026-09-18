"""
KPI Aggregator Module.
Calculates summary line metrics: throughput, total WIP, lead time, machine-level state distribution.
"""

from typing import Dict, Any

def compute_line_kpis(raw_stats: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "throughput": raw_stats.get("total_throughput", 0),
        "avg_wip": raw_stats.get("avg_line_wip", 0.0),
        "overall_utilization": raw_stats.get("overall_utilization", 0.0)
    }

