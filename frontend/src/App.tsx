import { useState, useEffect } from 'react';
import { LayoutDashboard, Cpu, Search, Sliders, CheckCircle2, Activity, Zap } from 'lucide-react';
import DashboardPage from './pages/DashboardPage';
import ProductionPage from './pages/ProductionPage';
import AnalysisPage from './pages/AnalysisPage';
import ScenariosPage from './pages/ScenariosPage';
import ComparisonPage from './pages/ComparisonPage';
import { fetchHealth, runSimulation } from './services/api';

type TabType = 'overview' | 'digital-twin' | 'intelligence' | 'scenarios' | 'decisions';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [apiStatus, setApiStatus] = useState<string>('checking...');
  const [runningGlobalSim, setRunningGlobalSim] = useState<boolean>(false);

  useEffect(() => {
    fetchHealth()
      .then((data) => setApiStatus(data.status))
      .catch((err) => setApiStatus(`error: ${err.message}`));

    const rawPath = window.location.pathname.replace('/', '').toLowerCase();
    
    // Map legacy routes seamlessly
    if (rawPath === 'dashboard' || rawPath === 'overview') setActiveTab('overview');
    else if (rawPath === 'production' || rawPath === 'digital-twin') setActiveTab('digital-twin');
    else if (rawPath === 'analysis' || rawPath === 'intelligence') setActiveTab('intelligence');
    else if (rawPath === 'scenarios') setActiveTab('scenarios');
    else if (rawPath === 'comparison' || rawPath === 'decisions') setActiveTab('decisions');

    const handleNavigateEvent = (e: any) => {
      if (e.detail && e.detail.tab) {
        navigateTo(e.detail.tab);
      }
    };
    window.addEventListener('navigateTab', handleNavigateEvent as EventListener);
    return () => window.removeEventListener('navigateTab', handleNavigateEvent as EventListener);
  }, []);

  const navigateTo = (tab: TabType) => {
    setActiveTab(tab);
    window.history.pushState({}, '', `/${tab}`);
  };

  const handleGlobalRunSimulation = async () => {
    setRunningGlobalSim(true);
    try {
      await runSimulation();
      window.dispatchEvent(new Event('simulationUpdated'));
    } catch (err) {
      console.error('Global simulation error:', err);
    } finally {
      setRunningGlobalSim(false);
    }
  };

  return (
    <div className="app-container">
      {/* Sleek Top Navbar Navigation Header */}
      <header className="navbar-top">
        {/* Brand Section */}
        <div className="brand-section">
          <div className="brand-icon-box">
            <Activity size={22} color="#0f172a" strokeWidth={2.5} />
          </div>
          <div>
            <div className="brand-title">Digital Twin</div>
            <div className="brand-subtitle">Operations Engine</div>
          </div>
        </div>

        {/* Center Workspace Navigation Tabs */}
        <nav className="top-nav">
          <a
            className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => navigateTo('overview')}
          >
            <LayoutDashboard size={17} /> Overview
          </a>
          <a
            className={`nav-tab ${activeTab === 'digital-twin' ? 'active' : ''}`}
            onClick={() => navigateTo('digital-twin')}
          >
            <Cpu size={17} /> Digital Twin
          </a>
          <a
            className={`nav-tab ${activeTab === 'intelligence' ? 'active' : ''}`}
            onClick={() => navigateTo('intelligence')}
          >
            <Search size={17} /> Intelligence
          </a>
          <a
            className={`nav-tab ${activeTab === 'scenarios' ? 'active' : ''}`}
            onClick={() => navigateTo('scenarios')}
          >
            <Sliders size={17} /> Scenarios
          </a>
          <a
            className={`nav-tab ${activeTab === 'decisions' ? 'active' : ''}`}
            onClick={() => navigateTo('decisions')}
          >
            <CheckCircle2 size={17} /> Decisions
          </a>
        </nav>

        {/* Right Header Actions */}
        <div className="header-actions">
          {/* Engine Status */}
          <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Engine:</span>
            <span
              style={{
                padding: '0.2rem 0.65rem',
                borderRadius: '8px',
                fontSize: '0.72rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                fontFamily: 'var(--font-mono)',
                backgroundColor: apiStatus === 'ok' ? 'var(--accent-green-light)' : 'var(--accent-red-light)',
                color: apiStatus === 'ok' ? 'var(--accent-green)' : 'var(--accent-red)',
                border: 'var(--border-brutal)',
              }}
            >
              {apiStatus === 'ok' ? 'ONLINE' : apiStatus}
            </span>
          </div>

          {/* Run Sim CTA */}
          <button
            className="btn btn-primary"
            onClick={handleGlobalRunSimulation}
            disabled={runningGlobalSim}
            style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
          >
            <Zap size={15} fill="#0f172a" /> {runningGlobalSim ? 'Running...' : 'Run Simulation'}
          </button>
        </div>
      </header>

      {/* Main Full-Width Workspace Shell */}
      <div className="main-shell">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {activeTab === 'overview' && <DashboardPage />}
          {activeTab === 'digital-twin' && <ProductionPage />}
          {activeTab === 'intelligence' && <AnalysisPage />}
          {activeTab === 'scenarios' && <ScenariosPage />}
          {activeTab === 'decisions' && <ComparisonPage />}
        </div>
      </div>
    </div>
  );
}
