import { useState, useEffect } from 'react';
import { SimulationResult, BottleneckAnalysis } from '../types';
import { runSimulation, fetchBottleneckAnalysis } from '../services/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Activity, Layers, Cpu, AlertTriangle, Play, ChevronRight, Database } from 'lucide-react';

export default function DashboardPage() {
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [bottleneck, setBottleneck] = useState<BottleneckAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    handleRunSimulation();
  }, []);

  const handleRunSimulation = async () => {
    setLoading(true);
    try {
      // Clean API call via services/api.ts
      const simData = await runSimulation();
      setSimulation(simData);
      const bmData = await fetchBottleneckAnalysis(simData.run_id);
      setBottleneck(bmData);
    } catch (err) {
      console.error('Error fetching simulation data via API service:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !simulation) {
    return <div style={{ padding: '2rem' }}>Loading Production Digital Twin Dashboard...</div>;
  }

  // Calculate Overall Utilization (mean across M1..M5)
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

  return (
    <div className="page-container">
      {/* Header & Run Simulation Control */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Production Line Digital Twin Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Real-time Discrete Event Simulation & Bottleneck Intelligence</p>
        </div>
        <button className="btn btn-primary" onClick={handleRunSimulation}>
          <Play size={18} /> Run Simulation
        </button>
      </div>

      {/* Top Summary Cards: Throughput, WIP, Overall Utilization, Current Bottleneck */}
      <div className="grid-cols-4">
        <div className="kpi-card">
          <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="var(--accent-cyan)" /> Throughput
          </div>
          <div className="kpi-value">{simulation.throughput} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>units</span></div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} color="var(--accent-yellow)" /> WIP (Work-In-Progress)
          </div>
          <div className="kpi-value">{simulation.wip} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>items</span></div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={18} color="var(--accent-green)" /> Overall Utilization
          </div>
          <div className="kpi-value">{overallUtilization}%</div>
        </div>

        <div className="kpi-card" style={{ borderColor: 'var(--accent-red)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
          <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} color="var(--accent-red)" /> Current Bottleneck
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-red)' }}>
            {simulation.primary_bottleneck}
          </div>
        </div>
      </div>

      {/* Production Line Process Flow: M1 -> M2 -> M3 -> M4 -> M5 */}
      <div className="kpi-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Production Line Flow (M1 → M2 → M3 → M4 → M5)</h3>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {machinesList.map((m, idx) => {
            const isBottleneck = m.machine_id === simulation.primary_bottleneck;
            const buffer = buffersList.find((b) => b.sequence === m.sequence);

            return (
              <div key={m.machine_id} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                {/* Machine Card */}
                <div
                  style={{
                    width: '160px',
                    padding: '1.25rem 1rem',
                    borderRadius: '8px',
                    backgroundColor: isBottleneck ? 'rgba(239, 68, 68, 0.15)' : '#090d16',
                    border: `2px solid ${isBottleneck ? 'var(--accent-red)' : 'var(--border-color)'}`,
                    textAlign: 'center',
                    position: 'relative',
                    boxShadow: isBottleneck ? '0 0 15px rgba(239, 68, 68, 0.3)' : 'none',
                  }}
                >
                  {isBottleneck && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-11px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'var(--accent-red)',
                        color: '#ffffff',
                        fontSize: '0.65rem',
                        padding: '0.15rem 0.6rem',
                        borderRadius: '9999px',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                      }}
                    >
                      ACTIVE BOTTLENECK
                    </span>
                  )}
                  <Cpu size={26} color={isBottleneck ? 'var(--accent-red)' : 'var(--accent-cyan)'} />
                  <div style={{ fontWeight: 700, marginTop: '0.5rem', fontSize: '1.1rem' }}>{m.machine_id}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{m.name}</div>
                  
                  {/* Status, Utilization, Queue */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                      <span
                        style={{
                          fontWeight: 700,
                          color: m.status === 'BLOCKED' ? 'var(--accent-yellow)' : m.status === 'STARVED' ? 'var(--accent-red)' : 'var(--accent-green)',
                        }}
                      >
                        {m.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Util:</span>
                      <span style={{ fontWeight: 700 }}>{m.utilization}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Queue:</span>
                      <span style={{ fontWeight: 700 }}>{m.queue_length}</span>
                    </div>
                  </div>
                </div>

                {/* Inbound Buffer Connector */}
                {idx < machinesList.length - 1 && buffer && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <ChevronRight color="var(--text-muted)" size={16} />
                    <div
                      style={{
                        padding: '0.6rem 0.75rem',
                        borderRadius: '6px',
                        backgroundColor: '#090d16',
                        border: '1px solid var(--border-color)',
                        textAlign: 'center',
                        minWidth: '75px',
                      }}
                    >
                      <Database size={14} color="var(--accent-yellow)" />
                      <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{buffer.buffer_id}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {buffer.current_wip}/{buffer.capacity}
                      </div>
                    </div>
                    <ChevronRight color="var(--text-muted)" size={16} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Primary Bottleneck Explanation Card */}
      {bottleneck && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--accent-red)',
            borderRadius: '8px',
            padding: '1.25rem',
            marginBottom: '2rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-bottleneck">ACTIVE CONSTRAINT: {bottleneck.primary_bottleneck}</span>
            <span style={{ fontWeight: 600 }}>Multi-Metric Diagnostic Rationale</span>
          </div>
          <p style={{ margin: 0, color: 'var(--text-main)' }}>{bottleneck.primary_reason}</p>
        </div>
      )}

      {/* Machine Utilization Chart */}
      <div className="kpi-card">
        <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Machine Performance & Loss Breakdown</h3>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={machineChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} />
              <Bar dataKey="utilization" fill="var(--accent-cyan)" name="Utilization %" />
              <Bar dataKey="blocking" fill="var(--accent-yellow)" name="Blocking %" />
              <Bar dataKey="starvation" fill="var(--accent-red)" name="Starvation %" />
            </BarChart>
          </ResponsiveContainer>
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
