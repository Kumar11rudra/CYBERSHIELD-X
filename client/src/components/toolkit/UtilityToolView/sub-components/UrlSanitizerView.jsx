import React, { useState, useMemo } from 'react';
import styles from '../styles';

/**
 * UrlSanitizerView Component
 * Decodes URL parameters and isolates diagnostic key-value pairs.
 */
export default function UrlSanitizerView() {
  const [url, setUrl] = useState('');
  
  const analyzed = useMemo(() => {
    if (!url.trim()) return null;
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      const params = Object.fromEntries(parsed.searchParams.entries());
      return {
        success: true,
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        pathname: parsed.pathname,
        params,
      };
    } catch {
      return { success: false, error: 'Malformed URL pattern. Check syntax.' };
    }
  }, [url]);

  return (
    <div style={styles.innerContainer}>
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>🔗 URL Payload Sanitizer</h3>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={styles.textInput}
          placeholder="Paste URL parameters to analyze (e.g. example.com/pay?user=123&token=abc)..."
        />
      </div>

      {analyzed && (
        <div style={styles.card}>
          {analyzed.error ? (
            <div style={styles.errorBox}>{analyzed.error}</div>
          ) : (
            <div style={styles.innerContainer}>
              <h4
                style={{
                  ...styles.sectionHeader,
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  paddingBottom: '8px',
                }}
              >
                Diagnostic Parameters
              </h4>
              <div style={styles.threeColGrid}>
                <div style={styles.diagnosticPill}>
                  <p style={styles.diagnosticLabel}>Protocol</p>
                  <p style={styles.diagnosticValue}>{analyzed.protocol}</p>
                </div>
                <div style={styles.diagnosticPill}>
                  <p style={styles.diagnosticLabel}>Hostname</p>
                  <p style={styles.diagnosticValue}>{analyzed.hostname}</p>
                </div>
                <div style={styles.diagnosticPill}>
                  <p style={styles.diagnosticLabel}>Path</p>
                  <p style={styles.diagnosticValue}>{analyzed.pathname}</p>
                </div>
              </div>

              <div style={styles.innerContainer}>
                <p style={styles.diagnosticLabel}>Query Decoded Matrix</p>
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.thRow}>
                        <th style={styles.th}>KEY</th>
                        <th style={styles.th}>DECODED VALUE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(analyzed.params).length === 0 ? (
                        <tr>
                          <td colSpan={2} style={styles.tdPlaceholder}>
                            No query parameters found
                          </td>
                        </tr>
                      ) : (
                        Object.entries(analyzed.params).map(([k, v]) => (
                          <tr key={k} style={styles.tr}>
                            <td style={styles.tdKey}>{k}</td>
                            <td style={styles.tdValue}>{v}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
