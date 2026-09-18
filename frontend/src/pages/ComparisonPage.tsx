import { useState, useEffect } from 'react';
import { ScenarioComparisonMatrix, ScenarioComparisonRow, ApplyScenarioResponse } from '../types';
import { fetchScenarioComparison, applyScenario } from '../services/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Columns, CheckCircle2, CheckSquare, Zap, ArrowRight, Loader2 } from 'lucide-react';

export default function DecisionsPage() {
  const [matrix, setMatrix] = useState<ScenarioComparisonMatrix | null>(null);
  const [selectedRow, setSelectedRow] = useState<ScenarioComparisonRow | null>(null);
  const [applyResult, setApplyResult] = useState<ApplyScenarioResponse | null>(null);
  
  const [applying, setApplying] = useState<boolean>(false);
  const [applyStep, setApplyStep] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadComparison();

    const handleSimUpdate = () => loadComparison();
    window.addEventListener('simulationUpdated', handleSimUpdate);
    return () => window.removeEventListener('simulationUpdated', handleSimUpdate);
  }, []);

  const loadComparison = async () => {
    setLoading(true);
    try {
      const data = await fetchScenarioComparison();
      setMatrix(data);
      if (data.comparison_matrix.length > 2) {
        setSelectedRow(data.comparison_matrix[3] || data.comparison_matrix[1]);
      }
    } catch (err) {
      console.error('Error loading scenario comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySelected = async () => {
    if (!selectedRow || selectedRow.scenario_id === 'baseline') return;
    setApplying(true);
    
    try {
      setApplyStep('Applying scenario...');
      await delay(600);
      setApplyStep('Updating digital model...');
      await delay(600);
      setApplyStep('Re-simulating...');
      await delay(600);
      setApplyStep('Re-analyzing...');
      await delay(600);

      let modsM: any[] | undefined = undefined;
      let modsB: any[] | undefined = undefined;

      const name = selectedRow.scenario_name.toLowerCase();
      if (name.includes('parallel')) {
        modsM = [{ id: 'M3', capacity: 2 }];
      } else if (name.includes('increase m3 capacity') || name.includes('increase capacity') || name.includes('speed')) {
        // Speed up M3 to 3.5 mins to demonstrate bottleneck migration to M4!
        modsM = [{ id: 'M3', processing_time: 3.5 }];
      } else if (name.includes('buffer')) {
        modsB = [{ id: 'B2', capacity: 16 }];
      } else if (name.includes('slowdown')) {
        modsM = [{ id: 'M3', processing_time: 8.45 }];
      }

      const res = await applyScenario(selectedRow.scenario_id, modsM, modsB);
      setApplyResult(res);
      await loadComparison();

      // Notify global application views of model update
      window.dispatchEvent(new Event('simulationUpdated'));
    } catch (err) {
      console.error('Error applying scenario:', err);
    } finally {
      setApplying(false);
      setApplyStep('');
    }
  };

  if (loading || !matrix) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <Zap size={36} color="var(--text-main)" style={{ animation: 'spin 1.5s linear infinite' }} />
          <div style={{ marginTop: '1rem', color: 'var(--text-main)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>LOADING DECISION MATRIX...</div>
        </div>
      </div>
    );
  }

  const chartData = matrix.comparison_matrix.map((row) => ({
    name: row.scenario_name,
    throughput: row.throughput,
    wip: row.wip,
    queue: row.queue,
  }));

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Decisions & Scenario Comparison</h1>
          <div className="page-subtitle">
            Side-by-Side Trade-off Matrix & Closed-Loop Digital Twin Re-evaluation
          </div>
        </div>
        {selectedRow && selectedRow.scenario_id !== 'baseline' && (
          <button className="btn btn-success" onClick={handleApplySelected} disabled={applying}>
            <Zap size={16} fill="#fff" /> {applying ? applyStep : `APPLY TO DIGITAL TWIN`}
          </button>
        )}
      </div>

      {/* Step-by-Step Re-Evaluation Progress Modal / Overlay */}
      {applying && (
        <div
          className="card-brutal"
          style={{
            backgroundColor: 'var(--accent-volt)',
            marginBottom: '1.75rem',
            textAlign: 'center',
            padding: '2.5rem',
          }}
        >
          <Loader2 size={38} color="#0f172a" style={{ animation: 'spin 1s linear infinite' }} />
          <h3 style={{ color: '#0f172a', marginTop: '1rem', marginBottom: '0.4rem', fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
            {applyStep}
          </h3>
          <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 600 }}>
            Updating digital model parameters, executing SimPy simulation, and recalculating multi-metric bottleneck migration.
          </div>
        </div>
      )}

      {/* NEW BASELINE & Dynamic Bottleneck Migration Display */}
      {applyResult && !applying && (
        <div
          className="card-brutal"
          style={{
            backgroundColor: 'var(--accent-green-light)',
            marginBottom: '1.75rem',
            padding: '1.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: 'var(--border-brutal)', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <CheckCircle2 size={30} color="var(--accent-green)" />
              <div>
                <h2 style={{ margin: 0, fontSize: '1.35rem', color: 'var(--accent-green)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>NEW BASELINE ACTIVATED</h2>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: 600 }}>Digital twin state successfully updated with human decision</div>
              </div>
            </div>
            <span className="badge badge-normal" style={{ fontSize: '0.82rem', padding: '0.4rem 0.95rem' }}>
              MODEL SYNCHRONIZED
            </span>
          </div>

          {/* Bottleneck Migration Banner */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: 'var(--border-brutal)',
              borderRadius: '10px',
              padding: '1.1rem 1.35rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>Previous Bottleneck</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-red)', fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>
                  {applyResult.previous_bottleneck}
                </div>
              </div>
              <ArrowRight size={22} color="var(--text-main)" />
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>Current Bottleneck (New Baseline)</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>
                  {applyResult.new_bottleneck}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
              {applyResult.migration_summary}
            </div>
          </div>

          {/* Side-by-Side Before / After Visual Comparison Cards */}
          <div className="grid-2" style={{ marginBottom: 0 }}>
            {/* BEFORE Card */}
            <div style={{ backgroundColor: '#ffffff', border: 'var(--border-brutal)', borderRadius: '10px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)' }}>
                Before Intervention (Previous Baseline)
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.88rem' }}>
                <span>Throughput:</span>
                <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{matrix.baseline_throughput} units</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.88rem' }}>
                <span>Line WIP:</span>
                <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{matrix.baseline_wip} items</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span>Primary Bottleneck:</span>
                <span className="badge badge-bottleneck">{applyResult.previous_bottleneck}</span>
              </div>
            </div>

            {/* AFTER Card */}
            <div style={{ backgroundColor: '#ffffff', border: 'var(--border-brutal)', borderRadius: '10px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent-green)', marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)' }}>
                After Intervention (New Baseline)
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.88rem' }}>
                <span>Throughput:</span>
                <span style={{ fontWeight: 800, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>{applyResult.new_simulation_result.throughput} units</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.88rem' }}>
                <span>Line WIP:</span>
                <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{applyResult.new_simulation_result.wip} items</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span>Primary Bottleneck:</span>
                <span className="badge badge-normal">{applyResult.new_bottleneck}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Scenario Bar Chart */}
      <div className="card-brutal" style={{ marginBottom: '1.75rem' }}>
        <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 800 }}>Throughput & WIP Trade-off Matrix Chart</h3>
        <div style={{ height: '280px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#0f172a" fontSize={12} tickLine={false} fontWeight={700} />
              <YAxis stroke="#0f172a" fontSize={12} tickLine={false} fontWeight={700} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '2px solid #0f172a',
                  borderRadius: '8px',
                  color: '#0f172a',
                  fontWeight: 700,
                }}
              />
              <Bar dataKey="throughput" fill="#0f172a" name="Throughput (Units)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="wip" fill="#d97706" name="WIP (Items)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="queue" fill="#e11d48" name="B2 Queue (Units)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="card-brutal" style={{ marginBottom: '1.75rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Columns size={18} color="var(--text-main)" /> Scenario Trade-off Matrix (Select Row to Apply)
        </h3>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>Select</th>
                <th>Scenario Name</th>
                <th>Throughput</th>
                <th>WIP</th>
                <th>M3 Util</th>
                <th>B2 Queue</th>
                <th>Primary Bottleneck</th>
                <th>Trade-off Analysis</th>
              </tr>
            </thead>
            <tbody>
              {matrix.comparison_matrix.map((row) => {
                const isSelected = selectedRow?.scenario_id === row.scenario_id;

                return (
                  <tr
                    key={row.scenario_id}
                    onClick={() => setSelectedRow(row)}
                    style={{
                      backgroundColor: isSelected ? 'var(--accent-volt)' : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <td style={{ textAlign: 'center' }}>
                      <CheckSquare size={18} color="#0f172a" />
                    </td>
                    <td style={{ fontWeight: 800, color: '#0f172a' }}>
                      {row.scenario_name}
                    </td>
                    <td style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                      {row.throughput} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({row.throughput_delta})</span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{row.wip}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{row.utilization}%</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{row.queue}</td>
                    <td>
                      <span className={`badge ${row.primary_bottleneck === 'M3' ? 'badge-bottleneck' : 'badge-normal'}`}>
                        {row.primary_bottleneck}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600, maxWidth: '280px' }}>{row.trade_offs}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Action Card */}
      {selectedRow && (
        <div
          className="card-brutal"
          style={{
            backgroundColor: 'var(--accent-volt)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
              Selected Decision: {selectedRow.scenario_name}
            </h4>
            <div style={{ fontSize: '0.85rem', color: '#0f172a', marginTop: '0.25rem', fontWeight: 600 }}>
              {selectedRow.trade_offs}
            </div>
          </div>

          {selectedRow.scenario_id !== 'baseline' ? (
            <button className="btn btn-success" style={{ padding: '0.75rem 1.6rem', fontSize: '0.95rem' }} onClick={handleApplySelected} disabled={applying}>
              <Zap size={18} fill="#fff" /> APPLY TO DIGITAL TWIN
            </button>
          ) : (
            <span className="badge badge-volt" style={{ fontSize: '0.82rem' }}>ACTIVE BASELINE</span>
          )}
        </div>
      )}
    </div>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
