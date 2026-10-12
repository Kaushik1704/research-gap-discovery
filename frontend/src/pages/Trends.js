import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { getTrends } from '../utils/api';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', fontSize: '13px' }}>
        <div style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>Year {label}</div>
        {payload.map(p => (
          <div key={p.name} style={{ color: p.color, marginBottom: '2px' }}>{p.name}: {p.value} paper{p.value !== 1 ? 's' : ''}</div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Trends() {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getTrends()
      .then(r => setTrends(r.data))
      .catch(() => setError('Run analysis first from the Upload page.'))
      .finally(() => setLoading(false));
  }, []);

  // Union all topic keys across every year row — topics may first appear in later years
  const topics = Array.from(
    trends.reduce((acc, row) => {
      Object.keys(row).filter(k => k !== 'year').forEach(k => acc.add(k));
      return acc;
    }, new Set())
  );

  // Stats
  const totalByTopic = {};
  topics.forEach(t => { totalByTopic[t] = trends.reduce((sum, row) => sum + (row[t] || 0), 0); });
  const topTopic = Object.entries(totalByTopic).sort((a, b) => b[1] - a[1])[0];
  const latestYear = trends[trends.length - 1]?.year;

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}><span className="spinner" /></div>;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '28px' }}>
        <h2 className="section-title" style={{ fontSize: '24px' }}>Publication Trends</h2>
        <p className="section-sub">Temporal analysis showing how research interest in each topic has evolved over the years.</p>
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', color: '#f87171', marginBottom: '16px' }}>{error}</div>}

      {/* Stat cards */}
      {trends.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
            <div className="card">
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Years Covered</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent)' }}>{trends[0]?.year} – {latestYear}</div>
            </div>
            <div className="card">
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dominant Topic</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-2)' }}>{topTopic?.[0] || 'N/A'}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{topTopic?.[1]} papers</div>
            </div>
            <div className="card">
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Topics Tracked</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--success)' }}>{topics.length}</div>
            </div>
          </div>

          {/* Area Chart */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '20px' }}>Research Volume by Topic Over Time</div>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="year" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
                {topics.map((t, i) => (
                  <Area key={t} type="monotone" dataKey={t} stroke={COLORS[i % COLORS.length]}
                    fill={COLORS[i % COLORS.length] + '22'} strokeWidth={2} dot={{ r: 4 }} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Line chart */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '20px' }}>Topic Trajectory (Line View)</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="year" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                {topics.map((t, i) => (
                  <Line key={t} type="monotone" dataKey={t} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Per-topic breakdown table */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '16px' }}>Topic Breakdown</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.entries(totalByTopic)
                .sort((a, b) => b[1] - a[1])
                .map(([topic, count], i) => {
                  const total = Object.values(totalByTopic).reduce((s, v) => s + v, 0);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  const color = COLORS[topics.indexOf(topic) % COLORS.length];
                  return (
                    <div key={topic} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topic}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0, marginLeft: '8px' }}>{count} paper{count !== 1 ? 's' : ''} · {pct}%</span>
                        </div>
                        <div style={{ height: '4px', background: 'rgba(30,41,59,0.8)', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '99px', transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </>
      )}


      {trends.length === 0 && !error && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px' }}>No trend data yet. Upload papers and run analysis.</div>
      )}
    </div>
  );
}
