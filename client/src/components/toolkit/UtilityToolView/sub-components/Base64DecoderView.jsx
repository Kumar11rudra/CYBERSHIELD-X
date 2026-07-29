import React, { useState, useMemo } from 'react';
import styles from '../styles';

/**
 * Base64DecoderView Component
 * Performs client-side encoding and decoding of Base64 parameters.
 */
export default function Base64DecoderView() {
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
            placeholder={
              mode === 'decode'
                ? 'Paste Base64 string to decode...'
                : 'Enter plaintext to encode...'
            }
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
}
