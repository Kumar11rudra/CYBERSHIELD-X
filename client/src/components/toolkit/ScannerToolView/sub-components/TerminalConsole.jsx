import React, { useRef, useEffect, useState } from 'react';
import styles from '../styles';

const LOADING_STEPS = [
  '[*] [PREPARING] Initializing diagnostic workspace configurations...',
  '[*] [RESOLVING] Resolving target routing coordinates...',
  '[*] [CONNECTING] Establishing handshake with endpoint interface...',
  '[*] [SCANNING] Triaging remote port/service response signatures...',
  '[*] [ANALYZING] Correlating CVE threat exposure parameters...',
  '[*] [FINALIZING] Organizing reports format matrices...'
];

/**
 * TerminalConsole Component
 * Emulates a real-time command terminal window, with auto-scroll integration.
 */
export default function TerminalConsole({
  target,
  results,
  scanning,
  onExportPdf,
}) {
  const terminalRef = useRef(null);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  // Auto-scroll terminal on content updates
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [results, loadingStepIndex]);

  // Loading steps progress timer
  useEffect(() => {
    if (!scanning) {
      setLoadingStepIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStepIndex((prev) => {
        if (prev < LOADING_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [scanning]);

  return (
    <div style={styles.terminalSection}>
      <div style={styles.terminalHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <span style={styles.terminalDot('#ff5f57')} />
          <span style={styles.terminalDot('#febc2e')} />
          <span style={styles.terminalDot('#28c840')} />
          <span style={styles.terminalTitle}>
            {scanning ? `Scanning ${target || 'Target'}…` : results ? 'Scan Results' : 'Output'}
          </span>
        </div>
        {results && !scanning && (
          <button 
            onClick={onExportPdf} 
            style={styles.exportButton}
            aria-label="Export results as PDF report"
          >
            📄 Export PDF
          </button>
        )}
      </div>
      <div ref={terminalRef} style={styles.terminal} tabIndex={0} aria-label="Terminal output display">
        {results ? (
          <pre style={styles.terminalText}>{results}</pre>
        ) : scanning ? (
          <div style={styles.terminalText} className="space-y-1.5">
            {LOADING_STEPS.slice(0, loadingStepIndex + 1).map((step, idx) => (
              <div key={idx} className="animate-pulse">{step}</div>
            ))}
            <div className="text-cyber-accent animate-pulse font-bold mt-2">
              ⟳ Processing security triage vectors...
            </div>
          </div>
        ) : (
          <p style={styles.terminalPlaceholder}>
            Enter a target hostname or IP address above and click Scan to begin analysis.
          </p>
        )}
      </div>
    </div>
  );
}
