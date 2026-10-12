import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Clusters from './pages/Clusters';
import Trends from './pages/Trends';
import Gaps from './pages/Gaps';
import KnowledgeGraph from './pages/KnowledgeGraph';
import Insights from './pages/Insights';
import './styles/global.css';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [analysisReady, setAnalysisReady] = useState(false);

  const pages = {
    dashboard: Dashboard,
    upload: Upload,
    clusters: Clusters,
    trends: Trends,
    gaps: Gaps,
    graph: KnowledgeGraph,
    insights: Insights,
  };
  const Page = pages[page] || Dashboard;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar page={page} setPage={setPage} />
      <main style={{
        flex: 1,
        padding: '40px 44px',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        <Page setPage={setPage} analysisReady={analysisReady} setAnalysisReady={setAnalysisReady} />
      </main>
    </div>
  );
}
