# REST API Contract Documentation

Base URL: `http://localhost:8000/api`

## Endpoints

### 1. Health Check
- **URL**: `/health`
- **Method**: `GET`
- **Response**: `200 OK`
```json
{
  "status": "ok"
}
```

### 2. Get Baseline Configuration
- **URL**: `/factory`
- **Method**: `GET`
- **Response**: `200 OK`
```json
{
  "factory_name": "Precision Assembly Plant 1",
  "sequence": ["M1", "B1", "M2", "B2", "M3", "B3", "M4", "B4", "M5"],
  "arrival_parameter": { "interarrival_mean": 4.0, "distribution": "exponential" },
  "machines": [...],
  "buffers": [...]
}
```

### 3. Run Baseline Simulation
- **URL**: `/simulation/run`
- **Method**: `POST`
- **Request Body**:
```json
{
  "simulation_time": 480.0,
  "seed": 42
}
```
- **Response**: `200 OK`
```json
{
  "run_id": "sim_42_480",
  "simulation_time": 480.0,
  "throughput": 96,
  "wip": 14.2,
  "machines": {
    "M1": { "utilization": 72.0, "queue": 2.1, "blocking_time": 15.4, "starvation_time": 0.0, "downtime": 12.0 },
    "M3": { "utilization": 94.0, "queue": 4.8, "blocking_time": 0.0, "starvation_time": 2.1, "downtime": 35.0 }
  },
  "primary_bottleneck": "M3",
  "events_count": 842
}
```

### 4. Run What-If Scenario
- **URL**: `/scenarios/run`
- **Method**: `POST`

### 5. Compare Scenarios
- **URL**: `/scenarios/compare`
- **Method**: `POST`

### 6. Apply Scenario (Human Decision)
- **URL**: `/scenarios/{scenario_id}/apply`
- **Method**: `POST`

