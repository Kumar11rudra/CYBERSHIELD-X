import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getToolConfig } from './toolConfig';
import api from '../../services/api';

/**
 * ScannerToolView — Template for scanner-type tools (Nmap, Nikto).
 *
 * Features:
 *  • Target input + "Scan" button
 *  • Streams scan output into a terminal-like box
 *  • WebSocket support with HTTP POST fallback
 *  • Capabilities list from toolConfig
 */
const ScannerToolView = ({ toolId }) => {
  const tool = getToolConfig(toolId);
  const [target, setTarget] = useState('');
  const [results, setResults] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const terminalRef = useRef(null);
  const wsRef = useRef(null);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [results]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const appendResult = useCallback((text) => {
    setResults((prev) => prev + text);
  }, []);

  const executeScanHTTP = useCallback(
    async (scanTarget) => {
      try {
        const response = await api.post('/api/toolkit/execute', {
          toolId,
          target: scanTarget,
        });
        const data = response.data;
        if (data?.output) {
          appendResult(data.output);
        } else if (data?.results) {
          appendResult(
            typeof data.results === 'string'
              ? data.results
              : JSON.stringify(data.results, null, 2)
          );
        } else {
          appendResult(JSON.stringify(data, null, 2));
        }
      } catch (err) {
        const msg =
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          'Scan failed';
        setError(msg);
      } finally {
        setScanning(false);
      }
    },
    [toolId, appendResult]
  );

  const executeScanWS = useCallback(
    (scanTarget) => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const host = window.location.host;
        const ws = new WebSocket(
          `${protocol}://${host}/ws/toolkit?toolId=${encodeURIComponent(toolId)}&target=${encodeURIComponent(scanTarget)}`
        );
        wsRef.current = ws;

        ws.onopen = () => {
          appendResult(`[*] Connected — scanning ${scanTarget}...\n`);
        };

        ws.onmessage = (event) => {
          appendResult(event.data);
        };

        ws.onerror = () => {
          // Fallback to HTTP
          ws.close();
          wsRef.current = null;
          appendResult('[*] WebSocket unavailable, falling back to HTTP...\n');
          executeScanHTTP(scanTarget);
        };

        ws.onclose = (event) => {
          if (event.wasClean) {
            appendResult('\n[✓] Scan complete.\n');
          }
          setScanning(false);
          wsRef.current = null;
        };
      } catch {
        // WebSocket constructor failed — fallback
        executeScanHTTP(scanTarget);
      }
    },
    [toolId, appendResult, executeScanHTTP]
  );

  const handleScan = () => {
    const trimmed = target.trim();
    if (!trimmed) return;

    setResults('');
    setError(null);
    setScanning(true);

    // Try WebSocket first, fall back to HTTP
    if (typeof WebSocket !== 'undefined') {
      executeScanWS(trimmed);
    } else {
      executeScanHTTP(trimmed);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !scanning) {
      handleScan();
    }
  };

  if (!tool) return null;

  const toolColor = tool.color || '#00ff88';

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
            disabled={scanning}
            style={{
              ...styles.input,
              borderColor: scanning ? 'rgba(255,255,255,0.06)' : `${toolColor}40`,
            }}
          />
          <button
            onClick={handleScan}
            disabled={scanning || !target.trim()}
            style={{
              ...styles.scanButton,
              background: scanning
                ? 'rgba(255,255,255,0.05)'
                : `linear-gradient(135deg, ${toolColor}, ${toolColor}cc)`,
              cursor: scanning || !target.trim() ? 'not-allowed' : 'pointer',
              opacity: scanning || !target.trim() ? 0.5 : 1,
            }}
          >
            {scanning ? (
              <span style={styles.spinnerWrap}>
                <span style={styles.spinner}>⟳</span> Scanning…
              </span>
            ) : (
              '⚡ Scan'
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

      {/* Terminal output */}
      <div style={styles.terminalSection}>
        <div style={styles.terminalHeader}>
          <span style={styles.terminalDot('#ff5f57')} />
          <span style={styles.terminalDot('#febc2e')} />
          <span style={styles.terminalDot('#28c840')} />
          <span style={styles.terminalTitle}>
            {scanning ? `Scanning ${target}…` : results ? 'Scan Results' : 'Output'}
          </span>
        </div>
        <div ref={terminalRef} style={styles.terminal}>
          {results ? (
            <pre style={styles.terminalText}>{results}</pre>
          ) : (
            <p style={styles.terminalPlaceholder}>
              {scanning
                ? 'Waiting for results…'
                : `Enter a target above and click Scan to begin ${tool.name} analysis.`}
            </p>
          )}
        </div>
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
  scanButton: {
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

  /* Terminal */
  terminalSection: {
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(0,0,0,0.4)',
  },
  terminalHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    background: 'rgba(255,255,255,0.03)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
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
    color: '#64748b',
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
    color: '#00ff88',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  terminalPlaceholder: {
    margin: 0,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: '13px',
    color: '#475569',
    fontStyle: 'italic',
  },
};

export default ScannerToolView;
