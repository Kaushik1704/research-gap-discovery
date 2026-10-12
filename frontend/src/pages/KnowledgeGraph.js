import React, { useEffect, useRef, useState } from 'react';
import { getGraph } from '../utils/api';

export default function KnowledgeGraph() {
  const containerRef = useRef(null);
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });

  useEffect(() => {
    getGraph()
      .then(r => {
        setGraphData(r.data);
        setStats({ nodes: r.data.nodes.length, edges: r.data.edges.length });
      })
      .catch(() => setError('Run analysis first from the Upload page.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!graphData || !containerRef.current || graphData.nodes.length === 0) return;

    // Use vis-network via CDN script
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis.min.js';
    script.onload = () => {
      const { Network, DataSet } = window.vis;
      const nodes = new DataSet(graphData.nodes.map(n => ({
        id: n.id,
        label: n.label.length > 35 ? n.label.substring(0, 35) + '…' : n.label,
        title: `${n.label}\nYear: ${n.year}`,
        color: {
          background: '#1a2235',
          border: '#3b82f6',
          highlight: { background: '#1e3a5f', border: '#60a5fa' },
          hover: { background: '#1e3a5f', border: '#60a5fa' }
        },
        font: { color: '#f1f5f9', size: 12, face: 'Inter' },
        shape: 'dot',
        size: 18,
        borderWidth: 2
      })));

      const edges = new DataSet(graphData.edges.map(e => ({
        from: e.from,
        to: e.to,
        value: e.weight,
        color: { color: '#1e2d45', highlight: '#3b82f6', hover: '#3b82f6' },
        width: Math.max(1, e.weight * 3),
        smooth: { type: 'continuous' }
      })));

      const options = {
        physics: { stabilization: { iterations: 150 }, barnesHut: { gravitationalConstant: -3000, springLength: 120 } },
        interaction: { hover: true, tooltipDelay: 200 },
        edges: { smooth: true },
        nodes: { scaling: { min: 14, max: 24 } }
      };

      new Network(containerRef.current, { nodes, edges }, options);
    };
    document.head.appendChild(script);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis.min.css';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(script);
    };
  }, [graphData]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}><span className="spinner" /></div>;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h2 className="section-title" style={{ fontSize: '24px' }}>Knowledge Graph</h2>
        <p className="section-sub">Papers are connected when their content similarity exceeds 50%. Denser clusters indicate highly related research threads.</p>
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', color: '#f87171', marginBottom: '16px' }}>{error}</div>}

      {/* Stats */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
        <div className="card" style={{ flex: 1, padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nodes (Papers)</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent)' }}>{stats.nodes}</div>
        </div>
        <div className="card" style={{ flex: 1, padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Connections</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-2)' }}>{stats.edges}</div>
        </div>
        <div className="card" style={{ flex: 1, padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Similarity Threshold</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--success)' }}>50%</div>
        </div>
        <div className="card" style={{ flex: 2, padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            🖱️ Drag to explore · Scroll to zoom · Hover nodes to see titles · Click to select
          </div>
        </div>
      </div>

      {/* Graph canvas */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {graphData && graphData.nodes.length > 0 ? (
          <div ref={containerRef} style={{ width: '100%', height: '520px', background: 'var(--surface)' }} />
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px' }}>
            No graph data. Upload papers, run analysis, then reload this page.
          </div>
        )}
      </div>
    </div>
  );
}
