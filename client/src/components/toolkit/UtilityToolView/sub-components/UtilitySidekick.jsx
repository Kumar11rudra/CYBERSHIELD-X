import React, { useState, useEffect } from 'react';
import styles from '../styles';

/**
 * UtilitySidekick Component
 * Renders the assistant conversational interface.
 */
export default function UtilitySidekick({ toolId }) {
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
}
