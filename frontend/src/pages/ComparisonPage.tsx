import { useState, useEffect } from 'react';
import { ScenarioComparisonMatrix, ScenarioComparisonRow, ApplyScenarioResponse } from '../types';
import { fetchScenarioComparison, applyScenario } from '../services/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Columns, CheckCircle2, CheckSquare, Zap, ArrowRight, Loader2 } from 'lucide-react';

export default function ComparisonPage() {
  const [matrix, setMatrix] = useState<ScenarioComparisonMatrix | null>(null);
  const [selectedRow, setSelectedRow] = useState<ScenarioComparisonRow | null>(null);
  const [applyResult, setApplyResult] = useState<ApplyScenarioResponse | null>(null);
  
  // Re-evaluation progress state
  const [applying, setApplying] = useState<boolean>(false);
  const [applyStep, setApplyStep] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadComparison();
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
      console.error('Error loading comparison via API service:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySelected = async () => {
    if (!selectedRow || selectedRow.scenario_id === 'baseline') return;
    setApplying(true);
    
    // Animated progress sequence
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
        // Speed up M3 to 3.5 mins to demonstrate bottleneck migration to M4 or M2!
        modsM = [{ id: 'M3', processing_time: 3.5 }];
      } else if (name.includes('buffer')) {
        modsB = [{ id: 'B2', capacity: 16 }];
      } else if (name.includes('slowdown')) {
        modsM = [{ id: 'M3', processing_time: 8.45 }];
      }

      // Execute actual backend API call
      const res = await applyScenario(selectedRow.scenario_id, modsM, modsB);
      setApplyResult(res);
      await loadComparison();
    } catch (err) {
      console.error('Error applying scenario via API service:', err);
    } finally {
      setApplying(false);
      setApplyStep('');
    }
  };

  if (loading || !matrix) {
    return <div style={{ padding: '2rem' }}>Loading Scenario Comparison Matrix...</div>;
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Scenario Comparison & Human Decision Center</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Side-by-Side Trade-off Matrix & Digital Twin Application
          </p>
        </div>
        {selectedRow && selectedRow.scenario_id !== 'baseline' && (
          <button className="btn btn-success" onClick={handleApplySelected} disabled={applying}>
            <Zap size={18} /> {applying ? applyStep : `APPLY TO DIGITAL TWIN (${selectedRow.scenario_name})`}
          </button>
        )}
      </div>

      {/* Step-by-Step Re-Evaluation Progress Modal / Overlay */}
      {applying && (
        <div
          style={{
            backgroundColor: 'rgba(9, 13, 22, 0.9)',
            border: '2px solid var(--accent-cyan)',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem',
            textAlign: 'center',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.2)',
          }}
        >
          <Loader2 size={36} color="var(--accent-cyan)" className="spin" style={{ animation: 'spin 1s linear infinite' }} />
          <h3 style={{ color: 'var(--accent-cyan)', marginTop: '1rem', marginBottom: '0.5rem' }}>
            {applyStep}
          </h3>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Updating digital factory model parameters, executing SimPy simulation engine, and recalculating multi-metric bottleneck intelligence.
          </div>
        </div>
      )}

      {/* NEW BASELINE & Clear Before/After Visualization */}
      {applyResult && !applying && (
        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '2px solid var(--accent-green)',
            borderRadius: '12px',
            padding: '1.75rem',
            marginBottom: '2.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircle2 size={28} color="var(--accent-green)" />
              <div>
                <h2 style={{ margin: 0, fontSize: '1.35rem', color: 'var(--accent-green)' }}>NEW BASELINE ACTIVATED</h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Digital twin model successfully updated with human decision</div>
              </div>
            </div>
            <span className="badge badge-normal" style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}>
              STATE UPDATED
            </span>
          </div>

          {/* Dynamic Bottleneck Migration Header */}
          <div
            style={{
              backgroundColor: '#090d16',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Previous Bottleneck</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-red)' }}>{applyResult.previous_bottleneck}</div>
              </div>
              <ArrowRight size={24} color="var(--accent-cyan)" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Bottleneck (New Baseline)</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-green)' }}>{applyResult.new_bottleneck}</div>
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
              {applyResult.migration_summary}
            </div>
          </div>

          {/* Side-by-Side Before / After Visual Comparison Cards */}
          <div className="grid-cols-2" style={{ marginBottom: 0 }}>
            {/* BEFORE Card */}
            <div style={{ backgroundColor: '#090d16', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                Before Intervention (Previous Baseline)
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Throughput:</span>
                <span style={{ fontWeight: 700 }}>{matrix.baseline_throughput} units</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Line WIP:</span>
                <span style={{ fontWeight: 700 }}>{matrix.baseline_wip} items</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Primary Bottleneck:</span>
                <span className="badge badge-bottleneck">{applyResult.previous_bottleneck}</span>
              </div>
            </div>

            {/* AFTER Card */}
            <div style={{ backgroundColor: '#090d16', border: '1px solid var(--accent-green)', borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-green)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                After Intervention (New Baseline)
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Throughput:</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{applyResult.new_simulation_result.throughput} units</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Line WIP:</span>
                <span style={{ fontWeight: 700 }}>{applyResult.new_simulation_result.wip} items</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Primary Bottleneck:</span>
                <span className="badge badge-normal">{applyResult.new_bottleneck}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Chart */}
      <div className="kpi-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1.25rem' }}>Throughput & WIP Comparison Chart</h3>
        <div style={{ height: '280px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} />
              <Bar dataKey="throughput" fill="var(--accent-cyan)" name="Throughput (Units)" />
              <Bar dataKey="wip" fill="var(--accent-yellow)" name="WIP (Items)" />
              <Bar dataKey="queue" fill="var(--accent-red)" name="B2 Queue (Units)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="kpi-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Columns size={20} color="var(--accent-cyan)" /> Scenario Comparison Matrix (Select Row)
        </h3>

        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>Select</th>
              <th>Scenario</th>
              <th>Throughput</th>
              <th>WIP</th>
              <th>Utilization (M3)</th>
              <th>Queue (B2)</th>
              <th>Primary Bottleneck</th>
              <th>Measurable Trade-offs</th>
            </tr>
          </thead>
          <tbody>
            {matrix.comparison_matrix.map((row) => {
              const isSelected = selectedRow?.scenario_id === row.scenario_id;
              const isBaseline = row.scenario_id === 'baseline';

              return (
                <tr
                  key={row.scenario_id}
                  onClick={() => setSelectedRow(row)}
                  style={{
                    backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                    cursor: 'pointer',
                    borderLeft: isSelected ? '4px solid var(--accent-cyan)' : 'none',
                  }}
                >
                  <td style={{ textAlign: 'center' }}>
                    <CheckSquare size={18} color={isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
                  </td>
                  <td style={{ fontWeight: 700, color: isBaseline ? 'var(--accent-cyan)' : 'var(--text-main)' }}>
                    {row.scenario_name}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {row.throughput} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({row.throughput_delta})</span>
                  </td>
                  <td>{row.wip}</td>
                  <td>{row.utilization}%</td>
                  <td>{row.queue}</td>
                  <td>
                    <span className={`badge ${row.primary_bottleneck === 'M3' ? 'badge-bottleneck' : 'badge-normal'}`}>
                      {row.primary_bottleneck}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '300px' }}>{row.trade_offs}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Selected Decision Action Box */}
      {selectedRow && (
        <div
          className="kpi-card"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '2px solid var(--accent-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>
              Selected Decision: {selectedRow.scenario_name}
            </h4>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {selectedRow.trade_offs}
            </div>
          </div>

          {selectedRow.scenario_id !== 'baseline' ? (
            <button className="btn btn-success" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }} onClick={handleApplySelected} disabled={applying}>
              <Zap size={20} /> APPLY TO DIGITAL TWIN
            </button>
          ) : (
            <span className="badge badge-normal" style={{ fontSize: '0.85rem' }}>ACTIVE BASELINE</span>
          )}
        </div>
      )}
    </div>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
