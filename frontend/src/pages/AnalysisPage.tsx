import { useState, useEffect } from 'react';
import { SimulationResult, BottleneckAnalysis, PropagationAnalysis } from '../types';
import { runSimulation, fetchBottleneckAnalysis, fetchPropagationAnalysis } from '../services/api';
import { AlertCircle, ArrowDown, Activity, Layers, ShieldAlert, Cpu, Zap, GitCommit, ArrowRight } from 'lucide-react';

export default function IntelligencePage() {
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [bottleneck, setBottleneck] = useState<BottleneckAnalysis | null>(null);
  const [propagation, setPropagation] = useState<PropagationAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadAnalysisData();

    const handleSimUpdate = () => loadAnalysisData();
    window.addEventListener('simulationUpdated', handleSimUpdate);
    return () => window.removeEventListener('simulationUpdated', handleSimUpdate);
  }, []);

  const loadAnalysisData = async () => {
    setLoading(true);
    try {
      const simData = await runSimulation();
      setSimulation(simData);

      const bmData = await fetchBottleneckAnalysis(simData.run_id);
      setBottleneck(bmData);

      const propData = await fetchPropagationAnalysis(simData.run_id, simData.primary_bottleneck || 'M3');
      setPropagation(propData);
    } catch (err) {
      console.error('Error fetching intelligence data:', err);
    } finally {
      setLoading(false);
    }
  };

  const navigateToTab = (tab: string) => {
    window.dispatchEvent(new CustomEvent('navigateTab', { detail: { tab } }));
  };

  if (loading || !simulation || !bottleneck || !propagation) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <Zap size={36} color="var(--text-main)" style={{ animation: 'spin 1.5s linear infinite' }} />
          <div style={{ marginTop: '1rem', color: 'var(--text-main)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>LOADING INTELLIGENCE ENGINE...</div>
        </div>
      </div>
    );
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
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Bottleneck Intelligence & Propagation</h1>
          <div className="page-subtitle">
            Diagnostic Root-Cause Rationale & Causal Event Tracing Workflow
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => navigateToTab('scenarios')}>
          Explore What-If Scenarios <ArrowRight size={16} />
        </button>
      </div>

      {/* Primary Bottleneck Diagnostic Header Card */}
      <div className="card-brutal" style={{ marginBottom: '1.75rem', backgroundColor: 'var(--accent-red-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#ffffff', border: 'var(--border-brutal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={26} color="var(--accent-red)" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>Primary Constraint: {primaryId}</h2>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginTop: '0.15rem', fontWeight: 600 }}>
                Detected via Bottleneck Severity Index (BSI) Multi-Metric Analysis
              </div>
            </div>
          </div>

          <span className="badge badge-bottleneck" style={{ fontSize: '0.85rem', padding: '0.4rem 0.95rem' }}>
            BSI SCORE: {bottleneck.primary_bottleneck_score}%
          </span>
        </div>

        {/* Why it is a bottleneck */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: 'var(--border-brutal)',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)', marginBottom: '0.4rem' }}>
            Diagnostic Rationale (Why it is a Bottleneck)
          </div>
          <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: '1.6', fontWeight: 600 }}>
            {bottleneck.primary_reason}
          </div>
        </div>

        {/* Supporting Operational Telemetry Grid */}
        <h4 style={{ margin: '0 0 0.85rem 0', color: 'var(--text-main)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
          Supporting Operational Evidence
        </h4>

        <div className="grid-4" style={{ marginBottom: 0 }}>
          <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '10px', border: 'var(--border-brutal)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Cpu size={14} color="var(--text-main)" /> Station Utilization
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.35rem', fontFamily: 'var(--font-mono)' }}>
              {primaryDetails.utilization}%
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '10px', border: 'var(--border-brutal)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers size={14} color="var(--accent-yellow)" /> Queue Accumulation
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.35rem', fontFamily: 'var(--font-mono)' }}>
              {primaryDetails.queue_length} <span style={{ fontSize: '0.85rem' }}>units</span>
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '10px', border: 'var(--border-brutal)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldAlert size={14} color="var(--accent-red)" /> Upstream Blocking
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-red)', marginTop: '0.35rem', fontFamily: 'var(--font-mono)' }}>
              {primaryDetails.upstream_blocking_caused}%
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '10px', border: 'var(--border-brutal)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Activity size={14} color="var(--accent-purple)" /> Downstream Starvation
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-purple)', marginTop: '0.35rem', fontFamily: 'var(--font-mono)' }}>
              {primaryDetails.downstream_starvation_caused}%
            </div>
          </div>
        </div>
      </div>

      {/* Visual Causal Propagation Chain Stepper */}
      <div className="card-brutal" style={{ marginBottom: '1.75rem' }}>
        <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GitCommit size={18} color="var(--text-main)" /> Causal Disruption Propagation Chain
        </h3>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem', fontWeight: 600 }}>
          {primaryId} Disruption ↓ capacity decrease ↓ queue buildup ↓ upstream blocking ↓ line throughput loss
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }}>
          {propagation.propagation_chain.map((step, idx) => (
            <div key={step.step} style={{ width: '100%', maxWidth: '780px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: '100%',
                  backgroundColor: '#ffffff',
                  border: 'var(--border-brutal)',
                  boxShadow: 'var(--shadow-brutal-sm)',
                  borderRadius: '12px',
                  padding: '1.1rem 1.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: idx === propagation.propagation_chain.length - 1 ? 'var(--accent-red-light)' : 'var(--accent-volt)',
                      color: idx === propagation.propagation_chain.length - 1 ? 'var(--accent-red)' : '#0f172a',
                      border: 'var(--border-brutal)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.05rem',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    0{step.step}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>
                      STAGE: {step.stage}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', marginTop: '0.2rem' }}>{step.effect}</div>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--bg-card-alt)',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    color: 'var(--text-main)',
                    border: 'var(--border-brutal)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {step.metric_change}
                </div>
              </div>

              {idx < propagation.propagation_chain.length - 1 && (
                <div style={{ margin: '0.25rem 0' }}>
                  <ArrowDown size={18} color="var(--text-main)" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="card-brutal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--accent-volt)' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
            Ready to Test Operational Interventions?
          </h4>
          <div style={{ fontSize: '0.85rem', color: '#0f172a', marginTop: '0.25rem', fontWeight: 600 }}>
            Simulate virtual changes to cycle times, parallel servers, or buffer capacities without risk.
          </div>
        </div>

        <button className="btn btn-secondary" style={{ padding: '0.75rem 1.6rem' }} onClick={() => navigateToTab('scenarios')}>
          Explore What-If Scenarios <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
