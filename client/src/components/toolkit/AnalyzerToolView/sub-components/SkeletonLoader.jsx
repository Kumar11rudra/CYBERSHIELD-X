import React, { useState, useEffect } from 'react';
import styles from '../styles';

const ANALYZER_STEPS = [
  '🔬 [PREPARING] Initializing tool data vectors...',
  '📡 [RESOLVING] Opening query connection socket to security endpoint...',
  '🔍 [LOOKUP] Executing signature search across remote registries...',
  '🧠 [ANALYZING] Correlating risk exposure threat levels...',
  '📋 [FINALIZING] Building diagnostic result datasets...'
];

/**
 * SkeletonLoader Component
 * Renders loading skeleton placeholder cards with real-time status steps.
 */
export default function SkeletonLoader() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => {
        if (prev < ANALYZER_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Real-time Triage Status */}
      <div className="bg-cyber-surface border border-cyber-border/10 p-4 rounded-xl font-mono text-[10px] space-y-1.5 text-left">
        {ANALYZER_STEPS.slice(0, stepIndex + 1).map((step, idx) => (
          <div key={idx} className="text-cyber-accent animate-pulse">
            {step}
          </div>
        ))}
        <div className="text-[10px] text-cyber-muted animate-pulse font-bold mt-2">
          ⟳ Triaging payload analysis metrics...
        </div>
      </div>

      {/* Skeletons */}
      <div style={styles.cardsGrid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ ...styles.card, ...styles.skeletonCard }} className="animate-pulse">
            <div style={styles.skeletonIcon} />
            <div style={styles.skeletonBody}>
              <div style={{ ...styles.skeletonLine, width: '40%' }} />
              <div style={{ ...styles.skeletonLine, width: '70%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
