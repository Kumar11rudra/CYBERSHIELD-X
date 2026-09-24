import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import NativeTerminalConsole from '../components/terminal/NativeTerminalConsole';
import TerminalOutputFormatter from '../components/terminal/TerminalOutputFormatter';

global.IS_REACT_ACT_ENVIRONMENT = true;

// Mock window.matchMedia
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Mock clipboard
  Object.assign(navigator, {
    clipboard: {
      writeText: jest.fn().mockResolvedValue(),
    },
  });
});

describe('Centralized Native Terminal — Step 1 UI & Output Formatter Battery', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      if (root) root.unmount();
    });
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  // ── 1. Terminal Console Renders ───────────────────────────────────────────
  test('renders tactical terminal console with header, tool selector, prompt, and input', () => {
    act(() => {
      root.render(<NativeTerminalConsole />);
    });

    expect(container.textContent).toContain('NATIVE CYBERSOC TERMINAL');
    expect(container.textContent).toContain('LOCAL WORKSTATION');
    expect(container.textContent).toContain('nexus@cybershield:~$');
    expect(container.textContent).toContain('NATIVE ZERO-TRUST ENGINE ACTIVE');

    // Input field
    const input = container.querySelector('input');
    expect(input).not.toBeNull();

    // Tool selector bar has canonical native tools
    expect(container.textContent).toContain('nmap');
    expect(container.textContent).toContain('dig');
    expect(container.textContent).toContain('curl');
    expect(container.textContent).toContain('whois');
    expect(container.textContent).toContain('openssl');
    expect(container.textContent).toContain('ping');
    expect(container.textContent).toContain('traceroute');
  });

  // ── 2. No AI Layer or Copilot CLI in Terminal ─────────────────────────────
  test('verifies strict absence of AI Copilot mode, AI chat tabs, or LLM prompts', () => {
    act(() => {
      root.render(<NativeTerminalConsole />);
    });

    expect(container.textContent).not.toContain('AI Copilot');
    expect(container.textContent).not.toContain('Copilot CLI');
    expect(container.textContent).not.toContain('Security Copilot Triage');
    expect(container.textContent).not.toContain('Gemini');
    expect(container.textContent).not.toContain('GPT');
  });

  // ── 3. Structured DNS Records Parsing ─────────────────────────────────────
  test('TerminalOutputFormatter parses Dig DNS output into structured table', () => {
    const digOutput = [
      '; <<>> DiG 9.10.6 <<>> +noall +answer +question cloudflare.com',
      ';cloudflare.com.			IN	A',
      'cloudflare.com.		156	IN	A	104.16.132.229',
      'cloudflare.com.		156	IN	A	104.16.133.229'
    ].join('\n');

    act(() => {
      root.render(<TerminalOutputFormatter output={digOutput} toolName="dig" />);
    });

    expect(container.textContent).toContain('DIG PARSED');
    expect(container.textContent).toContain('Resolved DNS Zone Records (2)');
    expect(container.textContent).toContain('104.16.132.229');
    expect(container.textContent).toContain('104.16.133.229');
    expect(container.textContent).toContain('RAW HOST EXECUTION BUFFER');
  });

  // ── 4. Structured Port Scan Parsing ───────────────────────────────────────
  test('TerminalOutputFormatter parses Nmap port scan into structured cyber table', () => {
    const nmapOutput = [
      'Starting Nmap 7.94 ( https://nmap.org )',
      'Nmap scan report for scanme.nmap.org (45.33.32.156)',
      'Host is up (0.098s latency).',
      'PORT     STATE SERVICE',
      '22/tcp   open  ssh',
      '80/tcp   open  http',
      '443/tcp  open  https',
      'Nmap done: 1 IP address (1 host up) scanned in 1.45 seconds'
    ].join('\n');

    act(() => {
      root.render(<TerminalOutputFormatter output={nmapOutput} toolName="nmap" />);
    });

    expect(container.textContent).toContain('NMAP PARSED');
    expect(container.textContent).toContain('Audited Network Sockets (3 Detected)');
    expect(container.textContent).toContain('22/tcp');
    expect(container.textContent).toContain('80/tcp');
    expect(container.textContent).toContain('443/tcp');
    expect(container.textContent).toContain('ssh');
    expect(container.textContent).toContain('http');
  });

  // ── 5. Structured TLS Certificate Parsing ─────────────────────────────────
  test('TerminalOutputFormatter parses OpenSSL certificate and cipher info', () => {
    const opensslOutput = [
      'CONNECTED(00000003)',
      'Certificate chain',
      ' 0 s:CN = example.com',
      '   i:C = US, O = Let\'s Encrypt, CN = R3',
      'New, TLSv1.3, Cipher is TLS_AES_256_GCM_SHA384'
    ].join('\n');

    act(() => {
      root.render(<TerminalOutputFormatter output={opensslOutput} toolName="openssl" />);
    });

    expect(container.textContent).toContain('OPENSSL PARSED');
    expect(container.textContent).toContain('TLS Handshake & Cryptographic Cipher Dossier');
    expect(container.textContent).toContain('TLS_AES_256_GCM_SHA384');
    expect(container.textContent).toContain('CN = example.com');
  });

  // ── 6. Structured HTTP Headers Parsing ────────────────────────────────────
  test('TerminalOutputFormatter parses curl HTTP response headers', () => {
    const curlOutput = [
      'HTTP/2 200',
      'date: Thu, 17 Sep 2026 10:00:00 GMT',
      'content-type: text/html; charset=UTF-8',
      'server: cloudflare',
      'strict-transport-security: max-age=31536000'
    ].join('\n');

    act(() => {
      root.render(<TerminalOutputFormatter output={curlOutput} toolName="curl" />);
    });

    expect(container.textContent).toContain('CURL PARSED');
    expect(container.textContent).toContain('HTTP Headers • HTTP/2 200');
    expect(container.textContent).toContain('strict-transport-security');
    expect(container.textContent).toContain('cloudflare');
  });

  // ── 7. Structured Ping Stats Parsing ──────────────────────────────────────
  test('TerminalOutputFormatter parses ping packet metrics and latency', () => {
    const pingOutput = [
      'PING 8.8.8.8 (8.8.8.8): 56 data bytes',
      '--- 8.8.8.8 ping statistics ---',
      '2 packets transmitted, 2 packets received, 0.0% packet loss',
      'round-trip min/avg/max/stddev = 13.892/14.066/14.241/0.174 ms'
    ].join('\n');

    act(() => {
      root.render(<TerminalOutputFormatter output={pingOutput} toolName="ping" />);
    });

    expect(container.textContent).toContain('ICMP Network Reachability:');
    expect(container.textContent).toContain('Packets: 2/2 (0.0% loss)');
    expect(container.textContent).toContain('RTT: 13.892/14.066/14.241/0.174 ms');
  });

  // ── 8. Unknown Output Monospace Fallback & XSS Immunity ───────────────────
  test('TerminalOutputFormatter falls back to monospace lines and avoids HTML injection', () => {
    const maliciousOutput = '<script>alert("xss")</script>\n[+] Verification PASSED\n[!] Security Warning';

    act(() => {
      root.render(<TerminalOutputFormatter output={maliciousOutput} toolName="unknown-tool" />);
    });

    // Ensure raw string is rendered as text, not as an active executable script element
    const scripts = container.querySelectorAll('script');
    expect(scripts.length).toBe(0);
    expect(container.textContent).toContain('<script>alert("xss")</script>');
    expect(container.textContent).toContain('[+] Verification PASSED');
    expect(container.textContent).toContain('[!] Security Warning');
  });

  // ── 9. Accessibility & Reduced Motion Attributes ──────────────────────────
  test('Terminal console exposes ARIA live region and role region', () => {
    act(() => {
      root.render(<NativeTerminalConsole />);
    });

    const terminalRegion = container.querySelector('[role="region"]');
    expect(terminalRegion).not.toBeNull();
    expect(terminalRegion.getAttribute('aria-live')).toBe('polite');
    expect(terminalRegion.getAttribute('aria-label')).toBe('Terminal Output Stream');
  });

  // ── 10. Critical History Privacy & Credential Redaction Gate ──────────────
  test('sanitizeCommandForHistory strictly redacts query tokens, passwords, and auth headers', () => {
    const { sanitizeCommandForHistory } = require('../components/terminal/NativeTerminalConsole');

    // Query parameter token
    const cmd1 = 'curl https://api.example.com/data?token=super_secret_jwt_token_123';
    expect(sanitizeCommandForHistory(cmd1)).toBe('curl https://api.example.com/data?token=[REDACTED]');

    // Password parameter
    const cmd2 = 'curl https://example.com/auth?password=MyPassword123&user=admin';
    expect(sanitizeCommandForHistory(cmd2)).toBe('curl https://example.com/auth?password=[REDACTED]&user=admin');

    // URL embedded credentials
    const cmd3 = 'curl https://admin:super_secret_pass@example.com/repo';
    expect(sanitizeCommandForHistory(cmd3)).toBe('curl https://admin:[REDACTED]@example.com/repo');

    // Bearer token
    const cmd4 = 'curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz" https://example.com';
    expect(sanitizeCommandForHistory(cmd4)).toContain('Authorization: [REDACTED]');

    // CLI password argument
    const cmd5 = 'nmap --password MySecretPassword 192.168.1.1';
    expect(sanitizeCommandForHistory(cmd5)).toBe('nmap --password [REDACTED] 192.168.1.1');
  });

  // ── 11. History Session-Only Storage & Legacy LocalStorage Purge ───────────
  test('Terminal console purges legacy unredacted localStorage on mount', () => {
    localStorage.setItem('cybershield_terminal_cmd_history', JSON.stringify(['curl unredacted_secret_command']));

    act(() => {
      root.render(<NativeTerminalConsole />);
    });

    // Legacy unredacted localStorage key must be deleted on mount
    expect(localStorage.getItem('cybershield_terminal_cmd_history')).toBeNull();
  });
});
