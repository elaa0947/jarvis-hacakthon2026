import { useState, useEffect } from 'react';
import { SimulationResult, BottleneckAnalysis, PropagationAnalysis } from '../types';
import { runSimulation, fetchBottleneckAnalysis, fetchPropagationAnalysis } from '../services/api';
import { AlertCircle, GitCommit, ArrowDown, Activity, Layers, ShieldAlert, Cpu } from 'lucide-react';

export default function AnalysisPage() {
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [bottleneck, setBottleneck] = useState<BottleneckAnalysis | null>(null);
  const [propagation, setPropagation] = useState<PropagationAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadAnalysisData();
  }, []);

  const loadAnalysisData = async () => {
    setLoading(true);
    try {
      // 1. Fetch simulation result via API service
      const simData = await runSimulation();
      setSimulation(simData);

      // 2. Fetch multi-metric bottleneck analysis via API service
      const bmData = await fetchBottleneckAnalysis(simData.run_id);
      setBottleneck(bmData);

      // 3. Fetch disruption propagation chain via API service
      const propData = await fetchPropagationAnalysis(simData.run_id, 'M3');
      setPropagation(propData);
    } catch (err) {
      console.error('Error fetching analysis data via API service:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !simulation || !bottleneck || !propagation) {
    return <div style={{ padding: '2rem' }}>Loading Bottleneck Intelligence & Propagation Data...</div>;
  }

  const primaryId = bottleneck.primary_bottleneck;
  const primaryDetails = bottleneck.analysis_breakdown[primaryId] || {
    utilization: 0,
    queue_length: 0,
    upstream_blocking_caused: 0,
    downstream_starvation_caused: 0,
    throughput_contribution: 1,
    bottleneck_score: 0,
  };

  return (
    <div className="page-container">
      <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Bottleneck Intelligence & Disruption Propagation</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Multi-Metric Constraint Diagnostic & Causal Propagation Event Tracer
      </p>

      {/* Primary Bottleneck Diagnostic Card */}
      <div className="kpi-card" style={{ marginBottom: '2rem', borderColor: 'var(--accent-red)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={28} color="var(--accent-red)" />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Primary Bottleneck: {primaryId}</h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Detected via Multi-Metric Simulation Evidence</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="badge badge-bottleneck" style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}>
              BSI SCORE: {bottleneck.primary_bottleneck_score}
            </span>
          </div>
        </div>

        {/* Why it is a bottleneck */}
        <div
          style={{
            backgroundColor: '#090d16',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.25rem' }}>Diagnostic Explanation (Why it is a bottleneck)</div>
          <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: '1.5' }}>{bottleneck.primary_reason}</div>
        </div>

        {/* Supporting Metrics Grid */}
        <h4 style={{ marginTop: 0, marginBottom: '0.75rem', color: 'var(--text-muted)' }}>Supporting Operational Metrics</h4>
        <div className="grid-cols-4" style={{ marginBottom: 0 }}>
          <div style={{ backgroundColor: '#090d16', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Cpu size={14} color="var(--accent-cyan)" /> Utilization
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '0.25rem' }}>
              {primaryDetails.utilization}%
            </div>
          </div>

          <div style={{ backgroundColor: '#090d16', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers size={14} color="var(--accent-yellow)" /> Queue Buildup
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-yellow)', marginTop: '0.25rem' }}>
              {primaryDetails.queue_length} units
            </div>
          </div>

          <div style={{ backgroundColor: '#090d16', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldAlert size={14} color="var(--accent-red)" /> Upstream Blocking Caused
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-red)', marginTop: '0.25rem' }}>
              {primaryDetails.upstream_blocking_caused}%
            </div>
          </div>

          <div style={{ backgroundColor: '#090d16', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Activity size={14} color="var(--accent-purple)" /> Downstream Starvation Caused
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-purple)', marginTop: '0.25rem' }}>
              {primaryDetails.downstream_starvation_caused}%
            </div>
          </div>
        </div>
      </div>

      {/* Disruption Impact Summary */}
      <div className="grid-cols-2">
        <div className="kpi-card">
          <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Baseline vs Disruption Impact</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Empirical Output Quantification
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', backgroundColor: '#090d16', padding: '1.25rem', borderRadius: '8px' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Baseline Throughput</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{propagation.baseline_throughput} units</div>
            </div>
            <div style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>→</div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Disrupted Throughput</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent-red)' }}>
                {propagation.scenario_throughput} units ({propagation.throughput_delta_pct}%)
              </div>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Propagation Summary</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Deterministic Causal Explanation
          </p>
          <div style={{ backgroundColor: '#090d16', padding: '1.25rem', borderRadius: '8px', lineHeight: '1.6', fontSize: '0.95rem' }}>
            {propagation.summary}
          </div>
        </div>
      </div>

      {/* Visual Causal Propagation Flow Diagram */}
      <div className="kpi-card">
        <h3 style={{ marginTop: 0, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GitCommit size={20} color="var(--accent-cyan)" /> Visual Disruption Propagation Chain
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2rem' }}>
          M3 Slowdown ↓ Capacity Decrease ↓ Queue Increase ↓ Upstream Blocking ↓ Throughput Impact
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          {propagation.propagation_chain.map((step, idx) => (
            <div key={step.step} style={{ width: '100%', maxWidth: '750px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: '100%',
                  backgroundColor: '#090d16',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: idx === propagation.propagation_chain.length - 1 ? 'var(--accent-red)' : 'var(--accent-cyan)',
                      color: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1rem',
                    }}
                  >
                    {step.step}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                      STAGE: {step.stage}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '1rem', marginTop: '0.15rem' }}>{step.effect}</div>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {step.metric_change}
                </div>
              </div>

              {idx < propagation.propagation_chain.length - 1 && (
                <div style={{ margin: '0.25rem 0' }}>
                  <ArrowDown size={20} color="var(--accent-cyan)" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
