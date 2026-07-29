/**
 * ComingSoonView Inline Styles
 * Extracted styles to keep component JSX clean and readable in Cyprus/Sand theme.
 */
export const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },

  /* Badge */
  badgeRow: {
    display: 'flex',
    justifyContent: 'center',
  },
  comingSoonBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 28px',
    borderRadius: '999px',
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '0.12em',
    color: 'var(--cyber-muted)',
    background: 'rgba(0, 71, 65, 0.04)',
    border: '1px solid rgba(0, 71, 65, 0.1)',
  },
  badgeDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'var(--cyber-muted)',
    animation: 'pulse 2s ease-in-out infinite',
  },

  /* Description card */
  descriptionCard: {
    background: 'var(--cyber-card)',
    border: '1px solid rgba(0, 71, 65, 0.1)',
    borderRadius: '12px',
    padding: '24px',
  },
  descriptionTitle: {
    margin: '0 0 10px 0',
    fontSize: '17px',
    fontWeight: 600,
    color: 'var(--cyber-text)',
  },
  descriptionText: {
    margin: 0,
    fontSize: '15px',
    lineHeight: 1.7,
    color: 'var(--cyber-muted)',
  },

  /* Capabilities */
  capsSection: {
    background: 'var(--cyber-card)',
    border: '1px solid rgba(0, 71, 65, 0.1)',
    borderRadius: '12px',
    padding: '24px',
  },
  capsTitle: {
    margin: '0 0 16px 0',
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--cyber-text)',
  },
  capsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  capItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  capDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  capText: {
    fontSize: '14px',
    color: 'var(--cyber-text)',
  },

  /* Meta info */
  metaRow: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  metaItem: {
    flex: 1,
    minWidth: '140px',
    background: 'var(--cyber-card)',
    border: '1px solid rgba(0, 71, 65, 0.1)',
    borderRadius: '12px',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metaLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--cyber-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  metaValue: {
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--cyber-text)',
  },

  /* Notify */
  notifySection: {
    background: 'var(--cyber-card)',
    border: '1px solid rgba(0, 71, 65, 0.1)',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center',
  },
  notifyText: {
    margin: '0 0 16px 0',
    fontSize: '14px',
    color: 'var(--cyber-muted)',
  },
  notifyForm: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  emailInput: {
    padding: '10px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(0, 71, 65, 0.15)',
    background: 'rgba(0, 71, 65, 0.04)',
    color: 'var(--cyber-text)',
    fontSize: '14px',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    outline: 'none',
    minWidth: '220px',
    transition: 'border-color 0.2s',
  },
  notifyButton: {
    padding: '10px 24px',
    borderRadius: '10px',
    border: 'none',
    color: 'var(--cyber-bg)',
    background: 'var(--cyber-accent)',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    whiteSpace: 'nowrap',
  },

  /* Success state */
  successBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  successIcon: {
    fontSize: '20px',
    color: 'var(--cyber-green)',
    fontWeight: 700,
  },
  successText: {
    fontSize: '14px',
    color: 'var(--cyber-green)',
  },
};

export default styles;
