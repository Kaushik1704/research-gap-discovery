import React, { useEffect, useState } from 'react';
import { getGaps } from '../utils/api';

function PapersTable({ papers }) {
  if (!papers || papers.length === 0) {
    return (
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '10px 0' }}>
        No papers found in this cluster.
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
      {papers.map((p, idx) => (
        <div key={p.id || idx} style={{
          background: 'rgba(15,23,42,0.5)',
          border: '1px solid rgba(51,65,85,0.5)',
          borderRadius: '10px',
          padding: '12px 14px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {p.title || 'Untitled'}
            </span>
            {p.year && (
              <span style={{
                flexShrink: 0,
                fontSize: '11px', fontWeight: 600,
                padding: '2px 8px', borderRadius: '99px',
                background: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(59,130,246,0.25)',
                color: '#93c5fd',
              }}>{p.year}</span>
            )}
          </div>
          {p.abstract && (
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              {p.abstract.length > 280 ? p.abstract.slice(0, 280) + '…' : p.abstract}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Gaps() {
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    getGaps()
      .then(r => setGaps(r.data))
      .catch(() => setError('Run analysis first from the Upload page.'))
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (i) => setExpanded(prev => ({ ...prev, [i]: !prev[i] }));

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', gap: '14px', color: 'var(--text-secondary)' }}>
      <span className="spinner" style={{ width: '24px', height: '24px' }} />
      <span style={{ fontSize: '14px' }}>Loading research gaps...</span>
    </div>
  );

  return (
    <div className="fade-in" style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(239,68,68,0.15))',
            border: '1px solid rgba(245,158,11,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
          }}>◻</div>
          <h2 className="section-title" style={{ fontSize: '26px' }}>Research Gaps</h2>
        </div>
        <p className="section-sub">
          Topics with disproportionately low coverage relative to the overall literature — your opportunities for novel contribution.
        </p>
      </div>

      {error && <div className="alert-error">⚠ {error}</div>}

      {gaps.length > 0 ? (
        <>
          {/* Summary banner */}
          <div style={{
            padding: '18px 22px',
            marginBottom: '28px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(239,68,68,0.06))',
            border: '1px solid rgba(245,158,11,0.25)',
            display: 'flex', alignItems: 'center', gap: '16px',
            backdropFilter: 'blur(12px)',
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: 'rgba(245,158,11,0.15)',
              border: '1px solid rgba(245,158,11,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px', flexShrink: 0,
            }}>⚠️</div>
            <div>
              <div style={{ fontWeight: 700, color: '#fcd34d', fontSize: '16px', fontFamily: 'var(--font-display)' }}>
                {gaps.length} Research Gap{gaps.length !== 1 ? 's' : ''} Detected
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                These areas are significantly underrepresented in your uploaded literature — prime candidates for novel research.
              </div>
            </div>
            <span className="badge badge-orange" style={{ marginLeft: 'auto', flexShrink: 0 }}>
              {gaps.length} gap{gaps.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {gaps.map((gap, i) => (
              <div key={i} className="card stagger-item" style={{
                borderLeft: '3px solid #f59e0b',
                animationDelay: `${i * 0.07}s`,
                transition: 'all 0.22s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(245,158,11,0.5)';
                e.currentTarget.style.boxShadow = '0 0 32px rgba(245,158,11,0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(51,65,85,0.6)';
                e.currentTarget.style.boxShadow = 'none';
              }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <div style={{
                      fontWeight: 700, fontSize: '17px', marginBottom: '8px',
                      fontFamily: 'var(--font-display)',
                    }}>{gap.topic}</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="badge badge-orange">
                        {gap.paper_count} paper{gap.paper_count !== 1 ? 's' : ''}
                      </span>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '4px 12px', borderRadius: '99px',
                        background: 'rgba(239,68,68,0.1)', color: '#fca5a5',
                        border: '1px solid rgba(239,68,68,0.2)',
                        fontSize: '11.5px', fontWeight: 600,
                      }}>
                        {gap.coverage_percent}% coverage
                      </span>
                      {gap.year_range && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center',
                          padding: '4px 12px', borderRadius: '99px',
                          background: 'rgba(59,130,246,0.08)', color: '#93c5fd',
                          border: '1px solid rgba(59,130,246,0.2)',
                          fontSize: '11.5px', fontWeight: 600,
                        }}>
                          {gap.year_range}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: 'rgba(245,158,11,0.1)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '22px', flexShrink: 0,
                  }}>◻</div>
                </div>

                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
                  {gap.reason}
                </p>

                {/* Coverage bar */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '7px' }}>
                    <span>Literature coverage</span>
                    <span style={{ color: '#fcd34d', fontWeight: 600 }}>{gap.coverage_percent}%</span>
                  </div>
                  <div style={{ height: '5px', background: 'rgba(30,41,59,0.8)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.max(gap.coverage_percent, 2)}%`,
                      background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
                      borderRadius: '99px',
                      boxShadow: '0 0 8px rgba(245,158,11,0.4)',
                    }} />
                  </div>
                </div>

                {/* Cluster paper comparison — collapsible */}
                {gap.cluster_papers && gap.cluster_papers.length > 0 && (
                  <div style={{
                    borderTop: '1px solid rgba(51,65,85,0.5)',
                    paddingTop: '14px',
                  }}>
                    <button
                      onClick={() => toggleExpand(i)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600,
                        padding: '4px 0', marginBottom: expanded[i] ? '12px' : '0',
                      }}
                    >
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '18px', height: '18px',
                        borderRadius: '50%',
                        background: 'rgba(245,158,11,0.15)',
                        border: '1px solid rgba(245,158,11,0.3)',
                        fontSize: '10px', color: '#fcd34d',
                        transform: expanded[i] ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                      }}>▼</span>
                      {expanded[i] ? 'Hide' : 'Compare'} {gap.cluster_papers.length} paper{gap.cluster_papers.length !== 1 ? 's' : ''} in this cluster
                    </button>

                    {expanded[i] && (
                      <div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '10px', fontStyle: 'italic' }}>
                          These are the existing papers in the "{gap.topic}" cluster. The gap lies in what's <em>missing</em> relative to other clusters.
                        </div>
                        <PapersTable papers={gap.cluster_papers} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        !error && (
          <div className="card empty-state">
            <div className="empty-state-icon" style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.2)',
              fontSize: '32px',
            }}>✓</div>
            <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--success)' }}>No significant gaps detected</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '380px' }}>
              Upload more papers or run analysis first to detect research gaps. A diverse corpus will surface more nuanced gaps.
            </div>
          </div>
        )
      )}
    </div>
  );
}
