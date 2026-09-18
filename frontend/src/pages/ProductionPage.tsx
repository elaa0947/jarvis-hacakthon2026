import { useState, useEffect } from 'react';
import { SimulationResult } from '../types';
import { runSimulation } from '../services/api';
import { Cpu, Database, ChevronRight } from 'lucide-react';

export default function ProductionPage() {
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);

  useEffect(() => {
    runSimulation().then(setSimulation);
  }, []);

  if (!simulation) {
    return <div style={{ padding: '2rem' }}>Loading Production Digital Twin...</div>;
  }

  const machines = Object.values(simulation.machines).sort((a, b) => a.sequence - b.sequence);
  const buffers = Object.values(simulation.buffers).sort((a, b) => a.sequence - b.sequence);

  return (
    <div className="page-container">
      <h1 style={{ margin: 0, fontSize: '1.75rem' }}>2D Production Line Digital Twin</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Sequential Line Flow: M1 → B1 → M2 → B2 → M3 → B3 → M4 → B4 → M5
      </p>

      {/* 2D Process Flow Renderer */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '2.5rem',
          marginBottom: '2rem',
          overflowX: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '900px' }}>
          {machines.map((m, idx) => {
            const isBottleneck = m.machine_id === simulation.primary_bottleneck;
            const buffer = buffers.find((b) => b.sequence === m.sequence);

            return (
              <div key={m.machine_id} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                {/* Machine Node */}
                <div
                  style={{
                    width: '150px',
                    padding: '1.25rem',
                    borderRadius: '8px',
                    backgroundColor: isBottleneck ? 'rgba(239, 68, 68, 0.15)' : '#0f172a',
                    border: `2px solid ${isBottleneck ? 'var(--accent-red)' : 'var(--border-color)'}`,
                    textAlign: 'center',
                    position: 'relative',
                  }}
                >
                  {isBottleneck && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'var(--accent-red)',
                        color: '#fff',
                        fontSize: '0.65rem',
                        padding: '0.1rem 0.5rem',
                        borderRadius: '9999px',
                        fontWeight: 'bold',
                      }}
                    >
                      BOTTLENECK
                    </span>
                  )}
                  <Cpu size={28} color={isBottleneck ? 'var(--accent-red)' : 'var(--accent-cyan)'} />
                  <div style={{ fontWeight: 700, marginTop: '0.5rem' }}>{m.machine_id}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{m.name}</div>
                  
                  <div style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                    <span>Util:</span>
                    <span style={{ fontWeight: 600 }}>{m.utilization}%</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Status:</span>
                    <span style={{ fontWeight: 600, color: m.status === 'BLOCKED' ? 'var(--accent-yellow)' : m.status === 'STARVED' ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                      {m.status}
                    </span>
                  </div>
                </div>

                {/* Connector & Buffer Node */}
                {idx < machines.length - 1 && buffer && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ChevronRight color="var(--text-muted)" />
                    <div
                      style={{
                        padding: '0.75rem',
                        borderRadius: '6px',
                        backgroundColor: '#090d16',
                        border: '1px solid var(--border-color)',
                        textAlign: 'center',
                        minWidth: '80px',
                      }}
                    >
                      <Database size={16} color="var(--accent-yellow)" />
                      <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{buffer.buffer_id}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        WIP: {buffer.current_wip}/{buffer.capacity}
                      </div>
                    </div>
                    <ChevronRight color="var(--text-muted)" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Machine Status Table */}
      <div className="kpi-card">
        <h3 style={{ marginTop: 0 }}>Detailed Station Metrics</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Station</th>
              <th>Name</th>
              <th>Status</th>
              <th>Utilization</th>
              <th>Inbound Queue</th>
              <th>Avg Wait Time</th>
              <th>Blocking Time</th>
              <th>Starvation Time</th>
              <th>BSI Score</th>
            </tr>
          </thead>
          <tbody>
            {machines.map((m) => (
              <tr key={m.machine_id} style={{ backgroundColor: m.machine_id === simulation.primary_bottleneck ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                <td style={{ fontWeight: 700 }}>{m.machine_id}</td>
                <td>{m.name}</td>
                <td>
                  <span className={`badge ${m.machine_id === simulation.primary_bottleneck ? 'badge-bottleneck' : 'badge-normal'}`}>
                    {m.status}
                  </span>
                </td>
                <td>{m.utilization}%</td>
                <td>{m.queue_length}</td>
                <td>{m.waiting_time} min</td>
                <td>{m.blocking_time}%</td>
                <td>{m.starvation_time}%</td>
                <td style={{ fontWeight: 700, color: m.machine_id === simulation.primary_bottleneck ? 'var(--accent-red)' : 'var(--text-main)' }}>
                  {m.bottleneck_score}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

