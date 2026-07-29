import React from 'react';
import styles from '../styles';

/**
 * RiskScoreBar Component
 * Renders the normalized risk score gauge.
 */
export default function RiskScoreBar({ score }) {
  if (score == null) return null;
  const numericScore = Number(score);
  if (Number.isNaN(numericScore)) return null;

  let barColor = '#00ff88';
  if (numericScore >= 70) {
    barColor = '#ef4444';
  } else if (numericScore >= 40) {
    barColor = '#f59e0b';
  }

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
}
