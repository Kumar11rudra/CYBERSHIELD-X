import React, { useState } from 'react';
import { getToolConfig } from './toolConfig';

/**
 * ComingSoonView — Placeholder for tools that are not yet available.
 *
 * Features:
 *  • Tool description and planned capabilities
 *  • Prominent "COMING SOON" badge
 *  • Optional "Get notified" email input (UI only)
 *  • No fake output — clean, honest, professional
 */
const ComingSoonView = ({ toolId }) => {
  const tool = getToolConfig(toolId);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  if (!tool) return null;

  const toolColor = tool.color || '#6b7280';

  const handleNotify = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
    }
  };

  return (
    <div style={styles.container}>
      {/* Coming Soon badge */}
      <div style={styles.badgeRow}>
        <span style={styles.comingSoonBadge}>
          <span style={styles.badgeDot} />
          COMING SOON
        </span>
      </div>

      {/* Description */}
      <div style={styles.descriptionCard}>
        <h3 style={styles.descriptionTitle}>What is {tool.name}?</h3>
        <p style={styles.descriptionText}>
          {tool.description ||
            `${tool.name} will be available in a future release of CyberShield X.`}
        </p>
      </div>

      {/* Planned capabilities */}
      {tool.capabilities?.length > 0 && (
        <div style={styles.capsSection}>
          <h4 style={styles.capsTitle}>Planned Capabilities</h4>
          <div style={styles.capsList}>
            {tool.capabilities.map((cap) => (
              <div key={cap} style={styles.capItem}>
                <span
                  style={{
                    ...styles.capDot,
                    background: toolColor,
                    boxShadow: `0 0 8px ${toolColor}60`,
                  }}
                />
                <span style={styles.capText}>{cap}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category & type info */}
      <div style={styles.metaRow}>
        {tool.category && (
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>Category</span>
            <span style={{ ...styles.metaValue, color: toolColor }}>{tool.category}</span>
          </div>
        )}
        {tool.inputType && (
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>Input Type</span>
            <span style={styles.metaValue}>{tool.inputType.toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Notify form */}
      <div style={styles.notifySection}>
        {subscribed ? (
          <div style={styles.successBox}>
            <span style={styles.successIcon}>✓</span>
            <span style={styles.successText}>
              Thanks! We'll notify you when {tool.name} is available.
            </span>
          </div>
        ) : (
          <>
            <p style={styles.notifyText}>
              Want to know when {tool.name} goes live?
            </p>
            <form onSubmit={handleNotify} style={styles.notifyForm}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={styles.emailInput}
              />
              <button
                type="submit"
                style={{
                  ...styles.notifyButton,
                  background: `linear-gradient(135deg, ${toolColor}, ${toolColor}cc)`,
                }}
              >
                🔔 Notify Me
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   Inline Styles
   ═══════════════════════════════════════════════════════ */
const styles = {
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
    color: '#94a3b8',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.10)',
  },
  badgeDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#6b7280',
    animation: 'pulse 2s ease-in-out infinite',
  },

  /* Description card */
  descriptionCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '24px',
  },
  descriptionTitle: {
    margin: '0 0 10px 0',
    fontSize: '17px',
    fontWeight: 600,
    color: '#e2e8f0',
  },
  descriptionText: {
    margin: 0,
    fontSize: '15px',
    lineHeight: 1.7,
    color: '#94a3b8',
  },

  /* Capabilities */
  capsSection: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '24px',
  },
  capsTitle: {
    margin: '0 0 16px 0',
    fontSize: '15px',
    fontWeight: 600,
    color: '#e2e8f0',
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
    color: '#cbd5e1',
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
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metaLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  metaValue: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#e2e8f0',
  },

  /* Notify */
  notifySection: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center',
  },
  notifyText: {
    margin: '0 0 16px 0',
    fontSize: '14px',
    color: '#94a3b8',
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
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.04)',
    color: '#e2e8f0',
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
    color: '#0a0e1a',
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
    color: '#00ff88',
    fontWeight: 700,
  },
  successText: {
    fontSize: '14px',
    color: '#00ff88',
  },
};

export default ComingSoonView;
