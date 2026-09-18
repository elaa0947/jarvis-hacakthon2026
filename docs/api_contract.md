# REST API Contract Documentation

Base URL: `http://localhost:8000/api`

## 1. Data Schemas

### MachineConfig
```json
{
  "id": "M1",
  "name": "Machine 1 - Raw Prep",
  "processing_time": 5.0,
  "capacity": 1,
  "availability": 95.0,
  "mtbf": 480.0,
  "mttr": 30.0,
  "buffer_capacity": 10
}
```

### ProductionLineConfig
```json
{
  "line_id": "baseline_line",
  "name": "5-Stage Assembly Line",
  "simulation_time": 480.0,
  "machines": [
    {"id": "M1", "name": "Raw Prep", "processing_time": 4.0, "capacity": 1, "availability": 98.0, "mtbf": 600, "mttr": 20, "buffer_capacity": 10},
    {"id": "M2", "name": "Machining", "processing_time": 6.0, "capacity": 1, "availability": 95.0, "mtbf": 450, "mttr": 30, "buffer_capacity": 10},
    {"id": "M3", "name": "Assembly", "processing_time": 8.5, "capacity": 1, "availability": 90.0, "mtbf": 300, "mttr": 45, "buffer_capacity": 5},
    {"id": "M4", "name": "Quality Inspection", "processing_time": 5.0, "capacity": 1, "availability": 97.0, "mtbf": 500, "mttr": 25, "buffer_capacity": 10},
    {"id": "M5", "name": "Packaging", "processing_time": 4.5, "capacity": 1, "availability": 99.0, "mtbf": 800, "mttr": 15, "buffer_capacity": 15}
  ]
}
```

### MachineMetrics
```json
{
  "machine_id": "M3",
  "utilization": 92.5,
  "throughput": 52,
  "avg_wip": 4.2,
  "avg_queue_length": 3.8,
  "blocking_time_pct": 2.1,
  "starvation_time_pct": 1.4,
  "downtime_pct": 8.2,
  "bottleneck_score": 0.88
}
```

---

## 2. API Endpoints

### 2.1 Get Baseline Configuration
Returns the standard 5-stage line configuration.

- **URL**: `/config/baseline`
- **Method**: `GET`
- **Response**: `200 OK` (ProductionLineConfig)

---

### 2.2 Run Baseline Simulation
Executes the SimPy discrete event simulation for the current baseline config.

- **URL**: `/simulation/run`
- **Method**: `POST`
- **Request Body** (optional overrides):
```json
{
  "simulation_time": 480.0,
  "seed": 42
}
```
- **Response**: `200 OK`
```json
{
  "simulation_id": "sim_base_001",
  "duration": 480.0,
  "total_throughput": 52,
  "avg_line_wip": 12.4,
  "machine_metrics": {
    "M1": { "utilization": 45.0, "blocking_time_pct": 12.0, "starvation_time_pct": 0.0, "bottleneck_score": 0.25 },
    "M2": { "utilization": 68.0, "blocking_time_pct": 25.0, "starvation_time_pct": 5.0, "bottleneck_score": 0.55 },
    "M3": { "utilization": 94.0, "blocking_time_pct": 0.0, "starvation_time_pct": 1.0, "bottleneck_score": 0.92 },
    "M4": { "utilization": 55.0, "blocking_time_pct": 0.0, "starvation_time_pct": 40.0, "bottleneck_score": 0.30 },
    "M5": { "utilization": 48.0, "blocking_time_pct": 0.0, "starvation_time_pct": 48.0, "bottleneck_score": 0.20 }
  },
  "primary_bottleneck": "M3",
  "secondary_bottleneck": "M2"
}
```

---

### 2.3 Analyze Bottlenecks & Event Propagation
Analyzes multi-metric bottleneck causes and event propagation timeline.

- **URL**: `/bottlenecks/analyze`
- **Method**: `POST`
- **Request Body**:
```json
{
  "simulation_id": "sim_base_001"
}
```
- **Response**: `200 OK`
```json
{
  "primary_bottleneck": {
    "machine_id": "M3",
    "score": 0.92,
    "primary_factor": "Processing Capacity Limit",
    "metrics_breakdown": {
      "utilization": 94.0,
      "upstream_blocking_caused": 25.0,
      "downstream_starvation_caused": 40.0,
      "queue_accumulation": 4.8
    }
  },
  "propagation_events": [
    {
      "timestamp": 120.0,
      "source_machine": "M3",
      "event_type": "breakdown",
      "impacted_machines": ["M2", "M1"],
      "direction": "upstream",
      "description": "M3 failure caused B2 to fill, blocking M2 at t=125 and M1 at t=140."
    },
    {
      "timestamp": 120.0,
      "source_machine": "M3",
      "event_type": "breakdown",
      "impacted_machines": ["M4", "M5"],
      "direction": "downstream",
      "description": "M3 failure depleted B3, starving M4 at t=126 and M5 at t=131."
    }
  ]
}
```

---

### 2.4 Run What-If Scenario
Executes simulation for a modified scenario without mutating baseline.

- **URL**: `/scenarios/run`
- **Method**: `POST`
- **Request Body**:
```json
{
  "scenario_name": "Expand M3 Capacity & Speed",
  "description": "Increase M3 capacity from 1 to 2 units and reduce processing time to 6.0 min.",
  "modified_machines": [
    {
      "id": "M3",
      "capacity": 2,
      "processing_time": 6.0
    }
  ]
}
```
- **Response**: `200 OK` (ScenarioResult with scenario_id, new metrics, new bottleneck)

---

### 2.5 Compare Scenarios
Compares baseline vs one or more scenario results.

- **URL**: `/scenarios/compare`
- **Method**: `POST`
- **Request Body**:
```json
{
  "baseline_sim_id": "sim_base_001",
  "scenario_sim_ids": ["sim_scen_101"]
}
```
- **Response**: `200 OK`
```json
{
  "comparisons": [
    {
      "scenario_id": "sim_scen_101",
      "scenario_name": "Expand M3 Capacity & Speed",
      "throughput_delta": "+18 units (+34.6%)",
      "wip_delta": "-3.8 units (-30.6%)",
      "bottleneck_shift": "Shifted from M3 to M2",
      "recommendation": "Highly recommended: Eliminates M3 constraint and increases total output significantly."
    }
  ]
}
```

---

### 2.6 Apply Scenario (Human Decision)
Commits chosen scenario configuration as the new baseline and triggers baseline update.

- **URL**: `/decide/apply`
- **Method**: `POST`
- **Request Body**:
```json
{
  "scenario_id": "sim_scen_101"
}
```
- **Response**: `200 OK` (Updated ProductionLineConfig & new SimulationResult)

