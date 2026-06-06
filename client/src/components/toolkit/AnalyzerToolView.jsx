import React, { useState, useCallback } from 'react';
import { getToolConfig } from './toolConfig';
import api from '../../services/api';

/**
 * AnalyzerToolView — Template for analysis tools (VirusTotal, WHOIS, SSL).
 *
 * Features:
 *  • Target input + "Analyze" button
 *  • Structured report cards (icon, label, value)
 *  • Risk score visualisation
 *  • Loading skeleton cards
 */
const AnalyzerToolView = ({ toolId }) => {
  const tool = getToolConfig(toolId);
  const [target, setTarget] = useState('');
  const [results, setResults] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = useCallback(async () => {
    const trimmed = target.trim();
    if (!trimmed) return;

    setResults(null);
    setError(null);
    setAnalyzing(true);

    try {
      const response = await api.post('/api/toolkit/execute', {
        toolId,
        target: trimmed,
      });
      const data = response.data;

      // Normalise the response into a renderable shape
      if (data?.report) {
        setResults(data.report);
      } else if (data?.results) {
        setResults(data.results);
      } else {
        setResults(data);
      }
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Analysis failed';
      setError(msg);
    } finally {
      setAnalyzing(false);
    }
  }, [target, toolId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !analyzing) {
      handleAnalyze();
    }
  };

  if (!tool) return null;

  const toolColor = tool.color || '#00d4ff';

  /* ── Render helpers ── */
  const renderRiskScore = (score) => {
    if (score == null) return null;
    const numericScore = Number(score);
    if (Number.isNaN(numericScore)) return null;

    let barColor = '#00ff88';
    if (numericScore >= 70) barColor = '#ef4444';
    else if (numericScore >= 40) barColor = '#f59e0b';

    return (
      <div style={styles.riskSection}>
        <div style={styles.riskHeader}>
          <span style={styles.riskLabel}>Risk Score</span>
          <span style={{ ...styles.riskValue, color: barColor }}>{numericScore}/100</span>
        </div>
        <div style={styles.riskTrack}>
          <div
            style={{
              ...styles.riskFill,
              width: `${Math.min(numericScore, 100)}%`,
              background: `linear-gradient(90deg, ${barColor}cc, ${barColor})`,
            }}
          />
        </div>
      </div>
    );
  };

  const renderResultCards = (data) => {
    if (!data) return null;

    // If data is an array of items
    if (Array.isArray(data)) {
      return (
        <div style={styles.cardsGrid}>
          {data.map((item, i) => (
            <div key={i} style={styles.card}>
              <div style={styles.cardIcon}>{item.icon || '📋'}</div>
              <div style={styles.cardBody}>
                <span style={styles.cardLabel}>{item.label || item.key || `Item ${i + 1}`}</span>
                <span style={styles.cardValue}>
                  {typeof item.value === 'object'
                    ? JSON.stringify(item.value, null, 2)
                    : String(item.value ?? '—')}
                </span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // If data is a plain object, render each key as a card
    if (typeof data === 'object') {
      const riskScore = data.riskScore ?? data.risk_score ?? data.score ?? null;
      const entries = Object.entries(data).filter(
        ([k]) => !['riskScore', 'risk_score', 'score'].includes(k)
      );

      return (
        <>
          {renderRiskScore(riskScore)}
          <div style={styles.cardsGrid}>
            {entries.map(([key, value]) => (
              <div key={key} style={styles.card}>
                <div style={styles.cardIcon}>📄</div>
                <div style={styles.cardBody}>
                  <span style={styles.cardLabel}>{formatLabel(key)}</span>
                  <span style={styles.cardValue}>
                    {typeof value === 'object'
                      ? JSON.stringify(value, null, 2)
                      : String(value ?? '—')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      );
    }

    // Fallback: raw string
    return (
      <div style={styles.card}>
        <div style={styles.cardBody}>
          <span style={styles.cardValue}>{String(data)}</span>
        </div>
      </div>
    );
  };

  const renderSkeletonCards = () => (
    <div style={styles.cardsGrid}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ ...styles.card, ...styles.skeletonCard }}>
          <div style={styles.skeletonIcon} />
          <div style={styles.skeletonBody}>
            <div style={{ ...styles.skeletonLine, width: '40%' }} />
            <div style={{ ...styles.skeletonLine, width: '70%' }} />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Description */}
      <p style={styles.description}>{tool.description}</p>

      {/* Capabilities */}
      {tool.capabilities?.length > 0 && (
        <div style={styles.capsRow}>
          {tool.capabilities.map((cap) => (
            <span key={cap} style={{ ...styles.capBadge, borderColor: `${toolColor}40`, color: toolColor }}>
              {cap}
            </span>
          ))}
        </div>
      )}

      {/* Input section */}
      <div style={styles.inputSection}>
        <label style={styles.inputLabel}>Target</label>
        <div style={styles.inputRow}>
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tool.inputPlaceholder || 'Enter target...'}
            disabled={analyzing}
            style={{
              ...styles.input,
              borderColor: analyzing ? 'rgba(255,255,255,0.06)' : `${toolColor}40`,
            }}
          />
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !target.trim()}
            style={{
              ...styles.analyzeButton,
              background: analyzing
                ? 'rgba(255,255,255,0.05)'
                : `linear-gradient(135deg, ${toolColor}, ${toolColor}cc)`,
              cursor: analyzing || !target.trim() ? 'not-allowed' : 'pointer',
              opacity: analyzing || !target.trim() ? 0.5 : 1,
            }}
          >
            {analyzing ? (
              <span style={styles.spinnerWrap}>
                <span style={styles.spinner}>⟳</span> Analyzing…
              </span>
            ) : (
              '🔬 Analyze'
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={styles.errorBox}>
          <span style={styles.errorIcon}>✖</span> {error}
        </div>
      )}

      {/* Report section */}
      <div style={styles.reportSection}>
        <h3 style={styles.reportTitle}>
          {analyzing ? 'Analyzing…' : results ? 'Analysis Report' : 'Report'}
        </h3>
        {analyzing && renderSkeletonCards()}
        {!analyzing && results && renderResultCards(results)}
        {!analyzing && !results && !error && (
          <p style={styles.reportPlaceholder}>
            Enter a target above and click Analyze to generate a report.
          </p>
        )}
      </div>
    </div>
  );
};

/* ── Helpers ── */
const formatLabel = (key) =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();

/* ═══════════════════════════════════════════════════════
   Inline Styles
   ═══════════════════════════════════════════════════════ */
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  description: {
    margin: 0,
    fontSize: '15px',
    lineHeight: 1.6,
    color: '#94a3b8',
  },

  /* Capabilities */
  capsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  capBadge: {
    padding: '4px 12px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 600,
    border: '1px solid',
    background: 'transparent',
  },

  /* Input */
  inputSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  inputLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#e2e8f0',
    letterSpacing: '0.03em',
  },
  inputRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  input: {
    flex: 1,
    minWidth: '220px',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid',
    background: 'rgba(255,255,255,0.04)',
    color: '#e2e8f0',
    fontSize: '14px',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  analyzeButton: {
    padding: '12px 28px',
    borderRadius: '10px',
    border: 'none',
    color: '#0a0e1a',
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '0.02em',
    transition: 'opacity 0.2s',
    whiteSpace: 'nowrap',
  },
  spinnerWrap: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: '#94a3b8',
  },
  spinner: {
    display: 'inline-block',
    animation: 'spin 1s linear infinite',
    fontSize: '16px',
  },

  /* Error */
  errorBox: {
    padding: '12px 16px',
    borderRadius: '10px',
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.25)',
    color: '#fca5a5',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  errorIcon: {
    color: '#ef4444',
    fontWeight: 700,
  },

  /* Report */
  reportSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  reportTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: '#e2e8f0',
  },
  reportPlaceholder: {
    margin: 0,
    fontSize: '14px',
    color: '#475569',
    fontStyle: 'italic',
  },

  /* Cards */
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '12px',
  },
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    transition: 'border-color 0.2s',
  },
  cardIcon: {
    fontSize: '20px',
    flexShrink: 0,
    width: '28px',
    textAlign: 'center',
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
    minWidth: 0,
  },
  cardLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  cardValue: {
    fontSize: '14px',
    color: '#e2e8f0',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
  },

  /* Risk score */
  riskSection: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  riskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#94a3b8',
  },
  riskValue: {
    fontSize: '20px',
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
  riskTrack: {
    width: '100%',
    height: '8px',
    borderRadius: '4px',
    background: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  riskFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.6s ease',
  },

  /* Skeleton loading */
  skeletonCard: {
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  skeletonIcon: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    background: 'rgba(255,255,255,0.06)',
    flexShrink: 0,
  },
  skeletonBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  },
  skeletonLine: {
    height: '12px',
    borderRadius: '4px',
    background: 'rgba(255,255,255,0.06)',
  },
};

export default AnalyzerToolView;
