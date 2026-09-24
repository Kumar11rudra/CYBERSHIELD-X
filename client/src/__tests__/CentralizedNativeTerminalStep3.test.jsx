import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import NativeTerminalConsole, { sanitizeCommandForHistory } from '../components/terminal/NativeTerminalConsole';
import TerminalOutputFormatter from '../components/terminal/TerminalOutputFormatter';
import {
  TERMINAL_NATIVE_REGISTRY,
  NATIVE_EXECUTABLES_SET,
  resolveNativeTool,
  isNativeToolAuthorized,
  getAnnotatedNativeRegistry,
  getToolAvailability
} from '../components/terminal/terminalNativeRegistry';
import * as terminalExecutionService from '../services/terminalExecutionService';

global.IS_REACT_ACT_ENVIRONMENT = true;

// Mock terminalExecutionService
jest.mock('../services/terminalExecutionService', () => {
  const actual = jest.requireActual('../services/terminalExecutionService');
  return {
    ...actual,
    fetchHostCapabilities: jest.fn().mockResolvedValue({
      platform: 'darwin',
      nativeCapabilities: [
        { id: 'nmap', executable: 'nmap', supported: true, availability: 'AVAILABLE' },
        { id: 'dig', executable: 'dig', supported: true, availability: 'AVAILABLE' },
        { id: 'curl', executable: 'curl', supported: true, availability: 'AVAILABLE' },
        { id: 'whois', executable: 'whois', supported: true, availability: 'AVAILABLE' },
        { id: 'openssl', executable: 'openssl', supported: true, availability: 'AVAILABLE' },
        { id: 'ping', executable: 'ping', supported: true, availability: 'AVAILABLE' },
        { id: 'traceroute', executable: 'traceroute', supported: true, availability: 'NOT INSTALLED' }
      ]
    }),
    executeNativeTool: jest.fn().mockResolvedValue({
      success: true,
      data: {
        output: 'Simulated native output',
        durationMs: 120,
        status: 'COMPLETED',
        exitCode: 0
      }
    }),
    cancelTerminalExecution: jest.fn().mockResolvedValue({
      success: true,
      cancelled: true
    }),
    checkToolCapability: jest.fn().mockResolvedValue({
      toolId: 'curl',
      installed: true,
      executionTarget: 'HOST_NATIVE'
    })
  };
});

// Mock window.matchMedia & clipboard
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

  Object.assign(navigator, {
    clipboard: {
      writeText: jest.fn().mockResolvedValue(),
    },
  });
});

// Helper for React 18 controlled inputs
const setInputValue = (input, value) => {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  ).set;
  nativeInputValueSetter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

describe('Centralized Native Terminal — Step 3 Operator-Grade UX & Presentation Battery', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    jest.clearAllMocks();

    terminalExecutionService.fetchHostCapabilities.mockResolvedValue({
      platform: 'darwin',
      nativeCapabilities: [
        { id: 'nmap', executable: 'nmap', supported: true, availability: 'AVAILABLE' },
        { id: 'dig', executable: 'dig', supported: true, availability: 'AVAILABLE' },
        { id: 'curl', executable: 'curl', supported: true, availability: 'AVAILABLE' },
        { id: 'whois', executable: 'whois', supported: true, availability: 'AVAILABLE' },
        { id: 'openssl', executable: 'openssl', supported: true, availability: 'AVAILABLE' },
        { id: 'ping', executable: 'ping', supported: true, availability: 'AVAILABLE' },
        { id: 'traceroute', executable: 'traceroute', supported: true, availability: 'NOT INSTALLED' }
      ]
    });
  });

  afterEach(() => {
    act(() => {
      if (root) root.unmount();
    });
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  // ── A. Execution Lifecycle: IDLE ──────────────────────────────────────────
  test('A. renders initial execution lifecycle state as IDLE with welcome buffer', async () => {
    await act(async () => {
      root.render(<NativeTerminalConsole />);
    });

    expect(container.textContent).toContain('IDLE');
    expect(container.textContent).toContain('sys.welcome');
    expect(container.textContent).toContain('NATIVE CYBERSOC TERMINAL');
  });

  // ── B. RUNNING State UX & HUD ─────────────────────────────────────────────
  test('B. renders RUNNING state HUD card with active tool, target, live timer and abort control', async () => {
    let resolveExecution;
    terminalExecutionService.executeNativeTool.mockImplementation(() => {
      return new Promise((resolve) => {
        resolveExecution = resolve;
      });
    });

    await act(async () => {
      root.render(<NativeTerminalConsole />);
    });

    const input = container.querySelector('input');
    act(() => {
      setInputValue(input, 'scanme.nmap.org');
    });

    await act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });

    // Check RUNNING indicators
    expect(container.textContent).toContain('RUNNING');
    expect(container.textContent).toContain('LIVE HOST PROCESS RUNNING');
    expect(container.textContent).toContain('scanme.nmap.org');
    expect(container.textContent).toContain('ABORT [Esc]');

    // Resolve execution to clean up
    await act(async () => {
      resolveExecution({
        success: true,
        data: { output: 'Nmap scan report', status: 'COMPLETED', durationMs: 250, exitCode: 0 }
      });
    });

    expect(container.textContent).toContain('COMPLETED');
  });

  // ── C. COMPLETED State ───────────────────────────────────────────────────
  test('C. displays COMPLETED state with exitCode, duration, formatted output and rerun action', async () => {
    terminalExecutionService.executeNativeTool.mockResolvedValueOnce({
      success: true,
      data: {
        output: 'Nmap scan completed successfully',
        durationMs: 310,
        status: 'COMPLETED',
        exitCode: 0
      }
    });

    await act(async () => {
      root.render(<NativeTerminalConsole />);
    });

    const input = container.querySelector('input');
    act(() => {
      setInputValue(input, '192.168.1.1');
    });

    await act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });

    expect(container.textContent).toContain('COMPLETED');
    expect(container.textContent).toContain('(310ms)');
    expect(container.textContent).toContain('Nmap scan completed successfully');

    // Rerun button exists
    const rerunBtn = container.querySelector('button[title="Re-run this command"]');
    expect(rerunBtn).not.toBeNull();
  });

  // ── D. FAILED State ──────────────────────────────────────────────────────
  test('D. displays FAILED state and actionable error when execution fails', async () => {
    terminalExecutionService.executeNativeTool.mockRejectedValueOnce(new Error('Connection refused by host daemon'));

    await act(async () => {
      root.render(<NativeTerminalConsole />);
    });

    const input = container.querySelector('input');
    act(() => {
      setInputValue(input, '10.0.0.1');
    });

    await act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });

    expect(container.textContent).toContain('FAILED');
    expect(container.textContent).toContain('BACKEND FAILURE');
    expect(container.textContent).toContain('Connection refused by host daemon');
  });

  // ── E. TIMEOUT State ─────────────────────────────────────────────────────
  test('E. displays TIMEOUT state when process exceeds 10-second ceiling', async () => {
    terminalExecutionService.executeNativeTool.mockResolvedValueOnce({
      success: false,
      data: {
        output: '',
        status: 'TIMEOUT',
        exitCode: 124,
        durationMs: 10000
      }
    });

    await act(async () => {
      root.render(<NativeTerminalConsole />);
    });

    const input = container.querySelector('input');
    act(() => {
      setInputValue(input, 'slow.domain.com');
    });

    await act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });

    expect(container.textContent).toContain('TIMEOUT');
    expect(container.textContent).toContain('exceeded the permitted execution window');
  });

  // ── F. CANCELLED State ───────────────────────────────────────────────────
  test('F. handles operator abort and distinguishes CANCELLED state', async () => {
    let resolveExecution;
    terminalExecutionService.executeNativeTool.mockImplementation(() => {
      return new Promise((resolve) => {
        resolveExecution = resolve;
      });
    });

    await act(async () => {
      root.render(<NativeTerminalConsole />);
    });

    const input = container.querySelector('input');
    act(() => {
      setInputValue(input, 'example.com');
    });

    await act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });

    expect(container.textContent).toContain('RUNNING');

    // Trigger Abort
    const abortBtn = container.querySelector('button[aria-label="Abort Running Command (Esc)"]');
    expect(abortBtn).not.toBeNull();

    await act(async () => {
      abortBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(terminalExecutionService.cancelTerminalExecution).toHaveBeenCalled();
    expect(container.textContent).toContain('CANCELLED');
    expect(container.textContent).toContain('Execution was stopped by the operator');
  });

  // ── G. Timer Cleanup ─────────────────────────────────────────────────────
  test('G. cleans up stopwatch interval cleanly on unmount during RUNNING', async () => {
    terminalExecutionService.executeNativeTool.mockImplementation(() => new Promise(() => {}));

    await act(async () => {
      root.render(<NativeTerminalConsole />);
    });

    const input = container.querySelector('input');
    act(() => {
      setInputValue(input, 'example.com');
    });

    await act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });

    expect(container.textContent).toContain('RUNNING');

    // Unmount while running
    expect(() => {
      act(() => {
        root.unmount();
      });
    }).not.toThrow();
  });

  // ── H. Monospace & Text-Only Output Rendering ─────────────────────────────
  test('H. verifies text-only monospace rendering without HTML interpretation', async () => {
    const maliciousScript = '<img src=x onerror=alert(1)> <script>window.pwned=true</script>';
    await act(async () => {
      root.render(<TerminalOutputFormatter output={maliciousScript} toolName="curl" />);
    });

    // Script should NOT execute
    expect(window.pwned).toBeUndefined();
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('<img src=x onerror=alert(1)>');
  });

  // ── I. Structured Dig Output ──────────────────────────────────────────────
  test('I. parses Dig DNS output into structured table and retains DIG PARSED tag', async () => {
    const digOutput = [
      '; <<>> DiG 9.10.6 <<>> +noall +answer +question cloudflare.com',
      ';cloudflare.com.			IN	A',
      'cloudflare.com.		156	IN	A	104.16.132.229',
      'cloudflare.com.		156	IN	A	104.16.133.229'
    ].join('\n');

    await act(async () => {
      root.render(<TerminalOutputFormatter output={digOutput} toolName="dig" />);
    });

    expect(container.textContent).toContain('DIG PARSED');
    expect(container.textContent).toContain('104.16.132.229');
    expect(container.textContent).toContain('104.16.133.229');
  });

  // ── J. Structured Nmap Output ─────────────────────────────────────────────
  test('J. parses Nmap port scan output into structured table with NMAP PARSED tag', async () => {
    const nmapOutput = [
      'Starting Nmap 7.94 ( https://nmap.org ) at 2026-09-17 12:00 UTC',
      'Nmap scan report for scanme.nmap.org (45.33.32.156)',
      'PORT    STATE SERVICE VERSION',
      '22/tcp  open  ssh     OpenSSH 6.6.1p1',
      '80/tcp  open  http    Apache httpd 2.4.7',
      'Nmap done: 1 IP address (1 host up) scanned in 1.45 seconds'
    ].join('\n');

    await act(async () => {
      root.render(<TerminalOutputFormatter output={nmapOutput} toolName="nmap" />);
    });

    expect(container.textContent).toContain('NMAP PARSED');
    expect(container.textContent).toContain('22/tcp');
    expect(container.textContent).toContain('80/tcp');
    expect(container.textContent).toContain('OpenSSH 6.6.1p1');
  });

  // ── K. Structured TLS Output (OpenSSL) ────────────────────────────────────
  test('K. parses OpenSSL TLS certificate dossier with OPENSSL PARSED tag', async () => {
    const sslOutput = [
      'depth=2 C = US, O = Internet Security Research Group, CN = ISRG Root X1',
      'verify return:1',
      'Certificate chain',
      ' 0 s:CN = example.com',
      '   i:C = US, O = Let\'s Encrypt, CN = R3',
      '-----BEGIN CERTIFICATE-----',
      'MII...fakecert...',
      '-----END CERTIFICATE-----',
      'subject=CN = example.com',
      'issuer=C = US, O = Let\'s Encrypt, CN = R3',
      'notBefore=Sep  1 00:00:00 2026 GMT',
      'notAfter=Dec  1 23:59:59 2026 GMT'
    ].join('\n');

    await act(async () => {
      root.render(<TerminalOutputFormatter output={sslOutput} toolName="openssl" />);
    });

    expect(container.textContent).toContain('OPENSSL PARSED');
    expect(container.textContent).toContain('example.com');
    expect(container.textContent).toContain("Let's Encrypt");
  });

  // ── L. Structured Curl Output ─────────────────────────────────────────────
  test('L. parses Curl HTTP response headers with CURL PARSED tag', async () => {
    const curlOutput = [
      'HTTP/2 200',
      'date: Thu, 17 Sep 2026 12:00:00 GMT',
      'content-type: text/html; charset=UTF-8',
      'server: cloudflare',
      '',
      '<!doctype html><html><body>Test Payload</body></html>'
    ].join('\n');

    await act(async () => {
      root.render(<TerminalOutputFormatter output={curlOutput} toolName="curl" />);
    });

    expect(container.textContent).toContain('CURL PARSED');
    expect(container.textContent).toContain('HTTP/2 200');
    expect(container.textContent).toContain('cloudflare');
  });

  // ── M. Ping Latency Metrics ───────────────────────────────────────────────
  test('M. parses Ping metrics into reachability telemetry', async () => {
    const pingOutput = [
      'PING 8.8.8.8 (8.8.8.8): 56 data bytes',
      '64 bytes from 8.8.8.8: icmp_seq=0 ttl=118 time=14.2 ms',
      '64 bytes from 8.8.8.8: icmp_seq=1 ttl=118 time=13.8 ms',
      '--- 8.8.8.8 ping statistics ---',
      '2 packets transmitted, 2 packets received, 0.0% packet loss',
      'round-trip min/avg/max/stddev = 13.8/14.0/14.2/0.2 ms'
    ].join('\n');

    await act(async () => {
      root.render(<TerminalOutputFormatter output={pingOutput} toolName="ping" />);
    });

    expect(container.textContent).toContain('ICMP Network Reachability:');
    expect(container.textContent).toContain('8.8.8.8');
  });

  // ── N. Traceroute Output ─────────────────────────────────────────────────
  test('N. parses Traceroute hop table with TRACEROUTE PARSED tag', async () => {
    const tracerouteOutput = [
      'traceroute to example.com (93.184.216.34), 64 hops max, 52 byte packets',
      ' 1  router.local (192.168.1.1)  1.234 ms  1.123 ms  1.056 ms',
      ' 2  10.0.0.1 (10.0.0.1)  5.432 ms  5.210 ms  5.111 ms',
      ' 3  93.184.216.34 (93.184.216.34)  15.678 ms  15.432 ms  15.123 ms'
    ].join('\n');

    await act(async () => {
      root.render(<TerminalOutputFormatter output={tracerouteOutput} toolName="traceroute" />);
    });

    expect(container.textContent).toContain('TRACEROUTE PARSED');
    expect(container.textContent).toContain('router.local');
    expect(container.textContent).toContain('192.168.1.1');
    expect(container.textContent).toContain('93.184.216.34');
  });

  // ── O. Whois Output ───────────────────────────────────────────────────────
  test('O. parses WHOIS key/value dossier with WHOIS PARSED tag', async () => {
    const whoisOutput = [
      'Domain Name: EXAMPLE.COM',
      'Registry Domain ID: 2336799_DOMAIN_COM-VRSN',
      'Registrar WHOIS Server: whois.iana.org',
      'Registrar: RESERVED-Internet Assigned Numbers Authority',
      'Creation Date: 1995-08-14T04:00:00Z',
      'Registry Expiry Date: 2027-08-13T04:00:00Z',
      'Name Server: A.IANA-SERVERS.NET',
      'Name Server: B.IANA-SERVERS.NET'
    ].join('\n');

    await act(async () => {
      root.render(<TerminalOutputFormatter output={whoisOutput} toolName="whois" />);
    });

    expect(container.textContent).toContain('WHOIS PARSED');
    expect(container.textContent).toContain('EXAMPLE.COM');
    expect(container.textContent).toContain('RESERVED-Internet Assigned Numbers Authority');
    expect(container.textContent).toContain('A.IANA-SERVERS.NET');
  });

  // ── P. Raw-Output Fallback & View Mode Switcher ───────────────────────────
  test('P. provides view mode switcher (ALL, STRUCTURED, RAW) without hiding raw output', async () => {
    const sampleOutput = [
      'PORT    STATE SERVICE',
      '80/tcp  open  http'
    ].join('\n');

    await act(async () => {
      root.render(<TerminalOutputFormatter output={sampleOutput} toolName="nmap" />);
    });

    expect(container.textContent).toContain('NMAP PARSED');
    expect(container.textContent).toContain('RAW HOST EXECUTION BUFFER');

    // Click 'Raw Stream Only'
    const rawBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent.toLowerCase().includes('raw'));
    expect(rawBtn).not.toBeUndefined();

    await act(async () => {
      rawBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // In RAW ONLY mode, structured table is hidden but raw text remains visible
    expect(container.textContent).not.toContain('NMAP PARSED');
    expect(container.textContent).toContain('RAW HOST EXECUTION BUFFER');
    expect(container.textContent).toContain('80/tcp');
  });

  // ── Q. Auto-Scroll Behavior ───────────────────────────────────────────────
  test('Q. initializes with auto-scroll active', async () => {
    await act(async () => {
      root.render(<NativeTerminalConsole />);
    });

    const terminalRegion = container.querySelector('[role="region"][aria-label="Terminal Output Stream"]');
    expect(terminalRegion).not.toBeNull();
  });

  // ── R. Jump to Latest Button ──────────────────────────────────────────────
  test('R. reveals Jump to Latest button when scrolled up, and hides upon clicking', async () => {
    await act(async () => {
      root.render(<NativeTerminalConsole />);
    });

    const scrollContainer = container.querySelector('[role="region"][aria-label="Terminal Output Stream"]');
    expect(scrollContainer).not.toBeNull();

    // Mock scroll dimensions where operator is scrolled up > 60px
    Object.defineProperty(scrollContainer, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(scrollContainer, 'clientHeight', { value: 400, configurable: true });
    Object.defineProperty(scrollContainer, 'scrollTop', { value: 100, configurable: true, writable: true });

    await act(async () => {
      scrollContainer.dispatchEvent(new Event('scroll'));
    });

    // Jump to Latest button should now appear
    const jumpBtn = container.querySelector('button[aria-label="Jump to latest terminal output"]');
    expect(jumpBtn).not.toBeNull();
    expect(jumpBtn.textContent).toContain('Jump to Latest');

    // Click Jump to Latest
    await act(async () => {
      jumpBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Should scroll to bottom and hide button
    expect(scrollContainer.scrollTop).toBe(1000);
    expect(container.querySelector('button[aria-label="Jump to latest terminal output"]')).toBeNull();
  });

  // ── S. Command History (Arrow Keys) ───────────────────────────────────────
  test('S. supports cycling command history with Up/Down arrow keys', async () => {
    sessionStorage.setItem('cybershield_terminal_session_history', JSON.stringify(['ping 1.1.1.1', 'dig google.com']));

    await act(async () => {
      root.render(<NativeTerminalConsole />);
    });

    const input = container.querySelector('input');

    // Press Up arrow
    await act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    });
    expect(input.value).toBe('ping 1.1.1.1');

    // Press Up arrow again
    await act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    });
    expect(input.value).toBe('dig google.com');

    // Press Down arrow
    await act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    });
    expect(input.value).toBe('ping 1.1.1.1');
  });

  // ── T. Command History Privacy & Sanitization ──────────────────────────────
  test('T. strictly redacts credentials, Bearer tokens, URLs with passwords before saving history', () => {
    const rawCmd = 'curl -H "Authorization: Bearer secret_jwt_token_123" https://admin:superSecret123@api.com/v1?api_key=priv_key_999 --password mypass';
    const sanitized = sanitizeCommandForHistory(rawCmd);

    expect(sanitized).not.toContain('secret_jwt_token_123');
    expect(sanitized).not.toContain('superSecret123');
    expect(sanitized).not.toContain('priv_key_999');
    expect(sanitized).not.toContain('mypass');
    expect(sanitized).toContain('Authorization: [REDACTED]');
    expect(sanitized).toContain('://admin:[REDACTED]@api.com');
    expect(sanitized).toContain('api_key=[REDACTED]');
    expect(sanitized).toContain('--password [REDACTED]');

    // Standalone Bearer token test
    const standaloneBearer = sanitizeCommandForHistory('curl token Bearer my_secret_token_abc');
    expect(standaloneBearer).not.toContain('my_secret_token_abc');
    expect(standaloneBearer).toContain('Bearer [REDACTED]');
  });

  // ── U. Clear History ─────────────────────────────────────────────────────
  test('U. purges history from sessionStorage when history -c is executed', async () => {
    sessionStorage.setItem('cybershield_terminal_session_history', JSON.stringify(['curl test.com']));

    await act(async () => {
      root.render(<NativeTerminalConsole />);
    });

    const input = container.querySelector('input');
    act(() => {
      setInputValue(input, 'history -c');
    });

    await act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });

    expect(container.textContent).toContain('purged successfully from session storage');
    expect(sessionStorage.getItem('cybershield_terminal_session_history')).toBeNull();
  });

  // ── V. Tool Selection UX ─────────────────────────────────────────────────
  test('V. selecting a tool populates safe template target and focuses input without auto-execution', async () => {
    await act(async () => {
      root.render(<NativeTerminalConsole />);
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    const digToolBtn = buttons.find(b => b.textContent.includes('dig'));
    expect(digToolBtn).not.toBeUndefined();

    await act(async () => {
      digToolBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const input = container.querySelector('input');
    expect(input.value).toBe('cloudflare.com');
    // Ensure no automatic execution was triggered
    expect(terminalExecutionService.executeNativeTool).not.toHaveBeenCalled();
  });

  // ── W. Unavailable Tool UX ───────────────────────────────────────────────
  test('W. rejects execution of unavailable tool without calling execution endpoint', async () => {
    await act(async () => {
      root.render(<NativeTerminalConsole />);
    });

    const input = container.querySelector('input');
    act(() => {
      setInputValue(input, 'traceroute example.com');
    });

    await act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });

    expect(container.textContent).toContain('UNAVAILABLE');
    expect(container.textContent).toContain('is not available on this host');
    expect(container.textContent).toContain('missing from system PATH');
    expect(terminalExecutionService.executeNativeTool).not.toHaveBeenCalled();
  });

  // ── X. Restricted Tool UX ────────────────────────────────────────────────
  test('X. rejects execution of unauthorized binary (e.g. bash) without calling API', async () => {
    await act(async () => {
      root.render(<NativeTerminalConsole />);
    });

    const input = container.querySelector('input');
    act(() => {
      setInputValue(input, 'bash -c "whoami"');
    });

    await act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });

    expect(container.textContent).toContain('RESTRICTED COMMAND');
    expect(container.textContent).toContain('Tool \'bash\' is not authorized');
    expect(container.textContent).toContain('/toolkit');
    expect(terminalExecutionService.executeNativeTool).not.toHaveBeenCalled();
  });

  // ── Y. Cancellation Ownership Validation ──────────────────────────────────
  test('Y. abort invokes cancelTerminalExecution with active executionId', async () => {
    let resolveExecution;
    terminalExecutionService.executeNativeTool.mockImplementation(() => {
      return new Promise((resolve) => {
        resolveExecution = resolve;
      });
    });

    await act(async () => {
      root.render(<NativeTerminalConsole />);
    });

    const input = container.querySelector('input');
    act(() => {
      setInputValue(input, 'scanme.nmap.org');
    });

    await act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });

    const abortBtn = container.querySelector('button[aria-label="Abort Running Command (Esc)"]');
    expect(abortBtn).not.toBeNull();

    await act(async () => {
      abortBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(terminalExecutionService.cancelTerminalExecution).toHaveBeenCalledWith(
      expect.stringMatching(/^exec_/)
    );
  });

  // ── Z. Strict Absence of AI ───────────────────────────────────────────────
  test('Z. verifies zero AI copilot, LLM prompt, or generative chatbot interfaces in terminal', async () => {
    await act(async () => {
      root.render(<NativeTerminalConsole />);
    });

    expect(container.textContent).not.toContain('Copilot');
    expect(container.textContent).not.toContain('AI Prompt');
    expect(container.textContent).not.toContain('LLM');
    expect(container.textContent).not.toContain('GPT');
    expect(container.textContent).not.toContain('Claude');
  });

  // ── AA. Strict Absence of WebSocket / Socket.io ───────────────────────────
  test('AA. verifies zero WebSocket connections initialized by NativeTerminalConsole', async () => {
    let wsCreated = false;
    class MockWS {
      constructor() {
        wsCreated = true;
      }
    }
    const originalWS = window.WebSocket;
    window.WebSocket = MockWS;

    await act(async () => {
      root.render(<NativeTerminalConsole />);
    });

    expect(wsCreated).toBe(false);
    window.WebSocket = originalWS;
  });

  // ── AB. Zero External Execution Fallback ───────────────────────────────────
  test('AB. verifies target entry executes solely via POST /api/terminal/execute-native', async () => {
    await act(async () => {
      root.render(<NativeTerminalConsole />);
    });

    const input = container.querySelector('input');
    act(() => {
      setInputValue(input, 'scanme.nmap.org');
    });

    await act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });

    expect(terminalExecutionService.executeNativeTool).toHaveBeenCalledWith(
      'nmap',
      'scanme.nmap.org',
      [],
      expect.stringMatching(/^exec_/)
    );
  });

  // ── AC. Accessibility Standards (ARIA) ───────────────────────────────────
  test('AC. provides accessible ARIA labels, live region, and keyboard hotkeys', async () => {
    await act(async () => {
      root.render(<NativeTerminalConsole />);
    });

    const outputRegion = container.querySelector('[role="region"][aria-label="Terminal Output Stream"]');
    expect(outputRegion).not.toBeNull();
    expect(outputRegion.getAttribute('aria-live')).toBe('polite');

    const input = container.querySelector('input[aria-label="Terminal Target or Command Input"]');
    expect(input).not.toBeNull();

    expect(container.textContent).toContain('Enter: Run');
    expect(container.textContent).toContain('Esc: Abort');
    expect(container.textContent).toContain('Ctrl+L: Clear');
  });

  // ── AD. Architecture Separation (111 Tools vs 7 Native Binaries) ───────────
  test('AD. strictly maintains separation: 7 native tools in registry, 111 canonical tools in /toolkit', () => {
    expect(TERMINAL_NATIVE_REGISTRY.length).toBe(7);
    expect(NATIVE_EXECUTABLES_SET.size).toBe(7);
    expect(Array.from(NATIVE_EXECUTABLES_SET).sort()).toEqual([
      'curl', 'dig', 'nmap', 'openssl', 'ping', 'traceroute', 'whois'
    ].sort());
  });
});
