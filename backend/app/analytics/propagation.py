"""
Event Propagation Analysis Engine.
Traces causal disruption chains and state change propagation by comparing
baseline simulation metrics against scenario simulation metrics.
Purely data-driven with zero LLM dependence.
"""

from typing import Dict, Any, List

class PropagationAnalyzer:
    """
    Deterministic Propagation Engine.
    Analyzes how machine parameter disruptions propagate upstream (queueing, blocking)
    and downstream (starvation, throughput loss).
    """

    @staticmethod
    def analyze_propagation(
        baseline_res: Dict[str, Any],
        scenario_res: Dict[str, Any],
        disrupted_machine_id: str = "M3"
    ) -> Dict[str, Any]:
        base_tp = baseline_res.get("throughput", 1)
        scen_tp = scenario_res.get("throughput", 1)
        tp_delta_pct = round(((scen_tp - base_tp) / max(1, base_tp)) * 100.0, 1)

        base_m = baseline_res.get("machines", {}).get(disrupted_machine_id, {})
        scen_m = scenario_res.get("machines", {}).get(disrupted_machine_id, {})

        # Find preceding buffer & upstream machine
        ordered_m = ["M1", "M2", "M3", "M4", "M5"]
        m_idx = ordered_m.index(disrupted_machine_id) if disrupted_machine_id in ordered_m else 2
        upstream_m_id = ordered_m[m_idx - 1] if m_idx > 0 else None
        downstream_m_id = ordered_m[m_idx + 1] if m_idx < len(ordered_m) - 1 else None
        inbound_b_id = f"B{m_idx}" if m_idx > 0 else "B1"

        base_b = baseline_res.get("buffers", {}).get(inbound_b_id, {})
        scen_b = scenario_res.get("buffers", {}).get(inbound_b_id, {})

        base_up_m = baseline_res.get("machines", {}).get(upstream_m_id, {}) if upstream_m_id else {}
        scen_up_m = scenario_res.get("machines", {}).get(upstream_m_id, {}) if upstream_m_id else {}

        base_down_m = baseline_res.get("machines", {}).get(downstream_m_id, {}) if downstream_m_id else {}
        scen_down_m = scenario_res.get("machines", {}).get(downstream_m_id, {}) if downstream_m_id else {}

        steps = []
        step_num = 1

        # Step 1: Disruption at Target Machine
        steps.append({
            "step": step_num,
            "stage": disrupted_machine_id,
            "effect": f"{disrupted_machine_id} processing time increased",
            "metric_change": f"Utilization: {base_m.get('utilization', 0.0)}% -> {scen_m.get('utilization', 0.0)}%"
        })
        step_num += 1

        # Step 2: Capacity Reduction
        steps.append({
            "step": step_num,
            "stage": disrupted_machine_id,
            "effect": f"{disrupted_machine_id} effective processing rate decreased",
            "metric_change": f"Stage BSI score: {base_m.get('bottleneck_score', 0.0)} -> {scen_m.get('bottleneck_score', 0.0)}"
        })
        step_num += 1

        # Step 3: Buffer Queue Accumulation (B2)
        b_base_q = base_b.get("avg_wip", 0.0)
        b_scen_q = scen_b.get("avg_wip", 0.0)
        q_delta = round(b_scen_q - b_base_q, 2)
        steps.append({
            "step": step_num,
            "stage": inbound_b_id,
            "effect": f"Inbound buffer {inbound_b_id} queue accumulated",
            "metric_change": f"Average queue length: {b_base_q} -> {b_scen_q} ({'+' if q_delta>=0 else ''}{q_delta} units)"
        })
        step_num += 1

        # Step 4: Upstream Blocking Increase (M2)
        if upstream_m_id:
            up_base_blk = base_up_m.get("blocking_time", 0.0)
            up_scen_blk = scen_up_m.get("blocking_time", 0.0)
            blk_delta = round(up_scen_blk - up_base_blk, 1)
            steps.append({
                "step": step_num,
                "stage": upstream_m_id,
                "effect": f"Upstream machine {upstream_m_id} blocking increased",
                "metric_change": f"Blocking time: {up_base_blk}% -> {up_scen_blk}% ({'+' if blk_delta>=0 else ''}{blk_delta}%)"
            })
            step_num += 1

        # Step 5: Downstream Starvation Increase (M4) if applicable
        if downstream_m_id:
            down_base_stv = base_down_m.get("starvation_time", 0.0)
            down_scen_stv = scen_down_m.get("starvation_time", 0.0)
            stv_delta = round(down_scen_stv - down_base_stv, 1)
            steps.append({
                "step": step_num,
                "stage": downstream_m_id,
                "effect": f"Downstream machine {downstream_m_id} starvation increased",
                "metric_change": f"Starvation time: {down_base_stv}% -> {down_scen_stv}% ({'+' if stv_delta>=0 else ''}{stv_delta}%)"
            })
            step_num += 1

        # Step 6: Throughput Impact
        steps.append({
            "step": step_num,
            "stage": "FACTORY_LINE",
            "effect": "Overall factory line throughput decreased",
            "metric_change": f"Throughput: {base_tp} -> {scen_tp} units ({tp_delta_pct}%)"
        })

        summary_text = (
            f"Disruption at {disrupted_machine_id} caused inbound buffer {inbound_b_id} queue to build up "
            f"to {b_scen_q} units, increasing upstream {upstream_m_id} blocking to {scen_up_m.get('blocking_time', 0.0)}%, "
            f"resulting in a net throughput change of {tp_delta_pct}%."
        )

        return {
            "disrupted_machine": disrupted_machine_id,
            "baseline_throughput": base_tp,
            "scenario_throughput": scen_tp,
            "throughput_delta_pct": tp_delta_pct,
            "propagation_chain": steps,
            "summary": summary_text
        }
