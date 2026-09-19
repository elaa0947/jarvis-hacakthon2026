# 🏭 Production Bottleneck Intelligence & Digital Twin Platform

> **A Discrete-Event Digital Twin & Operational Decision Workspace for Multi-Stage Manufacturing Lines.**  
> *Observe live production → Detect primary constraints → Trace causal disruptions → Simulate what-if interventions → Compare trade-offs → Apply decisions → Re-evaluate dynamic bottleneck migration.*

---

## 🚀 Production Deployment Overview

The platform is engineered for zero-downtime, continuous deployment using a decoupled cloud-native architecture:

```
┌─────────────────────────────────────────────────────────┐
│                      GITHUB                             │
│       https://github.com/elaa0947/jarvis-hacakthon2026   │
└────────────────────────────┬────────────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
┌───────────────────────┐         ┌───────────────────────┐
│ VERCEL FRONTEND HOST  │         │ RENDER BACKEND ENGINE │
│ • React + Vite + TS   │ ──HTTPS─▶ • FastAPI + SimPy     │
│ • SPA Routing Rewrites│         │ • CORS Protection     │
└───────────────────────┘         └───────────┬───────────┘
                                              │
                                              ▼
                                  ┌───────────────────────┐
                                  │ MANAGED POSTGRESQL DB │
                                  │ • Persistence & Audits│
                                  └───────────────────────┘
```

---

## 🔄 End-to-End Operational Workflow

The platform follows a **closed-loop decision cycle** designed for manufacturing engineers, operations managers, and plant superintendents to move from raw line telemetry to verified decision execution without operational risk.

```mermaid
flowchart TD
    subgraph Phase1["1. Live Line Observation"]
        A1["📡 Telemetry Aggregation"] --> A2["📊 Executive Overview & Metric Strip"]
        A2 --> A3["⚙️ Interactive Digital Twin Node Inspection"]
    end

    subgraph Phase2["2. Constraint Diagnosis"]
        A3 --> B1["🧮 Multi-Factor BSI Ranking Algorithm"]
        B1 --> B2["🔍 Root Cause Telemetry Analysis"]
        B2 --> B3["🌊 5-Stage Causal Propagation Tracing"]
    end

    subgraph Phase3["3. Virtual Experimentation & Analysis"]
        B3 --> C1["🧪 Isolated What-If Parameter Sandbox"]
        C1 --> C2["⚡ Candidate Intervention Presets"]
        C2 --> C3["📈 Multivariable Trade-Off Comparison Matrix"]
    end

    subgraph Phase4["4. Closed-Loop Execution"]
        C3 --> D1["✅ Apply Decision to Digital Twin"]
        D1 --> D2["🔄 SimPy Engine Re-Evaluation"]
        D2 --> D3["🔀 Dynamic Bottleneck Migration Detection"]
    end

    D3 -->|"New Operational Baseline"| A1
```

### The 5-Step Operator Journey

1. **Observe Baseline (`/overview` & `/digital-twin`)**  
   Operators monitor real-time plant performance across stations (**M1 → M5**) and buffers (**B1 → B4**). High-level KPIs (Throughput, WIP, Utilization, Primary Bottleneck) provide immediate situational awareness.

2. **Diagnose Constraint (`/intelligence`)**  
   The **Bottleneck Severity Index (BSI)** engine computes empirical constraint scores combining utilization, queue backlog, upstream blocking, and downstream starvation. Operators inspect the 5-stage causal chain to pinpoint the origin of throughput loss.

3. **Simulate Interventions (`/scenarios`)**  
   Operators adjust processing cycle times, machine capacities, buffer limits, or MTTR parameters inside an isolated sandbox without mutating the live factory configuration.

4. **Compare Trade-Offs (`/decisions`)**  
   Candidate scenarios are evaluated in a side-by-side trade-off matrix analyzing Throughput Delta ($\Delta\%$), WIP Reduction ($\Delta\%$), Lead Time Delta ($\Delta\%$), and ROI ($\$/\%$ gain).

5. **Apply & Re-Evaluate (`/decisions` → Dynamic Migration)**  
   Executing **APPLY TO DIGITAL TWIN** re-injects the selected intervention into the core simulation engine. The platform recalculates all telemetry live and verifies whether the bottleneck was resolved or migrated downstream (e.g., from `M3` to `M4`).

---

## 🏗 System Architecture & Tech Stack

```
                               ┌────────────────────────────────────────┐
                               │   REACT + VITE + TS FRONTEND (PORT 3000)│
                               │   • Top Navigation Bar Layout          │
                               │   • 5 Workspaces: Overview | Twin |    │
                               │     Intel | Scenarios | Decisions      │
                               │   • Minimal Light Industrial Brutalism │
                               └───────────────────┬────────────────────┘
                                                   │ HTTP / REST APIs
                                                   ▼
                               ┌────────────────────────────────────────┐
                               │   FASTAPI BACKEND ENGINE (PORT 8000)   │
                               │   Thin REST API Router (/api/*)        │
                               └───────────────────┬────────────────────┘
                                                   │
         ┌─────────────────────────────────────────┼─────────────────────────────────────────┐
         ▼                                         ▼                                         ▼
┌─────────────────────────┐               ┌─────────────────────────┐               ┌─────────────────────────┐
│ SIMULATION SERVICE      │               │ BSI ANALYTICS ENGINE    │               │ SCENARIO ENGINE         │
│ • SimPy Discrete Engine │               │ • Multi-Metric Ranking  │               │ • What-If Sandbox       │
│ • Station Queue Logic   │               │ • Upstream Blocking     │               │ • Trade-off Matrix      │
│ • Operational Telemetry │               │ • Downstream Starvation │               │ • Model Re-evaluation   │
└─────────────────────────┘               └─────────────────────────┘               └─────────────────────────┘
```

### Tech Stack Details
- **Backend Application**: Python 3.14, FastAPI (ASGI web framework), Pydantic v2 (schema validation), Uvicorn / Gunicorn.
- **Simulation & Modeling Engine**: `SimPy` (Discrete-Event Simulation engine for queueing networks & process modeling).
- **Frontend Workspace**: React 18, Vite, TypeScript, Recharts (data visualization), Lucide Icons, Custom CSS design tokens.
- **Automated Testing Suite**: Pytest (48 backend integration & unit tests), TypeScript Compiler (`tsc --noEmit`).

---

## 🌐 Environment Variables & Deployment Matrix

### Frontend Environment Variables (`frontend/.env`)
| Variable | Description | Example (Local) | Example (Production) |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | Base HTTPS URL of deployed FastAPI backend | `http://localhost:8000` | `https://digital-twin-backend.onrender.com` |

### Backend Environment Variables (`backend/.env`)
| Variable | Description | Example (Local) | Example (Production) |
| :--- | :--- | :--- | :--- |
| `PORT` | Service binding port | `8000` | `10000` (Assigned by cloud host) |
| `HOST` | Server host binding | `127.0.0.1` | `0.0.0.0` |
| `CORS_ORIGINS` | Comma-separated allowed frontend domains | `http://localhost:3000` | `https://jarvis-hackathon2026.vercel.app` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` | `postgresql://user:pass@ep-host.postgres.database.azure.com/db` |

---

## 🛠 Local Development & Verification

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### 1. Start Backend API Server
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend API Health Check*: [http://localhost:8000/api/health](http://localhost:8000/api/health)

### 2. Start Frontend Application
```bash
cd frontend
npm install
npm run dev
```
*Frontend Workspace*: [http://localhost:3000/](http://localhost:3000/)

### 3. Run Automated Test Suite
```bash
# Execute Backend Pytest Suite (48 tests passing)
cd backend
$env:PYTHONPATH="backend"; python -m pytest backend/tests

# Execute Frontend TypeScript Type Check (0 errors)
cd frontend
npx tsc --noEmit
```

---

## 🔧 Production Cloud Deployment Setup

### Option A: Frontend Deployment on Vercel
1. Log into [Vercel Dashboard](https://vercel.com/new).
2. Import repository `https://github.com/elaa0947/jarvis-hacakthon2026`.
3. Set **Root Directory** to `frontend`.
4. Add Environment Variable: `VITE_API_URL = https://digital-twin-backend.onrender.com`.
5. Deploy. Vercel automatically processes `frontend/vercel.json` for SPA routes.

### Option B: Backend Deployment on Render
1. Log into [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **Web Service** (or Blueprint using `backend/render.yaml`).
3. Connect repository `https://github.com/elaa0947/jarvis-hacakthon2026`.
4. Set **Root Directory** to `backend`.
5. Build Command: `pip install -r requirements.txt`
6. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
7. Add Environment Variables:
   - `CORS_ORIGINS`: `https://your-vercel-app-name.vercel.app`
   - `DATABASE_URL`: Managed PostgreSQL Connection URI
8. Deploy Service.

---

## ❓ Troubleshooting & Edge Cases

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `CORS Error on Frontend` | Backend `CORS_ORIGINS` does not match Vercel URL | Update `CORS_ORIGINS` env var on Render/Railway backend settings to include exact Vercel origin. |
| `404 on Direct Route Refresh` | Static host failing SPA client routes | Verify `frontend/vercel.json` contains rewrites targeting `/index.html`. |
| `Backend Cold Start Delay` | Free tier instance spun down | System shows clean loading spinners and non-blocking telemetry retries. |

---

## 📄 License & System Status
**Production Intelligence & Digital Twin Platform** — Built for multi-stage discrete manufacturing process optimization.
