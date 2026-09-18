import { useState, useEffect } from 'react';
import { SimulationResult, BottleneckAnalysis } from '../types';
import { runSimulation, fetchBottleneckAnalysis } from '../services/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Cpu, AlertTriangle, Play, ChevronRight, Database, Zap, ArrowRight } from 'lucide-react';

export default function OverviewPage() {
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [bottleneck, setBottleneck] = useState<BottleneckAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    handleRunSimulation();

    const handleSimUpdate = () => handleRunSimulation();
    window.addEventListener('simulationUpdated', handleSimUpdate);
    return () => window.removeEventListener('simulationUpdated', handleSimUpdate);
  }, []);

  const handleRunSimulation = async () => {
    setLoading(true);
    try {
      const simData = await runSimulation();
      setSimulation(simData);
      const bmData = await fetchBottleneckAnalysis(simData.run_id);
      setBottleneck(bmData);
    } catch (err) {
      console.error('Error fetching simulation data:', err);
    } finally {
      setLoading(false);
    }
  };

  const navigateToTab = (tab: string) => {
    window.dispatchEvent(new CustomEvent('navigateTab', { detail: { tab } }));
  };

  if (loading || !simulation) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <Zap size={36} color="var(--text-main)" style={{ animation: 'spin 1.5s linear infinite' }} />
          <div style={{ marginTop: '1rem', color: 'var(--text-main)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>LOADING DIGITAL TWIN ENGINE...</div>
        </div>
      </div>
    );
  }

  const machinesList = Object.values(simulation.machines).sort((a, b) => a.sequence - b.sequence);
  const buffersList = Object.values(simulation.buffers).sort((a, b) => a.sequence - b.sequence);
  
  const totalUtil = machinesList.reduce((acc, m) => acc + m.utilization, 0);
  const overallUtilization = roundVal(totalUtil / maxVal(1, machinesList.length), 1);

  const machineChartData = machinesList.map((m) => ({
    name: m.name,
    utilization: m.utilization,
    blocking: m.blocking_time,
    starvation: m.starvation_time,
  }));

  const primaryBotId = simulation.primary_bottleneck;
  const primaryBotDetails = simulation.machines[primaryBotId];

  return (
    <div className="page-container">
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Production Overview</h1>
          <div className="page-subtitle">Current System State — Discrete Event Simulation Model</div>
        </div>
        <button className="btn btn-primary" onClick={handleRunSimulation}>
          <Play size={16} fill="#0f172a" /> Run Simulation
        </button>
      </div>

      {/* 4 Primary KPI Strip - Brutalist Style */}
      <div className="grid-4">
        <div className="card-light-hero">
          <div className="hero-label">Line Throughput</div>
          <div className="hero-value">{simulation.throughput}</div>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>completed units</div>
        </div>

        <div className="card-brutal">
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>Line WIP</div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', margin: '0.2rem 0', color: 'var(--text-main)' }}>{simulation.wip}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>items in system</div>
        </div>

        <div className="card-brutal">
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>Overall Util</div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)', margin: '0.2rem 0' }}>{overallUtilization}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>line efficiency</div>
        </div>

        <div className="card-brutal" style={{ backgroundColor: 'var(--accent-red-light)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent-red)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'var(--font-mono)' }}>
            <AlertTriangle size={14} /> Line Constraint
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-red)', margin: '0.2rem 0' }}>{primaryBotId}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-red)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>BSI SCORE: {bottleneck?.primary_bottleneck_score || 0}%</div>
        </div>
      </div>

      {/* Hero Visual: Horizontal 2D Production Line Flow */}
      <div className="card-brutal" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={18} color="var(--text-main)" /> 2D Factory Line Topology
          </h3>
          <button className="btn btn-secondary" style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }} onClick={() => navigateToTab('digital-twin')}>
            Open Full Digital Twin →
          </button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {machinesList.map((m, idx) => {
            const isBottleneck = m.machine_id === primaryBotId;
            const buffer = buffersList.find((b) => b.sequence === m.sequence);

            return (
              <div key={m.machine_id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '150px',
                    padding: '1.1rem 1rem',
                    borderRadius: '12px',
                    backgroundColor: isBottleneck ? 'var(--accent-red-light)' : '#ffffff',
                    border: 'var(--border-brutal)',
                    textAlign: 'center',
                    position: 'relative',
                    boxShadow: isBottleneck ? 'var(--shadow-brutal)' : 'var(--shadow-brutal-sm)',
                  }}
                >
                  {isBottleneck && (
                    <span className="badge badge-bottleneck" style={{ position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.62rem' }}>
                      BOTTLENECK
                    </span>
                  )}
                  <Cpu size={24} color={isBottleneck ? 'var(--accent-red)' : '#0f172a'} />
                  <div style={{ fontWeight: 800, marginTop: '0.4rem', fontSize: '1.1rem', fontFamily: 'var(--font-mono)' }}>{m.machine_id}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 600 }}>
                    {m.name}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', borderTop: 'var(--border-brutal)', paddingTop: '0.5rem', fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Util:</span>
                      <span style={{ fontWeight: 800, color: isBottleneck ? 'var(--accent-red)' : 'var(--text-main)' }}>{m.utilization}%</span>
                    </div>
                  </div>
                </div>

                {idx < machinesList.length - 1 && buffer && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <ChevronRight color="var(--text-main)" size={16} />
                    <div
                      style={{
                        padding: '0.5rem 0.65rem',
                        borderRadius: '10px',
                        backgroundColor: '#ffffff',
                        border: 'var(--border-brutal)',
                        boxShadow: 'var(--shadow-brutal-sm)',
                        textAlign: 'center',
                        minWidth: '70px',
                      }}
                    >
                      <Database size={13} color="var(--accent-yellow)" />
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{buffer.buffer_id}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {buffer.current_wip}/{buffer.capacity}
                      </div>
                    </div>
                    <ChevronRight color="var(--text-main)" size={16} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 3: Bottleneck Attention Panel & Performance Chart */}
      <div className="grid-2">
        {/* Constraint Attention Card */}
        <div className="card-brutal" style={{ backgroundColor: 'var(--accent-red-light)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="badge badge-bottleneck">
                <AlertTriangle size={13} /> ATTENTION REQUIRED
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-red)', fontFamily: 'var(--font-mono)' }}>
                BSI: {bottleneck?.primary_bottleneck_score || 0}%
              </span>
            </div>

            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem', color: 'var(--accent-red)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              Primary Constraint: {primaryBotId}
            </h3>

            <p style={{ margin: '0 0 1rem 0', fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: '1.5', fontWeight: 600 }}>
              {bottleneck?.primary_reason || 'Station is operating near maximum capacity and accumulating queue backlog.'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '0.75rem', borderRadius: '10px', border: 'var(--border-brutal)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Inbound Queue</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{primaryBotDetails?.queue_length || 0} units</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '0.75rem', borderRadius: '10px', border: 'var(--border-brutal)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Blocking Loss</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-red)', fontFamily: 'var(--font-mono)' }}>{primaryBotDetails?.blocking_time || 0}%</div>
              </div>
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigateToTab('intelligence')}>
            Investigate Bottleneck Cause & Propagation <ArrowRight size={16} />
          </button>
        </div>

        {/* Station Utilization Chart */}
        <div className="card-brutal">
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 800 }}>Station Utilization Breakdown</h3>
          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={machineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#0f172a" fontSize={11} tickLine={false} fontWeight={700} />
                <YAxis stroke="#0f172a" fontSize={11} tickLine={false} unit="%" fontWeight={700} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '2px solid #0f172a',
                    borderRadius: '8px',
                    color: '#0f172a',
                    fontWeight: 700,
                  }}
                />
                <Bar dataKey="utilization" fill="#0f172a" name="Utilization %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
