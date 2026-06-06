import React, { useState, useMemo, useEffect } from 'react';
import { getToolConfig } from './toolConfig';

// ─── 1. JWT Parser Component (100% Client-side) ─────────────────────────────
const JwtParserView = () => {
  const [token, setToken] = useState('');
  const decoded = useMemo(() => {
    if (!token.trim()) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { error: 'Invalid JWT structure. A JWT must consist of three parts separated by dots.' };
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
                <h4 style={{ ...styles.sectionHeader, color: '#ef4444' }}>Signature Verification Hash</h4>
                <code style={styles.codeBlock}>
                  HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), "{decoded.signature}")
                </code>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─── 2. Base64 Decoder Component (100% Client-side) ────────────────────────
const Base64DecoderView = () => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('decode');
  const output = useMemo(() => {
    if (!input.trim()) return '';
    try {
      return mode === 'decode' ? atob(input.trim()) : btoa(input);
    } catch {
      return 'Error: Invalid base64 sequence or coding mismatch.';
    }
  }, [input, mode]);

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h3 style={{ ...styles.cardTitle, margin: 0 }}>📝 Base64 Translator</h3>
        <div style={styles.btnGroup}>
          {['decode', 'encode'].map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setInput('');
              }}
              style={{
                ...styles.btnGroupBtn,
                background: mode === m ? '#8b5cf6' : 'transparent',
                color: mode === m ? '#0a0e1a' : '#94a3b8',
                fontWeight: mode === m ? '700' : '400',
              }}
            >
              {m === 'decode' ? 'Decode' : 'Encode'}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.twoColGrid}>
        <div style={styles.inputStack}>
          <label style={styles.stackLabel}>Input Payload</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ ...styles.textarea, height: '140px' }}
            placeholder={mode === 'decode' ? 'Paste Base64 string to decode...' : 'Enter plaintext to encode...'}
          />
        </div>
        <div style={styles.inputStack}>
          <label style={styles.stackLabel}>Output Signal</label>
          <textarea
            value={output}
            readOnly
            style={{ ...styles.textareaReadOnly, height: '140px' }}
            placeholder="Result will appear here..."
          />
        </div>
      </div>
    </div>
  );
};

// ─── 3. URL Sanitizer Component (100% Client-side) ─────────────────────────
const UrlSanitizerView = () => {
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
              <h4 style={{ ...styles.sectionHeader, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
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
};

// ─── 4. Conversational Sidekick for Utility Decoders ─────────────────────────
const UtilitySidekick = ({ toolId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    let greeting = '';
    if (toolId === 'jwt-parser') {
      greeting =
        '👋 **JWT Parser sidekick active!** I am here to help you dissect JSON Web Tokens. Paste any JWT token in the input box on the left, and I will instantly split the Claims and Signatures. Did you know JWT signature tampering is a common vector?';
    } else if (toolId === 'base64-decoder') {
      greeting =
        '👋 **Base64 Translator sidekick active!** Paste base64 or plain text on the left to encode/decode in real-time. Feel free to ask me about common encoding standards!';
    } else {
      greeting =
        '👋 **URL Sanitizer sidekick active!** Paste a URL to isolate query strings and prevent dangerous open redirects.';
    }
    setMessages([{ text: greeting, isBot: true }]);
  }, [toolId]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { text: userMsg, isBot: false }]);

    setTimeout(() => {
      let botResponse = '';
      if (toolId === 'jwt-parser') {
        botResponse = `🔍 **Intelligence**: I see you're working with JWTs! Always make sure the signature matches and verify the 'exp' (expiration) claim to prevent replay attacks.`;
      } else if (toolId === 'base64-decoder') {
        botResponse = `📝 **Base64 Tip**: Base64 encoding is NOT encryption! It simply formats binary data as ASCII text. Never store raw credentials in Base64 strings.`;
      } else {
        botResponse = `🔗 **URL Security**: Check for double-encoded characters in URL strings, as they can sometimes bypass validation rules (e.g. SQLi or XSS filters).`;
      }
      setMessages((prev) => [...prev, { text: botResponse, isBot: true }]);
    }, 800);
  };

  return (
    <div style={styles.sidekickCard}>
      <h3 style={styles.sidekickTitle}>
        <span style={styles.sidekickIndicator} />
        Conversational Sidekick
      </h3>
      <div style={styles.sidekickHistory}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              ...styles.msgBubble,
              background: m.isBot ? 'rgba(255,255,255,0.02)' : 'rgba(0,212,255,0.04)',
              borderColor: m.isBot ? 'rgba(255,255,255,0.04)' : 'rgba(0,212,255,0.15)',
            }}
          >
            <p style={{ ...styles.msgRole, color: m.isBot ? '#94a3b8' : '#00d4ff' }}>
              {m.isBot ? '🤖 CYBOBOT' : '🕵️ OPERATOR'}
            </p>
            <div style={styles.msgText}>{m.text}</div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} style={styles.sidekickForm}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Sidekick..."
          style={styles.sidekickInput}
        />
        <button type="submit" style={styles.sidekickSendBtn}>
          SEND
        </button>
      </form>
    </div>
  );
};

// ─── Main UtilityToolView Component ──────────────────────────────────────────
const UtilityToolView = ({ toolId }) => {
  const tool = getToolConfig(toolId);
  if (!tool) return null;

  return (
    <div style={styles.grid} className="utility-grid">
      <div style={styles.mainColumn} className="utility-main-col">
        {toolId === 'jwt-parser' && <JwtParserView />}
        {toolId === 'base64-decoder' && <Base64DecoderView />}
        {toolId === 'url-sanitizer' && <UrlSanitizerView />}
      </div>
      <div style={styles.sideColumn} className="utility-side-col">
        <UtilitySidekick toolId={toolId} />
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   Inline Styles
   ═══════════════════════════════════════════════════════ */
const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: '24px',
  },
  mainColumn: {
    gridColumn: 'span 8',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  sideColumn: {
    gridColumn: 'span 4',
  },
  innerContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    textAlign: 'left',
  },
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '24px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    textAlign: 'left',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: '16px',
  },
  cardTitle: {
    margin: 0,
    fontFamily: "'Inter', sans-serif",
    fontSize: '15px',
    fontWeight: 700,
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  textarea: {
    width: '100%',
    background: 'rgba(0,0,0,0.6)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '16px',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: '13px',
    color: '#00ff88',
    outline: 'none',
    height: '96px',
    resize: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  textareaReadOnly: {
    width: '100%',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '10px',
    padding: '16px',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: '13px',
    color: '#00d4ff',
    outline: 'none',
    height: '96px',
    resize: 'none',
    boxSizing: 'border-box',
  },
  textInput: {
    width: '100%',
    background: 'rgba(0,0,0,0.6)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '14px 16px',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: '13px',
    color: '#00ff88',
    outline: 'none',
    boxSizing: 'border-box',
  },
  twoColGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
  },
  threeColGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },
  sectionHeader: {
    margin: 0,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  pre: {
    margin: 0,
    background: 'rgba(0,0,0,0.4)',
    padding: '12px',
    borderRadius: '10px',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: '11px',
    overflowX: 'auto',
  },
  codeBlock: {
    display: 'block',
    background: 'rgba(0,0,0,0.6)',
    padding: '12px',
    borderRadius: '8px',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: '11px',
    color: '#ef4444',
    wordBreak: 'break-all',
  },
  errorBox: {
    padding: '16px',
    borderRadius: '10px',
    background: 'rgba(239,68,68,0.05)',
    border: '1px solid rgba(239,68,68,0.2)',
    color: '#ef4444',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12px',
  },
  btnGroup: {
    display: 'flex',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    overflow: 'hidden',
    background: 'rgba(0,0,0,0.2)',
  },
  btnGroupBtn: {
    border: 'none',
    padding: '6px 12px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  inputStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  stackLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  diagnosticPill: {
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '10px',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  diagnosticLabel: {
    margin: 0,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '9px',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  diagnosticValue: {
    margin: 0,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12px',
    fontWeight: 700,
    color: '#00ff88',
    wordBreak: 'break-all',
  },
  tableWrapper: {
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12px',
  },
  thRow: {
    background: 'rgba(255,255,255,0.04)',
    textAlign: 'left',
  },
  th: {
    padding: '12px 16px',
    color: '#64748b',
    fontWeight: 600,
  },
  tr: {
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  tdKey: {
    padding: '12px 16px',
    color: '#ffffff',
    fontWeight: 700,
  },
  tdValue: {
    padding: '12px 16px',
    color: '#00ff88',
    wordBreak: 'break-all',
  },
  tdPlaceholder: {
    padding: '24px 16px',
    color: '#475569',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  /* Sidekick */
  sidekickCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '20px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    height: '450px',
    textAlign: 'left',
  },
  sidekickTitle: {
    margin: '0 0 16px 0',
    fontFamily: "'Inter', sans-serif",
    fontSize: '13px',
    fontWeight: 700,
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sidekickIndicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#00d4ff',
  },
  sidekickHistory: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '16px',
    paddingRight: '4px',
  },
  msgBubble: {
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid',
    boxSizing: 'border-box',
  },
  msgRole: {
    margin: '0 0 4px 0',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.08em',
  },
  msgText: {
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: '12px',
    lineHeight: 1.6,
  },
  sidekickForm: {
    display: 'flex',
    gap: '8px',
  },
  sidekickInput: {
    flex: 1,
    background: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '10px 14px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12px',
    color: '#ffffff',
    outline: 'none',
  },
  sidekickSendBtn: {
    background: 'rgba(0,212,255,0.1)',
    border: '1px solid rgba(0,212,255,0.3)',
    color: '#00d4ff',
    borderRadius: '10px',
    padding: '10px 16px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

// Add responsive stylesheet behavior on load
if (typeof window !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
    @media (max-width: 991px) {
      .utility-grid {
        display: flex !important;
        flex-direction: column !important;
      }
      .utility-main-col, .utility-side-col {
        grid-column: span 12 !important;
        width: 100% !important;
      }
    }
  `;
  document.head.appendChild(styleTag);
}

export default UtilityToolView;
