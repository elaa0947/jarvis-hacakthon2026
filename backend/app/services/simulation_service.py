"""
Simulation Service Layer.
Orchestrates loading factory configuration, running SimPy simulations,
caching run results, and serving analytics/propagation queries.
"""

import json
from pathlib import Path
from typing import Dict, Any, Optional
from app.simulation.engine import run_simulation
from app.analytics.bottleneck import BottleneckDetector
from app.analytics.propagation import PropagationAnalyzer
from app.analytics.kpis import KPIAnalyticsCalculator

CONFIG_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "factory_config.json"

# In-memory storage cache for simulation runs
_RUN_CACHE: Dict[str, Dict[str, Any]] = {}
_ACTIVE_FACTORY_CONFIG: Optional[Dict[str, Any]] = None

def get_active_factory_config() -> Dict[str, Any]:
    global _ACTIVE_FACTORY_CONFIG
    if _ACTIVE_FACTORY_CONFIG is None:
        if not CONFIG_PATH.exists():
            raise FileNotFoundError(f"Factory config not found at {CONFIG_PATH}")
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            _ACTIVE_FACTORY_CONFIG = json.load(f)
    return _ACTIVE_FACTORY_CONFIG

def set_active_factory_config(new_config: Dict[str, Any]):
    global _ACTIVE_FACTORY_CONFIG
    _ACTIVE_FACTORY_CONFIG = new_config

def execute_simulation(simulation_time: float = 480.0, seed: int = 42) -> Dict[str, Any]:
    config = get_active_factory_config()
    sim_output = run_simulation(config, simulation_time=simulation_time, seed=seed)
    
    # Run multi-metric bottleneck detection
    bottleneck_analysis = BottleneckDetector.detect_bottlenecks(sim_output)
    sim_output["bottleneck_analysis"] = bottleneck_analysis
    sim_output["primary_bottleneck"] = bottleneck_analysis["primary_bottleneck"]
    
    # Compute analytical KPIs
    kpis = KPIAnalyticsCalculator.compute_all_kpis(sim_output)
    sim_output["kpis"] = kpis

    # Cache run result
    run_id = sim_output["run_id"]
    _RUN_CACHE[run_id] = sim_output
    
    return sim_output

def get_bottleneck_analysis(run_id: str) -> Dict[str, Any]:
    if run_id not in _RUN_CACHE:
        # Fallback to fresh execution if run_id not cached
        res = execute_simulation()
        return res["bottleneck_analysis"]
    return _RUN_CACHE[run_id]["bottleneck_analysis"]

def get_propagation_analysis(run_id: str, disrupted_machine_id: str = "M3") -> Dict[str, Any]:
    config = get_active_factory_config()
    baseline_res = execute_simulation()
    
    # Disruption simulation (M3 slowdown)
    slowdown_scen = {"modified_machines": [{"id": disrupted_machine_id, "processing_time": 8.45}]}
    disrupted_res = run_simulation(config, scenario=slowdown_scen)
    
    return PropagationAnalyzer.analyze_propagation(baseline_res, disrupted_res, disrupted_machine_id=disrupted_machine_id)

