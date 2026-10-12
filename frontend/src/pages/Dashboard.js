import React, { useEffect, useState } from 'react';
import { getPapers, getSummary } from '../utils/api';

const STEP_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

export default function Dashboard({ setPage }) {
  const [papers, setPapers] = useState([]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPapers().then(r => setPapers(r.data)).catch(() => {});
  }, []);

  const loadSummary = () => {
    setLoading(true);
    getSummary()
      .then(r => setSummary(r.data.summary))
      .catch(() => setSummary('Run analysis first to generate a summary.'))
      .finally(() => setLoading(false));
  };

  const stats = [
    { label: 'Papers Uploaded', value: papers.length, color: '#3b82f6', glow: 'rgba(59,130,246,0.2)', icon: '📄', action: () => setPage('upload') },
    { label: 'Topic Clusters', value: 'Explore →', color: '#8b5cf6', glow: 'rgba(139,92,246,0.2)', icon: '◎', action: () => setPage('clusters') },
    { label: 'Research Gaps', value: 'Find →', color: '#10b981', glow: 'rgba(16,185,129,0.2)', icon: '◻', action: () => setPage('gaps') },
    { label: 'AI Suggestions', value: 'View →', color: '#f59e0b', glow: 'rgba(245,158,11,0.2)', icon: '✦', action: () => setPage('insights') },
  ];

  const steps = [
    { step: '01', title: 'Upload Papers', desc: 'Drag & drop up to 100 PDF research papers', page: 'upload', color: '#3b82f6' },
    { step: '02', title: 'AI Clusters', desc: 'BERTopic & embeddings map your topic landscape', page: 'clusters', color: '#8b5cf6' },
    { step: '03', title: 'Detect Gaps', desc: 'Underexplored areas surface automatically', page: 'gaps', color: '#10b981' },
    { step: '04', title: 'Get Insights', desc: 'LLM generates actionable future directions', page: 'insights', color: '#f59e0b' },
  ];

  return (
    <div className="fade-in" style={{ maxWidth: '1100px' }}>
      {/* Hero section */}
      <div style={{
        marginBottom: '40px',
        padding: '40px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.6))',
        border: '1px solid rgba(59,130,246,0.2)',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
      }}>
        {/* Background orbs */}
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '240px', height: '240px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.12), transparent)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-40px', left: '30%',
          width: '180px', height: '180px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.1), transparent)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{
              padding: '4px 12px', borderRadius: '99px',
              background: 'rgba(59,130,246,0.15)',
              border: '1px solid rgba(59,130,246,0.25)',
              fontSize: '11px', fontWeight: 600, color: '#93c5fd',
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              <span className="pulse-dot" style={{ marginRight: '6px' }} />
              AI Research Platform
            </span>
          </div>
          <h1 style={{
            fontSize: '42px',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: '14px',
            lineHeight: 1.1,
          }}>
            Discover What's{' '}
            <span className="gradient-text">Missing</span>
            {' '}in Research
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '560px', lineHeight: 1.7, marginBottom: '28px' }}>
            Upload research papers and let AI discover topic clusters, identify trends, surface unexplored gaps, and generate actionable future directions — in minutes.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => setPage('upload')} style={{ fontSize: '15px', padding: '12px 28px' }}>
              ↑ Upload Papers
            </button>
            <button className="btn btn-ghost" onClick={() => setPage('insights')} style={{ fontSize: '14px' }}>
              ✦ View AI Insights
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {stats.map((s, i) => (
          <div key={i} className="stat-card" onClick={s.action}
            style={{ animationDelay: `${i * 0.06}s` }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = s.color + '50';
              e.currentTarget.style.boxShadow = `0 12px 40px ${s.glow}, 0 0 0 1px ${s.color}30`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(51,65,85,0.6)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: `${s.glow}`,
              border: `1px solid ${s.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', marginBottom: '14px',
            }}>{s.icon}</div>
            <div style={{
              fontSize: '30px', fontWeight: 800,
              color: s.color,
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.02em',
              lineHeight: 1,
              marginBottom: '6px',
            }}>{s.value}</div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '20px' }}>
          <div className="section-title" style={{ marginBottom: '4px' }}>How It Works</div>
          <p className="section-sub" style={{ marginBottom: 0 }}>Four steps from raw PDFs to AI-powered research directions</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {steps.map((s, i) => (
            <div key={s.step} onClick={() => setPage(s.page)}
              style={{
                padding: '20px',
                borderRadius: '12px',
                background: 'var(--surface-2)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: '1px solid transparent',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = s.color + '40';
                e.currentTarget.style.background = `rgba(${i === 0 ? '59,130,246' : i === 1 ? '139,92,246' : i === 2 ? '16,185,129' : '245,158,11'},0.08)`;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.background = 'var(--surface-2)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
              <div style={{
                fontSize: '11px', color: s.color, fontWeight: 800,
                letterSpacing: '0.06em', marginBottom: '12px',
                fontFamily: 'var(--font-display)',
              }}>STEP {s.step}</div>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: s.color + '20', border: `1px solid ${s.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', marginBottom: '12px',
              }}>
                {['↑','◎','◻','✦'][i]}
              </div>
              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>{s.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Summary */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div className="section-title" style={{ marginBottom: '4px' }}>AI Executive Summary</div>
            <p className="section-sub" style={{ marginBottom: 0 }}>LLM-generated overview of your research landscape</p>
          </div>
          <button className="btn btn-primary" onClick={loadSummary} disabled={loading}>
            {loading ? <><span className="spinner" /> Generating...</> : '✦ Generate Summary'}
          </button>
        </div>
        {summary ? (
          <div style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(139,92,246,0.06))',
            borderRadius: '12px', padding: '20px',
            color: 'var(--text-secondary)', lineHeight: 1.85, fontSize: '14px',
            border: '1px solid rgba(59,130,246,0.15)',
          }}>
            {summary}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
              ✦
            </div>
            <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-secondary)' }}>No summary yet</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '340px' }}>
              Upload papers and run analysis, then click "Generate Summary" for an AI-powered overview.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
