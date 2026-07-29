/**
 * AnalyzerToolView Inline Styles
 * Extracted styles to keep component JSX clean and readable in Cyprus/Sand theme.
 */
export const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  description: {
    margin: 0,
    fontSize: '15px',
    lineHeight: 1.6,
    color: 'var(--cyber-muted)',
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
    color: 'var(--cyber-text)',
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
    border: '1px solid rgba(0, 71, 65, 0.15)',
    background: 'rgba(0, 71, 65, 0.04)',
    color: 'var(--cyber-text)',
    fontSize: '14px',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  analyzeButton: {
    padding: '12px 28px',
    borderRadius: '10px',
    border: 'none',
    color: 'var(--cyber-bg)',
    background: 'var(--cyber-accent)',
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '0.02em',
    transition: 'opacity 0.2s',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  },
  spinnerWrap: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: 'var(--cyber-muted)',
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
    background: 'rgba(186,45,63,0.08)',
    border: '1px solid rgba(186,45,63,0.25)',
    color: 'var(--cyber-red)',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  errorIcon: {
    color: 'var(--cyber-red)',
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
    color: 'var(--cyber-text)',
  },
  reportPlaceholder: {
    margin: 0,
    fontSize: '14px',
    color: 'var(--cyber-muted)',
    fontStyle: 'italic',
  },

  /* Cards */
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '12px',
  },
  card: {
    background: 'var(--cyber-card)',
    border: '1px solid rgba(0, 71, 65, 0.1)',
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
    color: 'var(--cyber-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  cardValue: {
    fontSize: '14px',
    color: 'var(--cyber-text)',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
  },

  /* Risk score */
  riskSection: {
    background: 'var(--cyber-card)',
    border: '1px solid rgba(0, 71, 65, 0.1)',
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
    color: 'var(--cyber-muted)',
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
    background: 'rgba(0, 71, 65, 0.06)',
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
    background: 'rgba(0, 71, 65, 0.06)',
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
    background: 'rgba(0, 71, 65, 0.06)',
  },
  exportButton: {
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(0, 71, 65, 0.25)',
    background: 'rgba(0, 71, 65, 0.05)',
    color: 'var(--cyber-accent)',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

export default styles;
