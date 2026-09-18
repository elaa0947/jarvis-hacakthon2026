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
  }, []);

  const loadBaseline = async () => {
    setLoading(true);
    try {
      const base = await runSimulation();
      setBaseline(base);
      // Run primary demo scenario (M3 Slowdown 60s -> 78s) by default
      const res = await runScenario('M3 Slowdown (60s -> 78s)', [{ id: 'M3', processing_time: 8.45 }]);
      setScenarioResult(res);
    } catch (err) {
      console.error(err);
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
      console.error(err);
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

  if (loading || !baseline) {
    return <div style={{ padding: '2rem' }}>Loading What-if Scenario Laboratory...</div>;
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
      {/* Header & Primary Demo Preset Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem' }}>What-If Scenario Laboratory</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Interactive Parameter Manipulation & Risk-Free Virtual Intervention Testing
          </p>
        </div>
        <button className="btn btn-primary" onClick={applyPrimaryDemo}>
          <Zap size={18} /> Primary Demo: M3 Slowdown (60s → 78s)
        </button>
      </div>

      {/* Interactive Controls & Sandbox Cards */}
      <div className="grid-cols-2" style={{ marginBottom: '2rem' }}>
        {/* Scenario Controls Panel */}
        <div className="kpi-card">
          <h3 style={{ marginTop: 0, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={20} color="var(--accent-cyan)" /> Virtual Parameter Sandbox
          </h3>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              1. Select Target Station
            </label>
            <select
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#090d16',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.95rem',
              }}
            >
              <option value="M1">M1 — Raw Prep</option>
              <option value="M2">M2 — Machining</option>
              <option value="M3">M3 — Component Assembly (Constraint)</option>
              <option value="M4">M4 — Inspection</option>
              <option value="M5">M5 — Packaging</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              2. Select Operating Parameter
            </label>
            <select
              value={selectedParameter}
              onChange={(e) => setSelectedParameter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#090d16',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.95rem',
              }}
            >
              <option value="processing_time">processing_time (Cycle Time in Mins)</option>
              <option value="capacity">capacity (Parallel Server Units)</option>
              <option value="downtime">downtime (MTTR Repair Duration Mins)</option>
              <option value="buffer_capacity">buffer_capacity (Inbound Queue Limit)</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              <span>3. Modify Value</span>
              <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>Value: {paramValue}</span>
            </div>
            {selectedParameter === 'processing_time' ? (
              <input
                type="range"
                min="2.0"
                max="15.0"
                step="0.05"
                value={paramValue}
                onChange={(e) => setParamValue(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            ) : selectedParameter === 'capacity' ? (
              <input
                type="number"
                min="1"
                max="5"
                value={paramValue}
                onChange={(e) => setParamValue(parseInt(e.target.value))}
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#090d16', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff' }}
              />
            ) : (
              <input
                type="number"
                min="1"
                max="100"
                value={paramValue}
                onChange={(e) => setParamValue(parseFloat(e.target.value))}
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#090d16', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff' }}
              />
            )}
          </div>

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleRunScenario} disabled={simulating}>
            <Play size={18} /> {simulating ? 'Simulating Virtual Scenario...' : '4. Execute Scenario Simulation'}
          </button>
        </div>

        {/* Baseline vs Scenario KPI Differences Display */}
        <div className="kpi-card">
          <h3 style={{ marginTop: 0, marginBottom: '1.25rem' }}>Baseline vs Scenario KPI Differences</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Throughput Difference */}
            <div style={{ backgroundColor: '#090d16', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Throughput Comparison</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '0.25rem' }}>
                {baseTp} <ArrowRight size={14} /> <span style={{ color: tpDiff < 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{scenTp} units</span>
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: tpDiff < 0 ? 'var(--accent-red)' : 'var(--accent-green)', marginTop: '0.2rem' }}>
                Impact: {tpDiff >= 0 ? '+' : ''}{tpDiff} units ({tpPct >= 0 ? '+' : ''}{tpPct}%)
              </div>
            </div>

            {/* WIP Difference */}
            <div style={{ backgroundColor: '#090d16', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>WIP Comparison</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '0.25rem' }}>
                {baseWip} <ArrowRight size={14} /> <span>{scenWip} items</span>
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Delta: {wipDiff >= 0 ? '+' : ''}{wipDiff} items
              </div>
            </div>
          </div>

          {/* Bottleneck Status Comparison */}
          <div style={{ backgroundColor: '#090d16', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Primary Bottleneck Shift</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className="badge badge-bottleneck">BASELINE: {baseline.primary_bottleneck}</span>
              <ArrowRight size={16} color="var(--text-muted)" />
              <span className={`badge ${scenBm?.primary_bottleneck === baseline.primary_bottleneck ? 'badge-bottleneck' : 'badge-normal'}`}>
                SCENARIO: {scenBm?.primary_bottleneck || baseline.primary_bottleneck}
              </span>
            </div>
          </div>

          {/* Impact Explanation */}
          {prop && (
            <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.05)', border: '1px solid var(--accent-cyan)', padding: '1rem', borderRadius: '6px', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.25rem' }}>Simulation Impact Summary</div>
              <div>{prop.summary}</div>
            </div>
          )}
        </div>
      </div>

      {/* Candidate Intervention Options Section */}
      <div className="kpi-card">
        <h3 style={{ marginTop: 0, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={20} color="var(--accent-green)" /> Candidate Intervention Options for Bottleneck Mitigation
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Select an intervention candidate to load and test its simulation profile:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {/* Candidate 1: Add Parallel Server */}
          <div style={{ backgroundColor: '#090d16', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>1. Parallel Server Unit</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Add 2nd parallel processing unit to M3 (capacity = 2)</div>
            <button
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
              onClick={() => {
                setSelectedMachine('M3');
                setSelectedParameter('capacity');
                setParamValue(2);
                setScenarioName('Add Parallel M3 Server');
              }}
            >
              Load & Test Candidate
            </button>
          </div>

          {/* Candidate 2: Reduce Processing Time */}
          <div style={{ backgroundColor: '#090d16', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--accent-green)', marginBottom: '0.5rem' }}>2. Cycle Time Speedup</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Reduce M3 cycle time by -25% (6.5m → 4.88m)</div>
            <button
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
              onClick={() => {
                setSelectedMachine('M3');
                setSelectedParameter('processing_time');
                setParamValue(4.88);
                setScenarioName('Reduce M3 Processing Time (-25%)');
              }}
            >
              Load & Test Candidate
            </button>
          </div>

          {/* Candidate 3: Expand Buffer */}
          <div style={{ backgroundColor: '#090d16', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--accent-yellow)', marginBottom: '0.5rem' }}>3. Buffer Expansion</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Expand B2 buffer storage capacity (8 → 16 units)</div>
            <button
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
              onClick={() => {
                setSelectedMachine('M3');
                setSelectedParameter('buffer_capacity');
                setParamValue(16);
                setScenarioName('Expand Buffer B2 Capacity');
              }}
            >
              Load & Test Candidate
            </button>
          </div>

          {/* Candidate 4: Preventive Maintenance */}
          <div style={{ backgroundColor: '#090d16', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>4. Preventive Maintenance</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Reduce M3 repair downtime MTTR (45m → 15m)</div>
            <button
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
              onClick={() => {
                setSelectedMachine('M3');
                setSelectedParameter('downtime');
                setParamValue(15);
                setScenarioName('M3 Preventive Maintenance');
              }}
            >
              Load & Test Candidate
            </button>
          </div>
        </div>
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
