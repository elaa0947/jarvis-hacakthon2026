"""
Bottleneck Detection Intelligence Engine.
Uses a transparent, deterministic multi-metric evaluation considering:
- utilization
- queue buildup
- upstream blocking caused
- downstream starvation caused
- throughput contribution ratio

Identifies primary & secondary bottlenecks without relying on utilization alone or machine learning.
"""

from typing import Dict, Any, List

class BottleneckDetector:
    """
    Multi-Metric Bottleneck Intelligence Detector.
    Determines Bottleneck Severity Index (BSI) and structured rationale.
    """

    @staticmethod
    def detect_bottlenecks(simulation_output: Dict[str, Any]) -> Dict[str, Any]:
        machines_data = simulation_output.get("machines", {})
        total_line_throughput = max(1, simulation_output.get("throughput", 1))
        ordered_ids = ["M1", "M2", "M3", "M4", "M5"]

        evaluated_machines = []

        for idx, m_id in enumerate(ordered_ids):
            m_info = machines_data.get(m_id, {})
            util = m_info.get("utilization", 0.0) / 100.0
            q_len = m_info.get("queue_length", 0.0)
            
            # 1. Upstream Blocking Caused: % time preceding machine spent blocked by this stage
            upstream_blocking_caused = 0.0
            if idx > 0:
                prev_id = ordered_ids[idx - 1]
                upstream_blocking_caused = machines_data.get(prev_id, {}).get("blocking_time", 0.0)

            # 2. Downstream Starvation Caused: % time succeeding machine spent starved by this stage
            downstream_starvation_caused = 0.0
            if idx < len(ordered_ids) - 1:
                next_id = ordered_ids[idx + 1]
                downstream_starvation_caused = machines_data.get(next_id, {}).get("starvation_time", 0.0)

            # 3. Queue buildup ratio
            queue_ratio = min(1.0, q_len / 8.0)

            # 4. Throughput contribution ratio
            completed = m_info.get("completed_jobs", total_line_throughput)
            tp_ratio = min(1.0, completed / total_line_throughput)

            # Bottleneck Severity Index (BSI) Formula
            # BSI = 0.35*utilization + 0.30*(upstream_blocking/100) + 0.25*(downstream_starvation/100) + 0.10*queue_ratio
            bsi = (0.35 * util) + (0.30 * (upstream_blocking_caused / 100.0)) + (0.25 * (downstream_starvation_caused / 100.0)) + (0.10 * queue_ratio)
            bsi = round(bsi, 3)

            evaluated_machines.append({
                "machine_id": m_id,
                "name": m_info.get("name", m_id),
                "bottleneck_score": bsi,
                "utilization": round(util * 100.0, 1),
                "queue_length": q_len,
                "upstream_blocking_caused": upstream_blocking_caused,
                "downstream_starvation_caused": downstream_starvation_caused,
                "throughput_contribution": round(tp_ratio, 2)
            })

        # Sort by BSI score descending
        evaluated_machines.sort(key=lambda x: x["bottleneck_score"], reverse=True)

        primary_bm = evaluated_machines[0]
        secondary_bm = evaluated_machines[1] if len(evaluated_machines) > 1 else None

        # Build human-readable transparent reasons
        for i, item in enumerate(evaluated_machines):
            if i == 0:
                item["bottleneck_status"] = "PRIMARY_BOTTLENECK"
                item["reason"] = (
                    f"{item['name']} ({item['machine_id']}) is the primary constraint. "
                    f"High utilization ({item['utilization']}%) combined with causing "
                    f"{item['upstream_blocking_caused']}% upstream blocking and "
                    f"{item['downstream_starvation_caused']}% downstream starvation."
                )
            elif i == 1 and item["bottleneck_score"] > 0.3:
                item["bottleneck_status"] = "SECONDARY_BOTTLENECK"
                item["reason"] = (
                    f"{item['name']} ({item['machine_id']}) is a secondary constraint "
                    f"with BSI score of {item['bottleneck_score']}."
                )
            else:
                item["bottleneck_status"] = "NON_BOTTLENECK"
                item["reason"] = f"Flow is not constrained by {item['name']} ({item['machine_id']})."

        return {
            "primary_bottleneck": primary_bm["machine_id"],
            "primary_bottleneck_score": primary_bm["bottleneck_score"],
            "primary_reason": primary_bm["reason"],
            "secondary_bottleneck": secondary_bm["machine_id"] if secondary_bm else None,
            "analysis_breakdown": {m["machine_id"]: m for m in evaluated_machines}
        }
