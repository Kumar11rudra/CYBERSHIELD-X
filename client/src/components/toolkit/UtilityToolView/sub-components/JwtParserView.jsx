import React, { useState, useMemo } from 'react';
import styles from '../styles';

/**
 * JwtParserView Component
 * Client-side decoding of JWT signatures and payloads.
 */
export default function JwtParserView() {
  const [token, setToken] = useState('');
  
  const decoded = useMemo(() => {
    if (!token.trim()) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return {
          error: 'Invalid JWT structure. A JWT must consist of three parts separated by dots.',
        };
      }
      const [headerB64, payloadB64, signature] = parts;
      const header = JSON.parse(atob(headerB64.replace(/-/g, '+').replace(/_/g, '/')));
      const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
      return { header, payload, signature };
    } catch {
      return { error: 'Failed to decode JWT token. Ensure valid base64 payload.' };
    }
  }, [token]);

  return (
    <div style={styles.innerContainer}>
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>🔑 JWT Parser</h3>
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          style={styles.textarea}
          placeholder="Paste encoded JWT token here..."
        />
      </div>

      {decoded && (
        <div style={styles.innerContainer}>
          {decoded.error ? (
            <div style={styles.errorBox}>{decoded.error}</div>
          ) : (
            <>
              <div style={styles.twoColGrid}>
                <div style={{ ...styles.card, borderColor: 'rgba(245,158,11,0.2)' }}>
                  <h4 style={{ ...styles.sectionHeader, color: '#f59e0b' }}>Header</h4>
                  <pre style={{ ...styles.pre, color: '#f59e0b' }}>
                    {JSON.stringify(decoded.header, null, 2)}
                  </pre>
                </div>
                <div style={{ ...styles.card, borderColor: 'rgba(0,255,136,0.2)' }}>
                  <h4 style={{ ...styles.sectionHeader, color: '#00ff88' }}>Payload</h4>
                  <pre style={{ ...styles.pre, color: '#00ff88' }}>
                    {JSON.stringify(decoded.payload, null, 2)}
                  </pre>
                </div>
              </div>
              <div style={{ ...styles.card, borderColor: 'rgba(239,68,68,0.2)' }}>
                <h4 style={{ ...styles.sectionHeader, color: '#ef4444' }}>
                  Signature Verification Hash
                </h4>
                <code style={styles.codeBlock}>
                  HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), "
                  {decoded.signature}")
                </code>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
