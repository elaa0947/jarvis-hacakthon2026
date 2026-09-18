"""
What-If Scenario Engine.
Manages isolated virtual intervention testing and human-in-the-loop scenario application.
Workflow: Apply Scenario -> update digital model -> create new baseline -> re-simulate -> recalculate KPIs -> re-run bottleneck detection.
"""

import copy
from typing import Dict, Any, List, Optional
from app.simulation.engine import run_simulation
from app.analytics.bottleneck import BottleneckDetector
from app.analytics.propagation import PropagationAnalyzer
from app.analytics.kpis import KPIAnalyticsCalculator

class ScenarioEngine:
    """
    Scenario Engine supporting isolated what-if simulation and baseline application.
    """

    def __init__(self, baseline_config: Dict[str, Any]):
        self._baseline_config = copy.deepcopy(baseline_config)

    def get_baseline_config(self) -> Dict[str, Any]:
        return copy.deepcopy(self._baseline_config)

    def run_scenario(
        self,
        scenario_name: str,
        modified_machines: Optional[List[Dict[str, Any]]] = None,
        modified_buffers: Optional[List[Dict[str, Any]]] = None,
        simulation_time: float = 480.0,
        seed: int = 42
    ) -> Dict[str, Any]:
        """
        Runs isolated what-if simulation without mutating baseline.
        """
        cloned_config = copy.deepcopy(self._baseline_config)

        if modified_machines:
            m_map = {m["id"]: m for m in cloned_config.get("machines", [])}
            for mod in modified_machines:
                m_id = mod.get("id")
                if m_id in m_map:
                    target = m_map[m_id]
                    if "processing_time" in mod and mod["processing_time"] is not None:
                        target["processing_time"] = mod["processing_time"]
                    if "capacity" in mod and mod["capacity"] is not None:
                        target["capacity"] = mod["capacity"]
                    if "downtime" in mod and mod["downtime"] is not None:
                        target["downtime"] = mod["downtime"]
                    if "availability" in mod and mod["availability"] is not None:
                        target["availability"] = mod["availability"]

        if modified_buffers:
            b_map = {b["id"]: b for b in cloned_config.get("buffers", [])}
            for mod in modified_buffers:
                b_id = mod.get("id")
                if b_id in b_map:
                    target = b_map[b_id]
                    if "capacity" in mod and mod["capacity"] is not None:
                        target["capacity"] = mod["capacity"]

        baseline_sim = run_simulation(self._baseline_config, simulation_time=simulation_time, seed=seed)
        scenario_sim = run_simulation(cloned_config, simulation_time=simulation_time, seed=seed)
        bottleneck_analysis = BottleneckDetector.detect_bottlenecks(scenario_sim)
        
        disrupted_m_id = modified_machines[0]["id"] if modified_machines else "M3"
        propagation = PropagationAnalyzer.analyze_propagation(baseline_sim, scenario_sim, disrupted_machine_id=disrupted_m_id)

        scenario_id = f"scen_{scenario_name.lower().replace(' ', '_')}_{seed}"

        return {
            "scenario_id": scenario_id,
            "scenario_name": scenario_name,
            "modified_machines": modified_machines or [],
            "modified_buffers": modified_buffers or [],
            "simulation_result": scenario_sim,
            "bottleneck_analysis": bottleneck_analysis,
            "propagation_analysis": propagation
        }

    def apply_scenario(
        self,
        modified_machines: Optional[List[Dict[str, Any]]] = None,
        modified_buffers: Optional[List[Dict[str, Any]]] = None,
        simulation_time: float = 480.0,
        seed: int = 42
    ) -> Dict[str, Any]:
        """
        Human Decision Application Workflow:
        Apply Scenario -> update digital model -> create new baseline -> re-simulate -> recalculate KPIs -> re-run bottleneck detection.
        """
        previous_baseline = copy.deepcopy(self._baseline_config)
        previous_sim = run_simulation(previous_baseline, simulation_time=simulation_time, seed=seed)
        previous_bm = BottleneckDetector.detect_bottlenecks(previous_sim)

        # 1. Update digital model (mutate internal baseline state)
        if modified_machines:
            m_map = {m["id"]: m for m in self._baseline_config.get("machines", [])}
            for mod in modified_machines:
                m_id = mod.get("id")
                if m_id in m_map:
                    target = m_map[m_id]
                    if "processing_time" in mod and mod["processing_time"] is not None:
                        target["processing_time"] = mod["processing_time"]
                    if "capacity" in mod and mod["capacity"] is not None:
                        target["capacity"] = mod["capacity"]
                    if "downtime" in mod and mod["downtime"] is not None:
                        target["downtime"] = mod["downtime"]
                    if "availability" in mod and mod["availability"] is not None:
                        target["availability"] = mod["availability"]

        if modified_buffers:
            b_map = {b["id"]: b for b in self._baseline_config.get("buffers", [])}
            for mod in modified_buffers:
                b_id = mod.get("id")
                if b_id in b_map:
                    target = b_map[b_id]
                    if "capacity" in mod and mod["capacity"] is not None:
                        target["capacity"] = mod["capacity"]

        # 2. Re-simulate with new baseline
        new_sim_result = run_simulation(self._baseline_config, simulation_time=simulation_time, seed=seed)

        # 3. Recalculate KPIs
        recalculated_kpis = KPIAnalyticsCalculator.compute_all_kpis(new_sim_result)

        # 4. Re-run multi-metric bottleneck detection dynamically
        new_bottleneck_analysis = BottleneckDetector.detect_bottlenecks(new_sim_result)

        new_primary = new_bottleneck_analysis["primary_bottleneck"]
        old_primary = previous_bm["primary_bottleneck"]

        migration_occurred = (new_primary != old_primary)
        migration_text = (
            f"Bottleneck migrated from {old_primary} to {new_primary}."
            if migration_occurred
            else f"Primary bottleneck remains {new_primary}."
        )

        return {
            "status": "applied",
            "previous_bottleneck": old_primary,
            "new_bottleneck": new_primary,
            "migration_occurred": migration_occurred,
            "migration_summary": migration_text,
            "updated_factory_config": copy.deepcopy(self._baseline_config),
            "new_simulation_result": new_sim_result,
            "recalculated_kpis": recalculated_kpis,
            "new_bottleneck_analysis": new_bottleneck_analysis
        }
