import json
from pathlib import Path
import pytest
from app.schemas.domain import MachineSchema, BufferSchema, JobSchema, ProductionConfigSchema

CONFIG_PATH = Path(__file__).resolve().parent.parent / "data" / "factory_config.json"

def test_load_factory_config():
    assert CONFIG_PATH.exists()
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    config = ProductionConfigSchema(**data)
    assert config.factory_id == "factory_01"
    assert config.factory_name == "Precision Assembly Plant 1"
    assert config.line_sequence == ["M1", "B1", "M2", "B2", "M3", "B3", "M4", "B4", "M5"]
    assert len(config.machines) == 5
    assert len(config.buffers) == 4

def test_machine_schema():
    m = MachineSchema(
        id="M1",
        name="Raw Prep",
        processing_time=4.0,
        capacity=1,
        availability=98.0,
        downtime=20.0,
        status="IDLE",
        sequence=1
    )
    assert m.id == "M1"
    assert m.sequence == 1
    assert m.status == "IDLE"

def test_buffer_schema():
    b = BufferSchema(
        id="B1",
        capacity=10,
        current_wip=0,
        sequence=1
    )
    assert b.id == "B1"
    assert b.capacity == 10
    assert b.current_wip == 0

def test_job_schema():
    j = JobSchema(
        id="JOB_001",
        arrival_time=10.5,
        current_stage="M1"
    )
    assert j.id == "JOB_001"
    assert j.arrival_time == 10.5
    assert j.completion_time is None

