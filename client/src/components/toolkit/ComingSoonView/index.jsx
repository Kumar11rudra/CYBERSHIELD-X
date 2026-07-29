import React, { useState } from 'react';
import { getToolConfig } from '../toolConfig';
import styles from './styles';

/**
 * ComingSoonView Component
 * Placeholder dashboard block for tools slated for future activation.
 */
export default function ComingSoonView({ toolId }) {
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
            <p style={styles.notifyText}>Want to know when {tool.name} goes live?</p>
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
}
