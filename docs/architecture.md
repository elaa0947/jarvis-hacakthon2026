# Architecture Documentation: Bottleneck-to-Decision Production Digital Twin

## 1. System Overview
The **Bottleneck-to-Decision Production Digital Twin** is a software system for modeling, analyzing, and optimizing a multi-stage discrete manufacturing process (**M1 → M2 → M3 → M4 → M5**). It combines a discrete event simulation engine (SimPy) with multi-metric bottleneck intelligence and propagation analysis, empowering human operators to run what-if scenarios and apply optimizations.

```
       +-------------------------------------------------------------+
       |                   React + TypeScript Frontend               |
       |  +--------------------+  +-------------------------------+  |
       |  | Visual Line Layout |  | Multi-Metric Bottleneck View  |  |
       |  +--------------------+  +-------------------------------+  |
       |  +--------------------+  +-------------------------------+  |
       |  | Propagation Graph  |  | Scenario Comparison & Apply   |  |
       |  +--------------------+  +-------------------------------+  |
       +------------------------------+------------------------------+
                                      | HTTP REST / JSON
       +------------------------------v------------------------------+
       |                     Python FastAPI Backend                  |
       |  +-------------------------------------------------------+  |
       |  |                    API Routes Layer                   |  |
       |  +---------------------------+---------------------------+  |
       |                              |                              |
       |  +---------------------------v---------------------------+  |
       |  |               SimPy Discrete Event Engine             |  |
       |  |   - Generates events, queues, state transitions       |  |
       |  +---------------------------+---------------------------+  |
       |                              |                              |
       |  +---------------------------v---------------------------+  |
       |  |                Analytics Engine                       |  |
       |  |   - Multi-Metric Bottleneck Detector                  |  |
       |  |   - Upstream/Downstream Propagation Analyzer          |  |
       |  |   - KPI Aggregator (Throughput, WIP, Utilization)     |  |
       |  +---------------------------+---------------------------+  |
       |                              |                              |
       |  +---------------------------v---------------------------+  |
       |  |             Scenario & Decision Manager               |  |
       |  |   - Immutable What-If Branching                        |  |
       |  |   - Scenario comparison & baseline re-simulation      |  |
       |  +-------------------------------------------------------+  |
       +-------------------------------------------------------------+
```

## 2. Core Operational Workflow

1. **Baseline Configuration**: System initializes with default manufacturing line model (M1..M5, buffers B1..B4).
2. **Discrete Event Simulation**: SimPy models entity movement, machine processing, stochastic breakdowns (MTBF/MTTR), buffer queue buildup, blocking, and starvation.
3. **Bottleneck Detection**: Intelligence engine calculates a composite bottleneck score combining:
   - Machine Utilization %
   - Starvation Time % (waiting for upstream)
   - Blocking Time % (waiting for downstream buffer)
   - Buffer Queue Accumulation
   - Downstream Throughput Impact
4. **Propagation Analysis**: Analyzes step-by-step event trace to trace how disruptions (e.g. M3 breakdown or high cycle time) propagate upstream (causing queue buildup and blocking M2/M1) and downstream (starving M4/M5).
5. **What-If Scenario Execution**: User configures targeted interventions (e.g. increase M3 speed, add parallel machine, expand buffer capacity) without altering baseline data.
6. **Scenario Comparison & Quantification**: Re-simulates under modified parameters and presents side-by-side KPI diffs (Throughput gain, WIP reduction, Bottleneck shift).
7. **Human-in-the-Loop Decision**: Operator reviews trade-offs and clicks "Apply Scenario" to commit changes to the active baseline configuration, triggering automated re-simulation and updated analysis.

## 3. Production Line Specification (M1 → M2 → M3 → M4 → M5)

Each machine stage $M_i$ has:
- `processing_time`: Mean duration (in minutes/units) to process one unit.
- `capacity`: Number of parallel processing units/servers at this stage.
- `availability`: Percentage availability target.
- `mtbf`: Mean Time Between Failures (hours or simulation minutes).
- `mttr`: Mean Time To Repair.
- `buffer_in`: Inbound storage buffer capacity (max queue size before upstream is blocked).

Measured Machine & Line Metrics:
- **Throughput**: Units produced per simulation time unit.
- **WIP (Work In Progress)**: Number of items currently in queues + machines.
- **Utilization**: Time spent actively processing / total simulation time.
- **Queue Length**: Instantaneous, average, and maximum queue size in each buffer.
- **Waiting Time**: Duration items spend waiting in buffer before processing.
- **Blocking Time**: Duration machine sits idle because downstream buffer is full.
- **Starvation Time**: Duration machine sits idle because upstream buffer is empty.

## 4. Multi-Metric Bottleneck Intelligence Algorithm

Standard bottleneck detection relies solely on utilization (highest utilization = bottleneck). In complex production lines, high utilization does not always mean bottleneck (e.g., a high-capacity smoothing buffer). 

Our algorithm uses a composite Bottleneck Severity Index ($BSI$):

$$BSI(M_i) = w_1 \cdot \text{Utilization}(M_i) + w_2 \cdot \text{BlockingTime}(M_{i-1}) + w_3 \cdot \text{StarvationTime}(M_{i+1}) + w_4 \cdot \text{BufferRatio}(B_{i-1})$$

Where:
- High blocking in $M_{i-1}$ indicates $M_i$ is a primary processing constraint.
- High starvation in $M_{i+1}$ indicates $M_i$ is restricting throughput flow downstream.
- Large accumulation in $B_{i-1}$ pinpoints input accumulation at $M_i$.

## 5. Architectural Guarantees & Constraints
- **Simulation Engine is Source of Truth**: Analytics never invent metrics; all KPIs derived directly from SimPy execution traces.
- **Human-in-the-Loop**: Scenarios must be explicitly approved by human decision before becoming the active baseline.
- **Immutability**: Running a what-if scenario creates an ephemeral isolated simulation context, leaving baseline parameters intact.
- **No Microservices**: Modular monolith architecture with clean internal boundaries.

