/**
 * ScannerToolView Inline Styles
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
  scanButton: {
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

  /* Terminal */
  terminalSection: {
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid rgba(0, 71, 65, 0.15)',
    background: 'var(--cyber-surface)',
  },
  terminalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'between',
    gap: '8px',
    padding: '10px 16px',
    background: 'rgba(0, 71, 65, 0.04)',
    borderBottom: '1px solid rgba(0, 71, 65, 0.08)',
  },
  terminalDot: (color) => ({
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
  }),
  terminalTitle: {
    marginLeft: '8px',
    fontSize: '12px',
    color: 'var(--cyber-muted)',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
  terminal: {
    padding: '16px',
    maxHeight: '460px',
    overflowY: 'auto',
    minHeight: '200px',
  },
  terminalText: {
    margin: 0,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: '13px',
    lineHeight: 1.7,
    color: '#228b5e',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  terminalPlaceholder: {
    margin: 0,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: '13px',
    color: 'var(--cyber-muted)',
    fontStyle: 'italic',
  },
  exportButton: {
    padding: '4px 12px',
    borderRadius: '6px',
    border: '1px solid rgba(0, 71, 65, 0.25)',
    background: 'rgba(0, 71, 65, 0.05)',
    color: 'var(--cyber-accent)',
    fontSize: '11px',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

export default styles;
