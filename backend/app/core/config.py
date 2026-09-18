"""
Configuration definitions for default 5-stage manufacturing line (M1 -> M2 -> M3 -> M4 -> M5).
"""

DEFAULT_LINE_CONFIG = {
    "line_id": "baseline_line",
    "name": "5-Stage Assembly Line",
    "simulation_time": 480.0,  # 8 hours shift (in minutes)
    "machines": [
        {
            "id": "M1",
            "name": "Raw Material Prep",
            "processing_time": 4.0,
            "capacity": 1,
            "availability": 98.0,
            "mtbf": 600.0,
            "mttr": 20.0,
            "buffer_capacity": 10
        },
        {
            "id": "M2",
            "name": "CNC Machining",
            "processing_time": 6.0,
            "capacity": 1,
            "availability": 95.0,
            "mtbf": 450.0,
            "mttr": 30.0,
            "buffer_capacity": 10
        },
        {
            "id": "M3",
            "name": "Component Assembly",
            "processing_time": 8.5,
            "capacity": 1,
            "availability": 90.0,
            "mtbf": 300.0,
            "mttr": 45.0,
            "buffer_capacity": 5
        },
        {
            "id": "M4",
            "name": "Quality Inspection",
            "processing_time": 5.0,
            "capacity": 1,
            "availability": 97.0,
            "mtbf": 500.0,
            "mttr": 25.0,
            "buffer_capacity": 10
        },
        {
            "id": "M5",
            "name": "Packaging & Staging",
            "processing_time": 4.5,
            "capacity": 1,
            "availability": 99.0,
            "mtbf": 800.0,
            "mttr": 15.0,
            "buffer_capacity": 15
        }
    ]
}

