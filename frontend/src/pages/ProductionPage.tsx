import { useState, useEffect } from 'react';
import { SimulationResult, MachineMetrics } from '../types';
import { runSimulation } from '../services/api';
import { Cpu, Database, ChevronRight, Activity, Zap, X, Sliders, Search } from 'lucide-react';

export default function DigitalTwinPage() {
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<MachineMetrics | null>(null);

  useEffect(() => {
    runSimulation().then((sim) => {
      setSimulation(sim);
      if (sim.primary_bottleneck && sim.machines[sim.primary_bottleneck]) {
        setSelectedMachine(sim.machines[sim.primary_bottleneck]);
      }
    });

    const handleSimUpdate = () => {
      runSimulation().then((sim) => {
        setSimulation(sim);
        if (selectedMachine && sim.machines[selectedMachine.machine_id]) {
          setSelectedMachine(sim.machines[selectedMachine.machine_id]);
        }
      });
    };
    window.addEventListener('simulationUpdated', handleSimUpdate);
    return () => window.removeEventListener('simulationUpdated', handleSimUpdate);
  }, []);

  const navigateToTab = (tab: string) => {
    window.dispatchEvent(new CustomEvent('navigateTab', { detail: { tab } }));
  };

  if (!simulation) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <Zap size={36} color="var(--text-main)" style={{ animation: 'spin 1.5s linear infinite' }} />
          <div style={{ marginTop: '1rem', color: 'var(--text-main)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>LOADING 2D DIGITAL TWIN...</div>
        </div>
      </div>
    );
  }

  const machines = Object.values(simulation.machines).sort((a, b) => a.sequence - b.sequence);
  const buffers = Object.values(simulation.buffers).sort((a, b) => a.sequence - b.sequence);

  return (
    <div className="page-container" style={{ position: 'relative' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">2D Digital Twin Workspace</h1>
          <div className="page-subtitle">
            Interactive Production Model — Click any station node to inspect detailed operational telemetry
          </div>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
          STATUS: <span style={{ backgroundColor: 'var(--accent-volt)', padding: '0.2rem 0.5rem', borderRadius: '6px', border: 'var(--border-brutal)' }}>M1..M5 ONLINE</span>
        </div>
      </div>

      {/* 2D Line Schematic Hero Box */}
      <div className="card-brutal" style={{ marginBottom: '1.75rem', overflowX: 'auto', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>
            Interactive Factory Architecture
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            Discrete Events Executed: <span style={{ color: 'var(--text-main)', fontWeight: 800 }}>{simulation.events_count}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '950px' }}>
          {machines.map((m, idx) => {
            const isBottleneck = m.machine_id === simulation.primary_bottleneck;
            const isSelected = selectedMachine?.machine_id === m.machine_id;
            const buffer = buffers.find((b) => b.sequence === m.sequence);

            return (
              <div key={m.machine_id} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                {/* Station Node (Interactive Click) */}
                <div
                  onClick={() => setSelectedMachine(m)}
                  style={{
                    width: '165px',
                    padding: '1.25rem 1rem',
                    borderRadius: '12px',
                    backgroundColor: isSelected
                      ? 'var(--accent-volt)'
                      : isBottleneck
                      ? 'var(--accent-red-light)'
                      : '#ffffff',
                    border: 'var(--border-brutal)',
                    textAlign: 'center',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected || isBottleneck ? 'var(--shadow-brutal)' : 'var(--shadow-brutal-sm)',
                  }}
                >
                  {isBottleneck && (
                    <span className="badge badge-bottleneck" style={{ position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.62rem' }}>
                      BOTTLENECK
                    </span>
                  )}
                  
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: isBottleneck ? 'var(--accent-red-light)' : '#ffffff', border: 'var(--border-brutal)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                    <Cpu size={22} color={isBottleneck ? 'var(--accent-red)' : '#0f172a'} />
                  </div>

                  <div style={{ fontWeight: 800, fontSize: '1.15rem', fontFamily: 'var(--font-mono)' }}>{m.machine_id}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.85rem', fontWeight: 600 }}>{m.name}</div>
                  
                  <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: 'var(--border-brutal)', paddingTop: '0.65rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Util:</span>
                      <span style={{ fontWeight: 800, color: isBottleneck ? 'var(--accent-red)' : 'var(--text-main)' }}>{m.utilization}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>State:</span>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '0.72rem',
                          color: m.status === 'BLOCKED' ? 'var(--accent-yellow)' : m.status === 'STARVED' ? 'var(--accent-red)' : 'var(--accent-green)',
                        }}
                      >
                        {m.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Buffer Connector */}
                {idx < machines.length - 1 && buffer && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ChevronRight color="var(--text-main)" size={18} />
                    <div
                      style={{
                        padding: '0.75rem',
                        borderRadius: '10px',
                        backgroundColor: '#ffffff',
                        border: 'var(--border-brutal)',
                        boxShadow: 'var(--shadow-brutal-sm)',
                        textAlign: 'center',
                        minWidth: '85px',
                      }}
                    >
                      <Database size={15} color="var(--accent-yellow)" />
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>{buffer.buffer_id}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        WIP: <span style={{ color: 'var(--text-main)', fontWeight: 800 }}>{buffer.current_wip}</span>/{buffer.capacity}
                      </div>
                    </div>
                    <ChevronRight color="var(--text-main)" size={18} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Station Metrics Summary Grid */}
      <div className="card-brutal">
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={18} color="var(--text-main)" /> Station Operational Metrics Breakdown
        </h3>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Station</th>
                <th>Name</th>
                <th>Status</th>
                <th>Utilization</th>
                <th>Queue Length</th>
                <th>Avg Wait Time</th>
                <th>Blocking Loss</th>
                <th>Starvation Loss</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {machines.map((m) => {
                const isBottleneck = m.machine_id === simulation.primary_bottleneck;

                return (
                  <tr key={m.machine_id} style={{ backgroundColor: isBottleneck ? 'var(--accent-red-light)' : 'transparent' }}>
                    <td style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: isBottleneck ? 'var(--accent-red)' : 'var(--text-main)' }}>
                      {m.machine_id}
                    </td>
                    <td style={{ fontWeight: 700 }}>{m.name}</td>
                    <td>
                      <span className={`badge ${isBottleneck ? 'badge-bottleneck' : 'badge-normal'}`}>
                        {m.status}
                      </span>
                    </td>
                    <td style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: isBottleneck ? 'var(--accent-red)' : 'var(--text-main)' }}>
                      {m.utilization}%
                    </td>
                    <td style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{m.queue_length} units</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{m.waiting_time} min</td>
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: m.blocking_time > 0 ? 'var(--accent-yellow)' : 'var(--text-muted)' }}>{m.blocking_time}%</td>
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: m.starvation_time > 0 ? 'var(--accent-red)' : 'var(--text-muted)' }}>{m.starvation_time}%</td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                        onClick={() => setSelectedMachine(m)}
                      >
                        Inspect Station
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MACHINE DETAIL DRAWER (Minimal Light Brutalist Style) */}
      {selectedMachine && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '420px',
            backgroundColor: '#ffffff',
            borderLeft: 'var(--border-brutal)',
            boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.2)',
            zIndex: 100,
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflowY: 'auto',
          }}
        >
          <div>
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: 'var(--border-brutal)', paddingBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>
                  Station Deep Inspection
                </span>
                <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  {selectedMachine.machine_id} — {selectedMachine.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedMachine(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Station State Summary */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span className={`badge ${selectedMachine.machine_id === simulation.primary_bottleneck ? 'badge-bottleneck' : 'badge-normal'}`}>
                  STATUS: {selectedMachine.status}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                  UTILIZATION: {selectedMachine.utilization}%
                </span>
              </div>

              {/* Station Metric Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div style={{ backgroundColor: 'var(--bg-card-alt)', padding: '1rem', borderRadius: '10px', border: 'var(--border-brutal)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Queue Backlog</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                    {selectedMachine.queue_length} <span style={{ fontSize: '0.75rem' }}>units</span>
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-card-alt)', padding: '1rem', borderRadius: '10px', border: 'var(--border-brutal)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Jobs Completed</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                    {selectedMachine.completed_jobs}
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-card-alt)', padding: '1rem', borderRadius: '10px', border: 'var(--border-brutal)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Blocking Loss</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: selectedMachine.blocking_time > 0 ? 'var(--accent-yellow)' : 'var(--text-main)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                    {selectedMachine.blocking_time}%
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-card-alt)', padding: '1rem', borderRadius: '10px', border: 'var(--border-brutal)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Starvation Loss</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: selectedMachine.starvation_time > 0 ? 'var(--accent-red)' : 'var(--text-main)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                    {selectedMachine.starvation_time}%
                  </div>
                </div>
              </div>
            </div>

            {/* Station Role Analysis */}
            <div style={{ backgroundColor: 'var(--bg-card-alt)', border: 'var(--border-brutal)', borderRadius: '12px', padding: '1.1rem', marginBottom: '1.5rem', lineHeight: '1.5', fontSize: '0.88rem', fontWeight: 600 }}>
              <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-mono)', marginBottom: '0.35rem' }}>
                Station Operational Diagnostic
              </div>
              <div>
                {selectedMachine.machine_id === simulation.primary_bottleneck
                  ? `Station ${selectedMachine.machine_id} is operating as the primary line constraint with ${selectedMachine.utilization}% utilization and a queue backlog of ${selectedMachine.queue_length} units.`
                  : `Station ${selectedMachine.machine_id} is operating smoothly with ${selectedMachine.utilization}% utilization and minimal loss delays.`}
              </div>
            </div>
          </div>

          {/* Drawer Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: 'var(--border-brutal)', paddingTop: '1.25rem' }}>
            <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={() => navigateToTab('intelligence')}>
              <Search size={16} /> Analyze Bottleneck & Propagation
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'center' }} onClick={() => navigateToTab('scenarios')}>
              <Sliders size={16} /> Create What-If Scenario for {selectedMachine.machine_id}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
