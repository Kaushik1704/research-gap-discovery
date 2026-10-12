import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadPapers, getPapers, clearPapers, runAnalysis } from '../utils/api';

export default function Upload({ setPage, setAnalysisReady }) {
  const [papers, setPapers] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    getPapers().then(r => setPapers(r.data)).catch(() => {});
  }, []);

  const onDrop = useCallback(async (acceptedFiles) => {
    const pdfs = acceptedFiles.filter(f => f.type === 'application/pdf');
    if (!pdfs.length) { setError('Only PDF files are accepted.'); return; }
    setUploading(true);
    setError('');
    setUploadStatus('');
    setProgress(0);
    const interval = setInterval(() => setProgress(p => Math.min(p + 8, 85)), 200);
    try {
      const res = await uploadPapers(pdfs);
      clearInterval(interval);
      setProgress(100);
      setUploadStatus(`✓ ${res.data.uploaded} paper(s) uploaded successfully.`);
      const list = await getPapers();
      setPapers(list.data);
      setTimeout(() => setProgress(0), 1200);
    } catch (e) {
      clearInterval(interval);
      setProgress(0);
      setError('Upload failed. Make sure the backend is running.');
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/pdf': ['.pdf'] }, multiple: true
  });

  const handleClear = async () => {
    await clearPapers();
    setPapers([]);
    setUploadStatus('');
    setAnalysisReady(false);
  };

  const handleAnalyze = async () => {
    if (papers.length < 2) { setError('Upload at least 2 papers to run analysis.'); return; }
    setAnalyzing(true);
    setError('');
    setProgress(0);
    const interval = setInterval(() => setProgress(p => Math.min(p + 3, 90)), 400);
    try {
      await runAnalysis();
      clearInterval(interval);
      setProgress(100);
      setAnalysisReady(true);
      setUploadStatus('✓ Analysis complete! Explore the results in the sidebar.');
      setTimeout(() => setProgress(0), 1200);
    } catch (e) {
      clearInterval(interval);
      setProgress(0);
      setError('Analysis failed. Check that all dependencies are installed.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '860px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(59,130,246,0.1))',
            border: '1px solid rgba(59,130,246,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
          }}>↑</div>
          <h2 className="section-title" style={{ fontSize: '26px' }}>Upload Research Papers</h2>
        </div>
        <p className="section-sub">
          Upload up to 100 PDF papers. The AI pipeline will extract metadata, generate embeddings, and prepare them for analysis.
        </p>
      </div>

      {/* Dropzone */}
      <div {...getRootProps()} style={{
        border: `2px dashed ${isDragActive ? 'rgba(59,130,246,0.7)' : 'rgba(51,65,85,0.7)'}`,
        borderRadius: '16px',
        padding: '56px 32px',
        textAlign: 'center',
        cursor: 'pointer',
        background: isDragActive
          ? 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.06))'
          : 'rgba(15,23,42,0.6)',
        backdropFilter: 'blur(16px)',
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        marginBottom: '20px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isDragActive ? '0 0 40px rgba(59,130,246,0.15), inset 0 0 40px rgba(59,130,246,0.04)' : 'none',
      }}>
        <input {...getInputProps()} />

        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '300px', height: '300px', borderRadius: '50%',
          background: isDragActive ? 'radial-gradient(circle, rgba(59,130,246,0.08), transparent)' : 'transparent',
          transition: 'all 0.4s',
          pointerEvents: 'none',
        }} />

        <div style={{
          width: '72px', height: '72px', borderRadius: '18px',
          background: isDragActive
            ? 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(139,92,246,0.2))'
            : 'rgba(30,41,59,0.8)',
          border: `1px solid ${isDragActive ? 'rgba(59,130,246,0.4)' : 'rgba(51,65,85,0.6)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '32px', margin: '0 auto 18px',
          transition: 'all 0.25s',
          boxShadow: isDragActive ? '0 8px 32px rgba(59,130,246,0.25)' : 'none',
        }}>
          {uploading ? '⏳' : isDragActive ? '⬇' : '📂'}
        </div>

        <div style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>
          {isDragActive ? 'Release to upload' : 'Drag & drop PDF files here'}
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '22px' }}>
          or click to browse — supports multiple files at once
        </div>
        <button className="btn btn-primary" onClick={e => e.stopPropagation()} style={{ pointerEvents: 'none', fontSize: '14px' }}>
          {uploading ? <><span className="spinner" /> Uploading...</> : '↑ Select PDFs'}
        </button>
      </div>

      {/* Progress bar */}
      {progress > 0 && (
        <div style={{
          height: '3px', borderRadius: '99px',
          background: 'rgba(30,41,59,0.8)',
          marginBottom: '16px', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
            borderRadius: '99px',
            transition: 'width 0.3s ease',
            boxShadow: '0 0 10px rgba(59,130,246,0.5)',
          }} />
        </div>
      )}

      {/* Feedback */}
      {error && <div className="alert-error">⚠ {error}</div>}
      {uploadStatus && <div className="alert-success">✓ {uploadStatus}</div>}

      {/* Actions */}
      {papers.length > 0 && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleAnalyze} disabled={analyzing} style={{ fontSize: '14px' }}>
            {analyzing
              ? <><span className="spinner" /> Analyzing {papers.length} papers...</>
              : `✦ Run AI Analysis (${papers.length} paper${papers.length > 1 ? 's' : ''})`}
          </button>
          <button className="btn btn-ghost" onClick={handleClear} style={{ fontSize: '13px' }}>
            🗑 Clear All
          </button>
        </div>
      )}

      {/* Papers list */}
      {papers.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', fontFamily: 'var(--font-display)' }}>Uploaded Papers</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {papers.length} document{papers.length > 1 ? 's' : ''} ready for analysis
              </div>
            </div>
            <span className="badge badge-blue">{papers.length} papers</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '440px', overflowY: 'auto' }}>
            {papers.map((p, i) => (
              <div key={p.id} className="stagger-item" style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 16px',
                background: 'rgba(30,41,59,0.5)',
                borderRadius: '10px',
                border: '1px solid rgba(51,65,85,0.4)',
                transition: 'all 0.18s',
                animationDelay: `${i * 0.04}s`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.25)';
                e.currentTarget.style.background = 'rgba(59,130,246,0.06)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(51,65,85,0.4)';
                e.currentTarget.style.background = 'rgba(30,41,59,0.5)';
              }}>
                <div className="num-badge" style={{
                  background: 'rgba(59,130,246,0.12)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  color: 'var(--accent-light)',
                }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 500, fontSize: '13.5px',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    color: 'var(--text-primary)',
                  }}>{p.title}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>{p.filename}</div>
                </div>
                <span className="badge badge-purple" style={{ fontSize: '11px' }}>{p.year}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {papers.length === 0 && (
        <div className="card empty-state">
          <div className="empty-state-icon" style={{ background: 'rgba(51,65,85,0.4)', border: '1px solid rgba(51,65,85,0.6)' }}>
            📭
          </div>
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '15px' }}>No papers uploaded</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Start by dragging PDF files into the zone above.</div>
        </div>
      )}
    </div>
  );
}
