import React from 'react';
import styles from '../styles';
import formatLabel from '../utils/format';
import RiskScoreBar from './RiskScoreBar';

/**
 * ResultCardsGrid Component
 * Renders the parsed key-value pairs or list items in card layouts.
 */
export default function ResultCardsGrid({ data }) {
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
        <RiskScoreBar score={riskScore} />
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
}
