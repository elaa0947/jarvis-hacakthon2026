import { useState, useEffect } from 'react';
import { LayoutDashboard, Cpu, Search, Sliders, Columns, Activity } from 'lucide-react';
import DashboardPage from './pages/DashboardPage';
import ProductionPage from './pages/ProductionPage';
import AnalysisPage from './pages/AnalysisPage';
import ScenariosPage from './pages/ScenariosPage';
import ComparisonPage from './pages/ComparisonPage';
import { fetchHealth } from './services/api';

type TabType = 'dashboard' | 'production' | 'analysis' | 'scenarios' | 'comparison';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [apiStatus, setApiStatus] = useState<string>('checking...');

  useEffect(() => {
    fetchHealth()
      .then((data) => setApiStatus(data.status))
      .catch((err) => setApiStatus(`error: ${err.message}`));

    // Sync path on load if path provided
    const path = window.location.pathname.replace('/', '') as TabType;
    if (['dashboard', 'production', 'analysis', 'scenarios', 'comparison'].includes(path)) {
      setActiveTab(path);
    }
  }, []);

  const navigateTo = (tab: TabType) => {
    setActiveTab(tab);
    window.history.pushState({}, '', `/${tab}`);
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Activity size={24} color="var(--accent-cyan)" />
          <div>
            <div className="sidebar-title">Digital Twin</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Bottleneck Intelligence</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <a
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => navigateTo('dashboard')}
          >
            <LayoutDashboard size={18} /> Executive Dashboard
          </a>
          <a
            className={`nav-item ${activeTab === 'production' ? 'active' : ''}`}
            onClick={() => navigateTo('production')}
          >
            <Cpu size={18} /> 2D Production Line
          </a>
          <a
            className={`nav-item ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => navigateTo('analysis')}
          >
            <Search size={18} /> Bottleneck & Propagation
          </a>
          <a
            className={`nav-item ${activeTab === 'scenarios' ? 'active' : ''}`}
            onClick={() => navigateTo('scenarios')}
          >
            <Sliders size={18} /> What-If Sandbox
          </a>
          <a
            className={`nav-item ${activeTab === 'comparison' ? 'active' : ''}`}
            onClick={() => navigateTo('comparison')}
          >
            <Columns size={18} /> Scenario Comparison
          </a>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Header Navbar */}
        <header className="top-header">
          <div className="header-title">
            Production Line Digital Twin <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>(M1 → M2 → M3 → M4 → M5)</span>
          </div>

          <div className="header-actions">
            <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Backend Engine:</span>
              <span
                style={{
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: apiStatus === 'ok' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: apiStatus === 'ok' ? 'var(--accent-green)' : 'var(--accent-red)',
                  border: `1px solid ${apiStatus === 'ok' ? 'var(--accent-green)' : 'var(--accent-red)'}`,
                }}
              >
                {apiStatus}
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Component */}
        <div style={{ flex: 1 }}>
          {activeTab === 'dashboard' && <DashboardPage />}
          {activeTab === 'production' && <ProductionPage />}
          {activeTab === 'analysis' && <AnalysisPage />}
          {activeTab === 'scenarios' && <ScenariosPage />}
          {activeTab === 'comparison' && <ComparisonPage />}
        </div>
      </main>
    </div>
  );
}
