import React, { useState } from 'react';

const navItems = [
  { id: 'dashboard', icon: '⬡', label: 'Dashboard', desc: 'Overview' },
  { id: 'upload', icon: '↑', label: 'Upload Papers', desc: 'Add PDFs' },
  { id: 'clusters', icon: '◎', label: 'Topic Clusters', desc: 'AI Groupings' },
  { id: 'trends', icon: '↗', label: 'Trends', desc: 'Over Time' },
  { id: 'gaps', icon: '◻', label: 'Research Gaps', desc: 'Opportunities' },
  { id: 'graph', icon: '⬡', label: 'Knowledge Graph', desc: 'Connections' },
  { id: 'insights', icon: '✦', label: 'AI Insights', desc: 'Suggestions' },
];

export default function Sidebar({ page, setPage }) {
  const [hovered, setHovered] = useState(null);

  return (
    <aside style={{
      width: '240px',
      minHeight: '100vh',
      background: 'rgba(8,14,28,0.92)',
      borderRight: '1px solid rgba(51,65,85,0.5)',
      padding: '20px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      flexShrink: 0,
      backdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
    }}>

      {/* Logo */}
      <div style={{ padding: '10px 12px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={{
            width: '34px', height: '34px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px',
            boxShadow: '0 4px 16px rgba(59,130,246,0.4)',
          }}>🔬</div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '17px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #f1f5f9, #94a3b8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}>
              Research<span style={{ WebkitTextFillColor: '#60a5fa' }}>Lens</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              AI Gap Discovery
            </div>
          </div>
        </div>
        <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(59,130,246,0.3), transparent)', marginTop: '4px' }} />
      </div>

      {/* Nav label */}
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 14px 8px' }}>
        Navigation
      </div>

      {navItems.map(item => {
        const isActive = page === item.id;
        const isHovered = hovered === item.id && !isActive;
        return (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            onMouseEnter={() => setHovered(item.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '10px',
              border: isActive ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              background: isActive
                ? 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(139,92,246,0.10))'
                : isHovered ? 'rgba(255,255,255,0.04)' : 'transparent',
              transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: isActive ? '0 0 20px rgba(59,130,246,0.08), inset 0 1px 0 rgba(255,255,255,0.05)' : 'none',
            }}
          >
            <div style={{
              width: '32px', height: '32px',
              borderRadius: '8px',
              background: isActive ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '15px',
              transition: 'all 0.18s',
              color: isActive ? 'var(--accent-light)' : 'var(--text-muted)',
              flexShrink: 0,
            }}>
              {item.icon}
            </div>
            <div>
              <div style={{
                fontSize: '13.5px',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--accent-light)' : isHovered ? 'var(--text-primary)' : 'var(--text-secondary)',
                transition: 'color 0.18s',
                lineHeight: 1.2,
              }}>
                {item.label}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '1px' }}>
                {item.desc}
              </div>
            </div>
            {isActive && (
              <div style={{
                marginLeft: 'auto',
                width: '6px', height: '6px',
                borderRadius: '50%',
                background: 'var(--accent)',
                boxShadow: '0 0 8px var(--accent)',
              }} />
            )}
          </button>
        );
      })}

      {/* Footer */}
      <div style={{ marginTop: 'auto', padding: '16px 14px 4px' }}>
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(51,65,85,0.6), transparent)', marginBottom: '14px' }} />
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Powered by</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {['BERTopic', 'SentenceTransformers', 'HuggingFace'].map(t => (
            <span key={t} style={{
              fontSize: '10.5px',
              padding: '2px 7px',
              borderRadius: '4px',
              background: 'rgba(59,130,246,0.08)',
              color: 'var(--text-muted)',
              border: '1px solid rgba(59,130,246,0.12)',
            }}>{t}</span>
          ))}
        </div>
      </div>
    </aside>
  );
}
