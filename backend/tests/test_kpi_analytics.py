import json
from pathlib import Path
import pytest
from app.simulation.engine import run_simulation
from app.analytics.kpis import KPIAnalyticsCalculator

CONFIG_PATH = Path(__file__).resolve().parent.parent / "data" / "factory_config.json"

@pytest.fixture
def simulation_output():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        cfg = json.load(f)
    return run_simulation(cfg, simulation_time=480.0, seed=42)

def test_kpi_throughput(simulation_output):
    """Test throughput calculation from simulation event trace."""
    events = simulation_output["events"]
    throughput = KPIAnalyticsCalculator.calculate_throughput(events)
    assert throughput == simulation_output["throughput"]
    assert throughput > 0

def test_kpi_wip(simulation_output):
    """Test WIP calculation."""
    events = simulation_output["events"]
    wip = KPIAnalyticsCalculator.calculate_wip(events, 480.0)
    assert wip >= 0

def test_kpi_machine_utilization(simulation_output):
    """Test machine utilization calculation for M3."""
    events = simulation_output["events"]
    util = KPIAnalyticsCalculator.calculate_machine_utilization(events, "M3", 480.0)
    assert util >= 0.0 and util <= 100.0

def test_kpi_queue_length(simulation_output):
    """Test queue length calculation."""
    events = simulation_output["events"]
    q_len = KPIAnalyticsCalculator.calculate_queue_length(events, "M3")
    assert q_len >= 0.0

def test_kpi_average_waiting_time(simulation_output):
    """Test average waiting time calculation."""
    events = simulation_output["events"]
    avg_wait = KPIAnalyticsCalculator.calculate_average_waiting_time(events, "M3")
    assert avg_wait >= 0.0

def test_kpi_blocking_time(simulation_output):
    """Test machine blocking time calculation."""
    events = simulation_output["events"]
    block_t = KPIAnalyticsCalculator.calculate_blocking_time(events, "M2", 480.0)
    assert block_t >= 0.0 and block_t <= 100.0

def test_kpi_starvation_time(simulation_output):
    """Test machine starvation time calculation."""
    events = simulation_output["events"]
    starve_t = KPIAnalyticsCalculator.calculate_starvation_time(events, "M4", 480.0)
    assert starve_t >= 0.0 and starve_t <= 100.0

def test_kpi_downtime(simulation_output):
    """Test machine downtime calculation."""
    events = simulation_output["events"]
    down_t = KPIAnalyticsCalculator.calculate_downtime(events, "M3", 480.0)
    assert down_t >= 0.0 and down_t <= 100.0

def test_compute_all_kpis(simulation_output):
    """Test compute_all_kpis aggregator."""
    summary = KPIAnalyticsCalculator.compute_all_kpis(simulation_output)
    assert "throughput" in summary
    assert "wip" in summary
    assert "machines" in summary
    assert len(summary["machines"]) == 5
    for m_id in ["M1", "M2", "M3", "M4", "M5"]:
        assert m_id in summary["machines"]
        m_kpi = summary["machines"][m_id]
        assert "utilization" in m_kpi
        assert "blocking_time" in m_kpi
        assert "starvation_time" in m_kpi

