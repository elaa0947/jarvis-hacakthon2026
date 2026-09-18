import { useState, useEffect } from 'react';
import { SimulationResult } from '../types';
import { runSimulation, runScenario } from '../services/api';
import { Sliders, Play, ArrowRight, Zap, ShieldCheck } from 'lucide-react';

export default function ScenariosPage() {
  const [baseline, setBaseline] = useState<SimulationResult | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<string>('M3');
  const [selectedParameter, setSelectedParameter] = useState<string>('processing_time');
  const [paramValue, setParamValue] = useState<number>(8.45);
  const [scenarioName, setScenarioName] = useState<string>('M3 Slowdown (60s -> 78s)');
  const [scenarioResult, setScenarioResult] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [simulating, setSimulating] = useState<boolean>(false);

  useEffect(() => {
    loadBaseline();

    const handleSimUpdate = () => loadBaseline();
    window.addEventListener('simulationUpdated', handleSimUpdate);
    return () => window.removeEventListener('simulationUpdated', handleSimUpdate);
  }, []);

  const loadBaseline = async () => {
    setLoading(true);
    try {
      const base = await runSimulation();
      setBaseline(base);
      const res = await runScenario('M3 Slowdown (60s -> 78s)', [{ id: 'M3', processing_time: 8.45 }]);
      setScenarioResult(res);
    } catch (err) {
      console.error('Error loading baseline scenario:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunScenario = async () => {
    setSimulating(true);
    try {
      let modsM: any[] = [];
      let modsB: any[] = [];

      if (selectedParameter === 'buffer_capacity') {
        const bufId = selectedMachine === 'M1' ? 'B1' : selectedMachine === 'M2' ? 'B1' : selectedMachine === 'M3' ? 'B2' : selectedMachine === 'M4' ? 'B3' : 'B4';
        modsB = [{ id: bufId, capacity: paramValue }];
      } else {
        modsM = [{ id: selectedMachine, [selectedParameter]: paramValue }];
      }

      const res = await runScenario(
        scenarioName || `${selectedMachine} ${selectedParameter} = ${paramValue}`,
        modsM,
        modsB
      );
      setScenarioResult(res);
    } catch (err) {
      console.error('Error executing scenario:', err);
    } finally {
      setSimulating(false);
    }
  };

  const applyPrimaryDemo = () => {
    setSelectedMachine('M3');
    setSelectedParameter('processing_time');
    setParamValue(8.45);
    setScenarioName('M3 Slowdown (60s -> 78s)');
  };

  const navigateToTab = (tab: string) => {
    window.dispatchEvent(new CustomEvent('navigateTab', { detail: { tab } }));
  };

  if (loading || !baseline) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <Zap size={36} color="var(--text-main)" style={{ animation: 'spin 1.5s linear infinite' }} />
          <div style={{ marginTop: '1rem', color: 'var(--text-main)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>LOADING SCENARIO WORKSPACE...</div>
        </div>
      </div>
    );
  }

  const scenSim = scenarioResult?.simulation_result;
  const scenBm = scenarioResult?.bottleneck_analysis;
  const prop = scenarioResult?.propagation_analysis;

  const baseTp = baseline.throughput;
  const scenTp = scenSim ? scenSim.throughput : baseTp;
  const tpDiff = scenTp - baseTp;
  const tpPct = roundVal(((scenTp - baseTp) / maxVal(1, baseTp)) * 100, 1);

  const baseWip = baseline.wip;
  const scenWip = scenSim ? scenSim.wip : baseWip;
  const wipDiff = roundVal(scenWip - baseWip, 1);

  return (
    <div className="page-container">
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">What-If Scenarios Workspace</h1>
          <div className="page-subtitle">
            Interactive Parameter Manipulation & Risk-Free Virtual Intervention Testing
          </div>
        </div>
        <button className="btn btn-primary" onClick={applyPrimaryDemo}>
          <Zap size={16} fill="#0f172a" /> Demo Preset: M3 Slowdown (60s → 78s)
        </button>
      </div>

      {/* Row 1: Interactive Sandbox Controls & KPI Differences */}
      <div className="grid-2">
        {/* Controls Panel */}
        <div className="card-brutal">
          <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={18} color="var(--text-main)" /> Virtual Parameter Sandbox
          </h3>

          <div style={{ marginBottom: '1.1rem' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-mono)', marginBottom: '0.4rem' }}>
              1. Target Station
            </label>
            <select
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: '#ffffff',
                border: 'var(--border-brutal)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
              }}
            >
              <option value="M1">M1 — Raw Prep</option>
              <option value="M2">M2 — Machining</option>
              <option value="M3">M3 — Component Assembly (Constraint)</option>
              <option value="M4">M4 — Inspection</option>
              <option value="M5">M5 — Packaging</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.1rem' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-mono)', marginBottom: '0.4rem' }}>
              2. Operating Parameter
            </label>
            <select
              value={selectedParameter}
              onChange={(e) => setSelectedParameter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: '#ffffff',
                border: 'var(--border-brutal)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
              }}
            >
              <option value="processing_time">processing_time (Cycle Time in Mins)</option>
              <option value="capacity">capacity (Parallel Server Units)</option>
              <option value="downtime">downtime (MTTR Repair Duration Mins)</option>
              <option value="buffer_capacity">buffer_capacity (Inbound Queue Limit)</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-mono)', marginBottom: '0.4rem' }}>
              <span>3. Modify Value</span>
              <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)', backgroundColor: 'var(--accent-volt)', padding: '0.1rem 0.4rem', border: '1px solid #0f172a', borderRadius: '4px' }}>Value: {paramValue}</span>
            </div>
            {selectedParameter === 'processing_time' ? (
              <input
                type="range"
                min="2.0"
                max="15.0"
                step="0.05"
                value={paramValue}
                onChange={(e) => setParamValue(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#0f172a' }}
              />
            ) : (
              <input
                type="number"
                min="1"
                max="100"
                value={paramValue}
                onChange={(e) => setParamValue(parseFloat(e.target.value))}
                style={{ width: '100%', padding: '0.75rem 1rem', backgroundColor: '#ffffff', border: 'var(--border-brutal)', borderRadius: '8px', color: 'var(--text-main)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
              />
            )}
          </div>

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleRunScenario} disabled={simulating}>
            <Play size={16} fill="#0f172a" /> {simulating ? 'Running SimPy Engine...' : '4. Execute Scenario Simulation'}
          </button>
        </div>

        {/* KPI Differences Display */}
        <div className="card-brutal">
          <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 800 }}>Baseline vs Scenario KPI Impact</h3>

          <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
            {/* Throughput */}
            <div style={{ backgroundColor: 'var(--bg-card-alt)', padding: '1rem', borderRadius: '10px', border: 'var(--border-brutal)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Throughput Comparison</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                {baseTp} <ArrowRight size={14} /> <span style={{ color: tpDiff < 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{scenTp} units</span>
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: tpDiff < 0 ? 'var(--accent-red)' : 'var(--accent-green)', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                Impact: {tpDiff >= 0 ? '+' : ''}{tpDiff} units ({tpPct >= 0 ? '+' : ''}{tpPct}%)
              </div>
            </div>

            {/* WIP */}
            <div style={{ backgroundColor: 'var(--bg-card-alt)', padding: '1rem', borderRadius: '10px', border: 'var(--border-brutal)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>WIP Comparison</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                {baseWip} <ArrowRight size={14} /> <span>{scenWip} items</span>
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                Delta: {wipDiff >= 0 ? '+' : ''}{wipDiff} items
              </div>
            </div>
          </div>

          {/* Primary Bottleneck Shift */}
          <div style={{ backgroundColor: 'var(--bg-card-alt)', padding: '1rem 1.25rem', borderRadius: '10px', border: 'var(--border-brutal)', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>
              Primary Bottleneck Shift
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <span className="badge badge-bottleneck">BASELINE: {baseline.primary_bottleneck}</span>
              <ArrowRight size={16} color="var(--text-main)" />
              <span className={`badge ${scenBm?.primary_bottleneck === baseline.primary_bottleneck ? 'badge-bottleneck' : 'badge-normal'}`}>
                SCENARIO: {scenBm?.primary_bottleneck || baseline.primary_bottleneck}
              </span>
            </div>
          </div>

          {/* Scenario Impact Rationale */}
          {prop && (
            <div style={{ backgroundColor: 'var(--accent-volt)', border: 'var(--border-brutal)', padding: '1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-mono)', marginBottom: '0.25rem' }}>
                Simulation Impact Rationale
              </div>
              <div style={{ lineHeight: '1.5' }}>{prop.summary}</div>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Candidate Intervention Presets */}
      <div className="card-brutal" style={{ marginBottom: '1.75rem' }}>
        <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={18} color="var(--text-main)" /> Candidate Intervention Presets for Constraint Mitigation
        </h3>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.25rem', fontWeight: 600 }}>
          Select an intervention candidate to load and test its virtual simulation profile:
        </div>

        <div className="grid-4" style={{ marginBottom: 0 }}>
          {/* Candidate 1 */}
          <div style={{ backgroundColor: '#ffffff', border: 'var(--border-brutal)', borderRadius: '10px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: 'var(--shadow-brutal-sm)' }}>
            <div>
              <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem', fontFamily: 'var(--font-mono)', marginBottom: '0.4rem' }}>1. Parallel Server</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 600 }}>Add 2nd parallel server to M3 (capacity = 2)</div>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '0.78rem', padding: '0.45rem' }}
              onClick={() => {
                setSelectedMachine('M3');
                setSelectedParameter('capacity');
                setParamValue(2);
                setScenarioName('Add Parallel M3 Server');
              }}
            >
              Load Candidate
            </button>
          </div>

          {/* Candidate 2 */}
          <div style={{ backgroundColor: '#ffffff', border: 'var(--border-brutal)', borderRadius: '10px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: 'var(--shadow-brutal-sm)' }}>
            <div>
              <div style={{ fontWeight: 800, color: 'var(--accent-green)', fontSize: '0.95rem', fontFamily: 'var(--font-mono)', marginBottom: '0.4rem' }}>2. Speed Up M3</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 600 }}>Accelerate M3 cycle time to 3.5m</div>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '0.78rem', padding: '0.45rem' }}
              onClick={() => {
                setSelectedMachine('M3');
                setSelectedParameter('processing_time');
                setParamValue(3.5);
                setScenarioName('Increase M3 Capacity (3.5m)');
              }}
            >
              Load Candidate
            </button>
          </div>

          {/* Candidate 3 */}
          <div style={{ backgroundColor: '#ffffff', border: 'var(--border-brutal)', borderRadius: '10px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: 'var(--shadow-brutal-sm)' }}>
            <div>
              <div style={{ fontWeight: 800, color: 'var(--accent-yellow)', fontSize: '0.95rem', fontFamily: 'var(--font-mono)', marginBottom: '0.4rem' }}>3. Expand Buffer</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 600 }}>Expand B2 buffer capacity (8 → 16 units)</div>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '0.78rem', padding: '0.45rem' }}
              onClick={() => {
                setSelectedMachine('M3');
                setSelectedParameter('buffer_capacity');
                setParamValue(16);
                setScenarioName('Expand Buffer B2 Capacity');
              }}
            >
              Load Candidate
            </button>
          </div>

          {/* Candidate 4 */}
          <div style={{ backgroundColor: '#ffffff', border: 'var(--border-brutal)', borderRadius: '10px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: 'var(--shadow-brutal-sm)' }}>
            <div>
              <div style={{ fontWeight: 800, color: 'var(--accent-purple)', fontSize: '0.95rem', fontFamily: 'var(--font-mono)', marginBottom: '0.4rem' }}>4. Preventive Maint.</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 600 }}>Reduce M3 repair downtime MTTR (45m → 15m)</div>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '0.78rem', padding: '0.45rem' }}
              onClick={() => {
                setSelectedMachine('M3');
                setSelectedParameter('downtime');
                setParamValue(15);
                setScenarioName('M3 Preventive Maintenance');
              }}
            >
              Load Candidate
            </button>
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <div className="card-brutal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--accent-volt)' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
            Compare Multiple Scenarios & Make Final Decision
          </h4>
          <div style={{ fontSize: '0.85rem', color: '#0f172a', marginTop: '0.25rem', fontWeight: 600 }}>
            Evaluate side-by-side trade-offs across all simulated candidates and apply the chosen model.
          </div>
        </div>

        <button className="btn btn-secondary" style={{ padding: '0.75rem 1.6rem' }} onClick={() => navigateToTab('decisions')}>
          Proceed to Decisions & Comparison <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

function roundVal(val: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

function maxVal(a: number, b: number): number {
  return Math.max(a, b);
}
