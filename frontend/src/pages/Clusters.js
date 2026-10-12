import React, { useEffect, useState } from 'react';
import { getClusters } from '../utils/api';

const ACCENT_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#ef4444'];
const BADGE_CLASSES = ['badge-blue', 'badge-purple', 'badge-green', 'badge-orange', 'badge-cyan'];

export default function Clusters() {
  const [clusters, setClusters] = useState({});
  const [details, setDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getClusters()
      .then(r => {
        const payload = r.data || {};
        const clusterMap = payload.clusters || payload;
        setClusters(clusterMap);
        setDetails(payload.details || payload.cluster_details || {});
        setSelected(Object.keys(clusterMap)[0] || null);
      })
      .catch(() => setError('Run analysis first from the Upload page.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', gap: '14px', color: 'var(--text-secondary)' }}>
      <span className="spinner" style={{ width: '24px', height: '24px' }} />
      <span style={{ fontSize: '14px' }}>Loading topic clusters...</span>
    </div>
  );

  const keys = Object.keys(clusters);
  const totalPapers = keys.reduce((acc, k) => acc + clusters[k].length, 0);
  const selectedColor = ACCENT_COLORS[keys.indexOf(selected) % ACCENT_COLORS.length];
  const selectedDetail = selected ? details[selected] || {} : {};
  const connectivity = selectedDetail.connectivity || {};

  return (
    <div className="fade-in" style={{ maxWidth: '1100px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(139,92,246,0.15))',
            border: '1px solid rgba(59,130,246,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
          }}>◎</div>
          <h2 className="section-title" style={{ fontSize: '26px' }}>Topic Clusters</h2>
        </div>
        <p className="section-sub">
          BERTopic groups your papers into semantic clusters based on content similarity using neural embeddings.
        </p>
      </div>

      {error && <div className="alert-error">⚠ {error}</div>}

      {keys.length > 0 && (
        <>
          {/* Stats bar */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div style={{
              padding: '12px 20px', borderRadius: '10px',
              background: 'rgba(59,130,246,0.08)',
              border: '1px solid rgba(59,130,246,0.2)',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <span style={{ fontSize: '20px' }}>◎</span>
              <div>
                <div style={{ fontWeight: 700, color: '#60a5fa', fontSize: '18px' }}>{keys.length}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Clusters</div>
              </div>
            </div>
            <div style={{
              padding: '12px 20px', borderRadius: '10px',
              background: 'rgba(139,92,246,0.08)',
              border: '1px solid rgba(139,92,246,0.2)',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <span style={{ fontSize: '20px' }}>📄</span>
              <div>
                <div style={{ fontWeight: 700, color: '#c4b5fd', fontSize: '18px' }}>{totalPapers}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Papers</div>
              </div>
            </div>
          </div>

          <div className="clusters-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 280px) minmax(0, 1fr)', gap: '20px', alignItems: 'start' }}>
            {/* Cluster sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px', paddingLeft: '4px' }}>
                All Clusters
              </div>
              {keys.map((k, i) => {
                const isSelected = selected === k;
                const color = ACCENT_COLORS[i % ACCENT_COLORS.length];
                const pct = Math.round((clusters[k].length / totalPapers) * 100);
                return (
                  <div key={k} onClick={() => setSelected(k)} style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    background: isSelected
                      ? `linear-gradient(135deg, ${color}18, ${color}08)`
                      : 'rgba(15,23,42,0.6)',
                    border: `1px solid ${isSelected ? color + '40' : 'rgba(51,65,85,0.4)'}`,
                    transition: 'all 0.18s',
                    backdropFilter: 'blur(12px)',
                    boxShadow: isSelected ? `0 0 20px ${color}10` : 'none',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = color + '30'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'rgba(51,65,85,0.4)'; }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{
                        fontWeight: 600, fontSize: '13px',
                        color: isSelected ? color : 'var(--text-primary)',
                        transition: 'color 0.18s',
                        lineHeight: 1.3,
                        flex: 1, paddingRight: '8px',
                      }}>{k}</div>
                      <span className={BADGE_CLASSES[i % BADGE_CLASSES.length]} style={{ fontSize: '10.5px', flexShrink: 0 }}>
                        {clusters[k].length}
                      </span>
                    </div>
                    {/* Mini progress bar */}
                    <div style={{ height: '3px', background: 'rgba(30,41,59,0.8)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: color,
                        borderRadius: '99px',
                        boxShadow: `0 0 6px ${color}50`,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '5px' }}>
                      {pct}% of corpus
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Papers in selected cluster */}
            <div className="card" style={{ borderColor: selected ? `${selectedColor}30` : undefined }}>
              {selected && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div>
                      <div style={{
                        fontWeight: 800, fontSize: '18px',
                        fontFamily: 'var(--font-display)',
                        color: selectedColor,
                        marginBottom: '6px',
                      }}>{selected}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {clusters[selected].length} papers in this cluster ·{' '}
                        {Math.round((clusters[selected].length / totalPapers) * 100)}% of corpus
                      </div>
                    </div>
                    <span className={BADGE_CLASSES[keys.indexOf(selected) % BADGE_CLASSES.length]}>
                      {clusters[selected].length} papers
                    </span>
                  </div>
                  <section className="cluster-analysis" aria-label={`${selected} cluster analysis`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '15px' }}>Cluster evidence</h3>
                      <span className="badge badge-cyan">AI-assisted semantic analysis</span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '14px' }}>
                      {selectedDetail.method || 'Semantic embedding analysis'} · corpus terms are ranked with TF-IDF
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <div className="cluster-detail-label">Recurring corpus terms</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {(selectedDetail.keywords || []).length > 0
                          ? selectedDetail.keywords.map(term => <span key={term} className="tag">{term}</span>)
                          : <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No discriminative terms could be extracted from these papers.</span>}
                      </div>
                    </div>

                    <div className="cluster-evidence-grid">
                      <div>
                        <div className="cluster-detail-label">Publication coverage</div>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{selectedDetail.year_range || 'Not available'}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                          {(selectedDetail.year_distribution || []).map(entry => (
                            <span key={entry.year} className="tag">{entry.year}: {entry.papers}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="cluster-detail-label">Most representative paper</div>
                        <div style={{ fontSize: '12.5px', lineHeight: 1.5 }}>{selectedDetail.representative_paper?.title || 'Not available'}</div>
                        {selectedDetail.representative_paper && (
                          <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '5px' }}>
                            Mean cosine similarity to cluster peers: {selectedDetail.representative_paper.mean_similarity.toFixed(3)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', marginTop: '16px', paddingTop: '14px' }}>
                      <div className="cluster-detail-label">Cluster connectivity</div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.6, marginBottom: '12px' }}>
                        {connectivity.explanation || 'Direct links are calculated from pairwise semantic similarity between the papers.'}
                      </p>
                      <div className="cluster-connectivity-stats">
                        <div><strong>{connectivity.connected_pairs ?? 0}</strong><span>direct links</span></div>
                        <div><strong>{connectivity.components ?? clusters[selected].length}</strong><span>connected components</span></div>
                        <div><strong>{Math.round((connectivity.density || 0) * 100)}%</strong><span>link density</span></div>
                        <div><strong>{(connectivity.mean_similarity || 0).toFixed(3)}</strong><span>mean cosine similarity</span></div>
                      </div>
                      <div style={{ marginTop: '12px' }}>
                        <div className="cluster-detail-label">Strongest paper-to-paper links</div>
                        {(connectivity.strongest_links || []).length > 0 ? (
                          <div className="cluster-links">
                            {connectivity.strongest_links.map(link => (
                              <div key={`${link.source_id}-${link.target_id}`} className="cluster-link-row">
                                <span>{link.source_title}</span>
                                <span className="cluster-link-score">{link.similarity.toFixed(3)}</span>
                                <span>{link.target_title}</span>
                              </div>
                            ))}
                          </div>
                        ) : connectivity.strongest_pair ? (
                          <div className="cluster-link-row">
                            <span>{connectivity.strongest_pair.source_title}</span>
                            <span className="cluster-link-score">{connectivity.strongest_pair.similarity.toFixed(3)} · below threshold</span>
                            <span>{connectivity.strongest_pair.target_title}</span>
                          </div>
                        ) : (
                          <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>At least two papers are needed to calculate links.</div>
                        )}
                      </div>
                    </div>
                  </section>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px', margin: '20px 0 10px' }}>
                    <h3 style={{ fontSize: '15px' }}>Papers in this cluster</h3>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Each paper is a cluster node</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '540px', overflowY: 'auto' }}>
                    {clusters[selected].map((p, pi) => (
                      <div key={p.id} className="stagger-item" style={{
                        padding: '16px',
                        background: 'rgba(30,41,59,0.5)',
                        borderRadius: '10px',
                        borderLeft: `3px solid ${selectedColor}`,
                        border: `1px solid rgba(51,65,85,0.3)`,
                        borderLeftColor: selectedColor,
                        transition: 'all 0.18s',
                        animationDelay: `${pi * 0.04}s`,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = `${selectedColor}08`;
                        e.currentTarget.style.borderColor = `${selectedColor}30`;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(30,41,59,0.5)';
                        e.currentTarget.style.borderColor = 'rgba(51,65,85,0.3)';
                        e.currentTarget.style.borderLeftColor = selectedColor;
                      }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px', lineHeight: 1.4 }}>{p.title}</div>
                        {p.abstract && (
                          <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '10px' }}>
                            {p.abstract}{p.abstract.length >= 1200 ? '…' : ''}
                          </div>
                        )}
                        <span className="badge badge-purple" style={{ fontSize: '10.5px' }}>{p.year}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {keys.length === 0 && !error && (
        <div className="card empty-state">
          <div className="empty-state-icon" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>◎</div>
          <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-secondary)' }}>No clusters yet</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Upload papers and run analysis to discover topic clusters.</div>
        </div>
      )}
    </div>
  );
}
