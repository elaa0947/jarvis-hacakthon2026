"""
Master Test Suite Runner.
Runs all backend unit tests, API tests, simulation regression tests, and the Critical Acceptance Test.
"""

import sys
import json
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.simulation.engine import run_simulation
from app.analytics.bottleneck import BottleneckDetector
from app.analytics.propagation import PropagationAnalyzer
from app.analytics.kpis import KPIAnalyticsCalculator
from app.scenarios.manager import ScenarioEngine
from app.scenarios.comparison import ScenarioComparator
from app.scenarios.interventions import InterventionGenerator

import tests.test_domain as test_domain
import tests.test_simulation_engine as test_sim
import tests.test_baseline as test_base
import tests.test_kpi_analytics as test_kpi
import tests.test_bottleneck_detection as test_bm
import tests.test_propagation as test_prop
import tests.test_scenario_engine as test_scen
import tests.test_interventions as test_interv
import tests.test_scenario_comparison as test_comp
import tests.test_apply_scenario as test_apply
import tests.test_api_integration as test_api
import tests.test_error_handling as test_err

def run_all_validation_tests():
    print("=" * 70)
    print("RUNNING MASTER BACKEND & SIMULATION TEST SUITE")
    print("=" * 70)

    cfg_path = backend_dir / "data" / "factory_config.json"
    with open(cfg_path, "r", encoding="utf-8") as f:
        config = json.load(f)

    # 1. Domain Tests
    test_domain.test_load_factory_config()
    test_domain.test_machine_schema()
    test_domain.test_buffer_schema()
    test_domain.test_job_schema()
    print("[OK] 1. Domain Model Schemas: PASSED")

    # 2. Simulation Engine Tests
    test_sim.test_jobs_enter_system(config)
    test_sim.test_jobs_move_through_machines(config)
    test_sim.test_jobs_complete(config)
    test_sim.test_throughput_generated(config)
    test_sim.test_queues_can_form(config)
    print("[OK] 2. SimPy Simulation Engine Core: PASSED")

    # 3. Baseline Tests
    test_base.test_baseline_m3_primary_bottleneck(config)
    test_base.test_baseline_produced_metrics(config)
    test_base.test_baseline_repeatability(config)
    print("[OK] 3. Baseline Metrics & Repeatability: PASSED")

    # 4. KPI Analytics Tests
    sim_output = run_simulation(config, simulation_time=480.0, seed=42)
    test_kpi.test_kpi_throughput(sim_output)
    test_kpi.test_kpi_wip(sim_output)
    test_kpi.test_kpi_machine_utilization(sim_output)
    test_kpi.test_kpi_queue_length(sim_output)
    test_kpi.test_kpi_average_waiting_time(sim_output)
    test_kpi.test_kpi_blocking_time(sim_output)
    test_kpi.test_kpi_starvation_time(sim_output)
    test_kpi.test_kpi_downtime(sim_output)
    test_kpi.test_compute_all_kpis(sim_output)
    print("[OK] 4. KPI Analytics Calculator: PASSED")

    # 5. Bottleneck Intelligence Tests
    test_bm.test_m3_detected_in_baseline(config)
    test_bm.test_changing_conditions_changes_bottleneck(config)
    test_bm.test_intervention_shifts_bottleneck(config)
    print("[OK] 5. Multi-Metric Bottleneck Intelligence: PASSED")

    # 6. Propagation Analysis Tests
    test_prop.test_m3_slowdown_propagation(config)
    print("[OK] 6. Disruption Event Propagation Analysis: PASSED")

    # 7. Scenario Engine Tests
    test_scen.test_immutability_baseline_unmodified(config)
    test_scen.test_processing_time_scenario(config)
    test_scen.test_capacity_change_scenario(config)
    test_scen.test_downtime_change_scenario(config)
    test_scen.test_buffer_capacity_change_scenario(config)
    print("[OK] 7. What-If Scenario Engine & Immutability: PASSED")

    # 8. Intervention Generator Tests
    test_interv.test_generate_interventions_for_m3(config)
    test_interv.test_interventions_executable_in_simulation(config)
    print("[OK] 8. Deterministic Intervention Generator: PASSED")

    # 9. Scenario Comparison Matrix Tests
    test_comp.test_compare_exact_phase_10_scenarios(config)
    test_comp.test_trade_offs_are_explainable_and_different(config)
    print("[OK] 9. Scenario Comparison Matrix: PASSED")

    # 10. Human Decision Apply Scenario Tests
    test_apply.test_apply_scenario_workflow(config)
    test_apply.test_bottleneck_migration_dynamically_computed(config)
    print("[OK] 10. Human Decision Apply & Re-Simulation: PASSED")

    # 11. API Integration Tests
    test_api.test_api_health()
    test_api.test_api_factory()
    test_api.test_api_simulation_run_end_to_end()
    test_api.test_api_scenario_run()
    test_api.test_api_bottleneck_analysis()
    test_api.test_api_propagation_analysis()
    test_api.test_api_scenarios_compare()
    test_api.test_api_scenarios_apply_end_to_end()
    print("[OK] 11. End-to-End FastAPI REST Router: PASSED")

    # 12. Error Handling Tests
    test_err.test_invalid_simulation_time_400()
    test_err.test_empty_scenario_name_400()
    test_err.test_route_not_found_404()
    test_err.test_successful_simulation_response()
    print("[OK] 12. API Error Handling & Validation: PASSED")

    print("=" * 70)
    print("CRITICAL ACCEPTANCE TEST EXECUTION")
    print("=" * 70)

    # Critical Acceptance Test Flow
    # Step A: Baseline -> M3 Bottleneck
    engine = ScenarioEngine(config)
    base_res = run_simulation(config, simulation_time=480.0, seed=42)
    base_bm = BottleneckDetector.detect_bottlenecks(base_res)
    assert base_bm["primary_bottleneck"] == "M3"
    print(f"Step A Passed: Baseline Primary Bottleneck = {base_bm['primary_bottleneck']} (Throughput: {base_res['throughput']} units)")

    # Step B: M3 Slowdown -> Throughput Decreases
    slowdown_res = engine.run_scenario("M3 Slowdown", modified_machines=[{"id": "M3", "processing_time": 8.45}])
    scen_tp = slowdown_res["simulation_result"]["throughput"]
    assert scen_tp < base_res["throughput"]
    print(f"Step B Passed: M3 Slowdown Throughput Decreased ({base_res['throughput']} -> {scen_tp} units)")

    # Step C & D: Intervention (M3 Improves) -> Re-analysis -> New Bottleneck Detected
    apply_res = engine.apply_scenario(modified_machines=[{"id": "M3", "processing_time": 3.5}])
    new_bm = apply_res["new_bottleneck"]
    assert new_bm != "M3"
    assert apply_res["migration_occurred"] is True
    print(f"Step C & D Passed: M3 Improved -> Dynamic Bottleneck Migration (New Bottleneck: {new_bm}, New Throughput: {apply_res['recalculated_kpis']['throughput']} units)")

    print("=" * 70)
    print("ALL PROJECT VALIDATION & CRITICAL ACCEPTANCE TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_all_validation_tests()

