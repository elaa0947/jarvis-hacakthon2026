import {
  ProductionConfig,
  SimulationResult,
  BottleneckAnalysis,
  PropagationAnalysis,
  ScenarioComparisonMatrix,
  ApplyScenarioResponse,
} from '../types';

const rawApiUrl = (import.meta as any).env?.VITE_API_URL;
const API_BASE = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`)
  : '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}: ${res.statusText}`;
    try {
      const errData = await res.json();
      if (errData.detail) {
        errorMsg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
      }
    } catch {
      // JSON parse failed
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export async function fetchHealth(): Promise<{ status: string }> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return await handleResponse<{ status: string }>(res);
  } catch (err: any) {
    throw new Error(`Backend Unavailable: ${err.message}`);
  }
}

export async function fetchFactoryConfig(): Promise<ProductionConfig> {
  const res = await fetch(`${API_BASE}/factory`);
  return handleResponse<ProductionConfig>(res);
}

export async function runSimulation(
  simulationTime: number = 480.0,
  seed: number = 42
): Promise<SimulationResult> {
  const res = await fetch(`${API_BASE}/simulation/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ simulation_time: simulationTime, seed }),
  });
  return handleResponse<SimulationResult>(res);
}

export async function runScenario(
  scenarioName: string,
  modifiedMachines?: Record<string, any>[],
  modifiedBuffers?: Record<string, any>[],
  simulationTime: number = 480.0,
  seed: number = 42
): Promise<any> {
  const res = await fetch(`${API_BASE}/scenarios/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scenario_name: scenarioName,
      modified_machines: modifiedMachines,
      modified_buffers: modifiedBuffers,
      simulation_time: simulationTime,
      seed,
    }),
  });
  return handleResponse<any>(res);
}

export async function fetchBottleneckAnalysis(runId: string): Promise<BottleneckAnalysis> {
  const res = await fetch(`${API_BASE}/analysis/bottleneck/${runId}`);
  return handleResponse<BottleneckAnalysis>(res);
}

export async function fetchPropagationAnalysis(
  runId: string,
  machineId: string = 'M3'
): Promise<PropagationAnalysis> {
  const res = await fetch(`${API_BASE}/analysis/propagation/${runId}?machine_id=${machineId}`);
  return handleResponse<PropagationAnalysis>(res);
}

export async function fetchScenarioComparison(): Promise<ScenarioComparisonMatrix> {
  const res = await fetch(`${API_BASE}/scenarios/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  return handleResponse<ScenarioComparisonMatrix>(res);
}

export async function applyScenario(
  scenarioId: string,
  modifiedMachines?: Record<string, any>[],
  modifiedBuffers?: Record<string, any>[]
): Promise<ApplyScenarioResponse> {
  const res = await fetch(`${API_BASE}/scenarios/${scenarioId}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      modified_machines: modifiedMachines,
      modified_buffers: modifiedBuffers,
    }),
  });
  return handleResponse<ApplyScenarioResponse>(res);
}
