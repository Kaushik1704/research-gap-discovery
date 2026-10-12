import React, { useState } from 'react';
import { getSuggestions } from '../utils/api';

const ACCENT_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4'];
const ICONS = ['🔬', '🧠', '📊', '🌐', '⚡'];

export default function Insights() {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  const loadSuggestions = () => {
    setLoading(true);
    setError('');
    setSuggestions(null);
    getSuggestions()
      .then(r => setSuggestions(r.data))
      .catch(() => setError('Run analysis first from the Upload page.'))
      .finally(() => setLoading(false));
  };

  return (
    <div className="fade-in" style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.15))',
            border: '1px solid rgba(139,92,246,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
          }}>✦</div>
          <h2 className="section-title" style={{ fontSize: '26px' }}>AI Insights & Future Directions</h2>
        </div>
        <p className="section-sub">
          The LLM analyzes your research landscape and detected gaps to suggest the most promising directions for future work.
        </p>
      </div>

      {!suggestions && !loading && (
        <div style={{
          padding: '64px 32px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.6))',
          border: '1px solid rgba(139,92,246,0.2)',
          textAlign: 'center',
          marginBottom: '24px',
          backdropFilter: 'blur(20px)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative orbs */}
          <div style={{
            position: 'absolute', top: '-60px', right: '-40px',
            width: '200px', height: '200px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.12), transparent)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '-40px', left: '20%',
            width: '160px', height: '160px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.08), transparent)',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(59,130,246,0.15))',
              border: '1px solid rgba(139,92,246,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '36px', margin: '0 auto 24px',
              boxShadow: '0 8px 32px rgba(139,92,246,0.2)',
            }}>✦</div>
            <h3 style={{
              fontSize: '24px', fontFamily: 'var(--font-display)',
              fontWeight: 700, marginBottom: '10px',
            }}>
              Generate <span className="gradient-text">AI Research Suggestions</span>
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '480px', margin: '0 auto 28px', lineHeight: 1.7 }}>
              The AI will analyze your topic clusters and research gaps to generate 5 specific, verified, and actionable future research directions.
            </p>
            <button className="btn btn-accent2" onClick={loadSuggestions} style={{ fontSize: '15px', padding: '13px 32px' }}>
              ✦ Generate Insights
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '56px', marginBottom: '24px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            border: '3px solid rgba(139,92,246,0.2)',
            borderTopColor: '#8b5cf6',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 20px',
          }} />
          <div style={{ fontWeight: 600, fontSize: '17px', marginBottom: '8px' }}>Analyzing Research Landscape</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            The LLM is reviewing your clusters, trends, and gaps…
          </div>
        </div>
      )}

      {error && (
        <div className="alert-error" style={{ marginBottom: '20px' }}>
          ⚠ {error}
        </div>
      )}

      {suggestions && (
        <>
          {/* Status bar */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '24px', padding: '14px 20px',
            borderRadius: '12px',
            background: suggestions.source === 'huggingface'
              ? 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.07))'
              : 'rgba(30,41,59,0.6)',
            border: `1px solid ${suggestions.source === 'huggingface' ? 'rgba(139,92,246,0.25)' : 'rgba(51,65,85,0.5)'}`,
            backdropFilter: 'blur(12px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className={suggestions.source === 'huggingface' ? 'badge badge-purple' : 'badge badge-blue'}>
                {suggestions.source === 'huggingface' ? '🤗 HuggingFace LLM' : '⚙️ Rule-based'}
              </span>
              {suggestions.source !== 'huggingface' && (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Set HF_TOKEN in backend .env for full LLM responses
                </span>
              )}
            </div>
            <button className="btn btn-ghost" style={{ fontSize: '13px', padding: '8px 16px' }} onClick={loadSuggestions}>
              ↺ Regenerate
            </button>
          </div>

          {/* Raw LLM output */}
          {suggestions.suggestions_text && (
            <div className="card border-glow-purple" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: 'rgba(139,92,246,0.2)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '14px',
                }}>✦</div>
                <div style={{ fontWeight: 700, color: '#c4b5fd', fontSize: '15px' }}>LLM Generated Analysis</div>
              </div>
              <div style={{
                whiteSpace: 'pre-wrap', fontSize: '13.5px',
                color: 'var(--text-secondary)', lineHeight: 1.85,
                background: 'rgba(139,92,246,0.05)',
                borderRadius: '10px', padding: '18px',
                border: '1px solid rgba(139,92,246,0.1)',
              }}>
                {suggestions.suggestions_text}
              </div>
            </div>
          )}

          {/* Structured suggestions */}
          {suggestions.suggestions && suggestions.suggestions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px', fontFamily: 'var(--font-display)' }}>
                Suggested Research Directions
              </div>
              {suggestions.suggestions.map((s, i) => {
                const color = ACCENT_COLORS[i % ACCENT_COLORS.length];
                const isExpanded = expanded === i;
                return (
                  <div key={i} className="card stagger-item" style={{
                    borderLeft: `3px solid ${color}`,
                    cursor: 'pointer',
                    transition: 'all 0.22s',
                    animationDelay: `${i * 0.07}s`,
                    boxShadow: isExpanded ? `0 0 32px ${color}18` : 'none',
                    borderColor: isExpanded ? color + '50' : undefined,
                  }}
                  onClick={() => setExpanded(isExpanded ? null : i)}
                  onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.borderLeftColor = color; }}
                  onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.borderLeftColor = color; }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '12px',
                        background: `${color}18`,
                        border: `1px solid ${color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '22px', flexShrink: 0,
                        boxShadow: `0 4px 16px ${color}20`,
                      }}>
                        {ICONS[i % ICONS.length]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{
                            fontWeight: 700, fontSize: '16px',
                            color: color, marginBottom: '6px',
                            fontFamily: 'var(--font-display)',
                          }}>{s.title}</div>
                          <div style={{
                            fontSize: '18px', color: 'var(--text-muted)',
                            transition: 'transform 0.2s',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          }}>⌄</div>
                        </div>
                        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                          {s.description}
                        </p>
                        {isExpanded && (
                          <div style={{
                            marginTop: '14px', padding: '12px 16px',
                            background: `${color}0a`,
                            borderRadius: '8px',
                            border: `1px solid ${color}20`,
                            animation: 'fadeIn 0.25s ease',
                          }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: color, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
                              Addresses Gap
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                              {s.addresses_gap}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: '24px' }}>
            <button className="btn btn-ghost" onClick={() => { setSuggestions(null); setExpanded(null); }}>
              ← Start Over
            </button>
          </div>
        </>
      )}
    </div>
  );
}
