import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import NativeTerminalConsole from '../components/terminal/NativeTerminalConsole';
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
        executionTimeMs: 120,
        status: 'COMPLETED'
      }
    }),
    checkToolCapability: jest.fn().mockResolvedValue({
      toolId: 'curl',
      installed: true,
      executionTarget: 'HOST_NATIVE'
    })
  };
});

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

describe('Centralized Native Terminal — Step 2 Native Tool Discovery & Registry Battery', () => {
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

  // ── 1. Native Terminal Registry Definition ─────────────────────────────────
  test('terminalNativeRegistry contains ONLY the 7 verified native tools', () => {
    expect(TERMINAL_NATIVE_REGISTRY.length).toBe(7);

    const toolIds = TERMINAL_NATIVE_REGISTRY.map(t => t.id);
    expect(toolIds).toEqual(['nmap', 'dig', 'curl', 'whois', 'openssl', 'ping', 'traceroute']);

    // Canonical 111 tools that are NOT native
    expect(NATIVE_EXECUTABLES_SET.has('sqlmap')).toBe(false);
    expect(NATIVE_EXECUTABLES_SET.has('nikto')).toBe(false);
    expect(NATIVE_EXECUTABLES_SET.has('burp')).toBe(false);
    expect(NATIVE_EXECUTABLES_SET.has('metasploit')).toBe(false);
    expect(NATIVE_EXECUTABLES_SET.has('hydra')).toBe(false);
    expect(NATIVE_EXECUTABLES_SET.has('aircrack-ng')).toBe(false);
    expect(NATIVE_EXECUTABLES_SET.has('wireshark')).toBe(false);

    // Authorization checker
    expect(isNativeToolAuthorized('nmap')).toBe(true);
    expect(isNativeToolAuthorized('dig')).toBe(true);
    expect(isNativeToolAuthorized('curl')).toBe(true);
    expect(isNativeToolAuthorized('sqlmap')).toBe(false);
    expect(isNativeToolAuthorized('bash')).toBe(false);
    expect(isNativeToolAuthorized('rm')).toBe(false);
  });

  test('resolves native tool aliases and commands accurately', () => {
    expect(resolveNativeTool('nmap').id).toBe('nmap');
    expect(resolveNativeTool('network-map').id).toBe('nmap');
    expect(resolveNativeTool('dig').id).toBe('dig');
    expect(resolveNativeTool('dns-lookup').id).toBe('dig');
    expect(resolveNativeTool('whois').id).toBe('whois');
    expect(resolveNativeTool('whois-lookup').id).toBe('whois');
    expect(resolveNativeTool('unknown-tool')).toBeNull();
  });

  test('annotates registry with host capabilities and availability states', () => {
    const mockHostCaps = {
      nativeCapabilities: [
        { id: 'nmap', availability: 'AVAILABLE' },
        { id: 'traceroute', availability: 'NOT INSTALLED' },
        { id: 'curl', availability: 'AVAILABLE' }
      ]
    };

    expect(getToolAvailability('nmap', mockHostCaps)).toBe('AVAILABLE');
    expect(getToolAvailability('traceroute', mockHostCaps)).toBe('NOT INSTALLED');
    expect(getToolAvailability('curl', mockHostCaps)).toBe('AVAILABLE');

    const annotated = getAnnotatedNativeRegistry(mockHostCaps);
    const tr = annotated.find(t => t.id === 'traceroute');
    expect(tr.availability).toBe('NOT INSTALLED');
    expect(tr.isExecutable).toBe(false);

    const nm = annotated.find(t => t.id === 'nmap');
    expect(nm.availability).toBe('AVAILABLE');
    expect(nm.isExecutable).toBe(true);
  });

  // ── 2. Terminal UI Renders Tool Selector with Status Indicators ────────────
  test('renders tool selector with live status indicators and safe templates', async () => {
    await act(async () => {
      root.render(<NativeTerminalConsole />);
    });

    // Verify selector buttons
    expect(container.textContent).toContain('nmap');
    expect(container.textContent).toContain('dig');
    expect(container.textContent).toContain('curl');
    expect(container.textContent).toContain('whois');
    expect(container.textContent).toContain('openssl');
    expect(container.textContent).toContain('ping');
    expect(container.textContent).toContain('traceroute');

    // Traceroute should display OFFLINE badge because mock returns NOT INSTALLED
    expect(container.textContent).toContain('OFFLINE');
  });

  // ── 3. Tool Click Populates Safe Template and Updates Badge ───────────────
  test('clicking an available tool populates safe default target in input', async () => {
    await act(async () => {
      root.render(<NativeTerminalConsole />);
    });

    const buttons = container.querySelectorAll('button');
    const digBtn = Array.from(buttons).find(b => b.textContent.includes('dig'));
    expect(digBtn).not.toBeNull();

    act(() => {
      digBtn.click();
    });

    // Input should be populated with dig's default target
    const input = container.querySelector('input');
    expect(input.value).toBe('cloudflare.com');

    // Prompt badge displays dig
    expect(container.textContent).toContain('nexus@cybershield:~$dig');
  });

  // ── 4. Offline / Unavailable Tool Disables Execution ──────────────────────
  test('selecting an uninstalled tool renders disabled status and prevents execution', async () => {
    await act(async () => {
      root.render(<NativeTerminalConsole />);
    });

    const buttons = container.querySelectorAll('button');
    const traceBtn = Array.from(buttons).find(b => b.textContent.includes('traceroute'));
    expect(traceBtn).not.toBeNull();

    act(() => {
      traceBtn.click();
    });

    // Prompt badge displays traceroute with OFFLINE
    expect(container.textContent).toContain('traceroute');
    expect(container.textContent).toContain('OFFLINE');

    // Execute button should say "Unavailable" and be disabled
    const execBtn = Array.from(container.querySelectorAll('button')).find(b =>
      b.textContent.includes('Unavailable') || b.textContent.includes('Execute')
    );
    expect(execBtn.textContent).toContain('Unavailable');
    expect(execBtn.disabled).toBe(true);
  });

  // Helper to trigger React's controlled input onChange
  const setInputValue = (input, value) => {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    ).set;
    nativeInputValueSetter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };

  // ── 5. Rejection of Restricted Canonical/Shell Commands ───────────────────
  test('submitting a non-native command (e.g. sqlmap) displays restricted rejection without network execution', async () => {
    await act(async () => {
      root.render(<NativeTerminalConsole />);
    });

    const input = container.querySelector('input');

    act(() => {
      setInputValue(input, 'sqlmap -u example.com');
    });

    await act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });

    // Should output structured rejection
    expect(container.textContent).toContain('RESTRICTED COMMAND');
    expect(container.textContent).toContain("Tool 'sqlmap' is not authorized for native terminal execution");
    expect(container.textContent).toContain('/toolkit');

    // executeNativeTool must NOT have been called
    expect(terminalExecutionService.executeNativeTool).not.toHaveBeenCalled();
  });

  // ── 6. Help and Tools Commands ────────────────────────────────────────────
  test('tools command lists the 7 native tools and mentions the 111 canonical catalog separation', async () => {
    await act(async () => {
      root.render(<NativeTerminalConsole />);
    });

    const input = container.querySelector('input');

    act(() => {
      setInputValue(input, 'tools');
    });

    await act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });

    expect(container.textContent).toContain('NATIVE TERMINAL TOOL REGISTRY (7 VERIFIED CAPABILITIES)');
    expect(container.textContent).toContain('nmap');
    expect(container.textContent).toContain('dig');
    expect(container.textContent).toContain('curl');
    expect(container.textContent).toContain('whois');
    expect(container.textContent).toContain('openssl');
    expect(container.textContent).toContain('ping');
    expect(container.textContent).toContain('traceroute');
    expect(container.textContent).toContain('/toolkit');
  });

  // ── 7. Strict Architectural Boundaries ────────────────────────────────────
  test('confirms zero AI engine tabs, copilot widgets, or websocket toolkit connections', async () => {
    await act(async () => {
      root.render(<NativeTerminalConsole />);
    });

    expect(container.textContent).not.toContain('Copilot');
    expect(container.textContent).not.toContain('Gemini');
    expect(container.textContent).not.toContain('Claude');
    expect(container.textContent).not.toContain('ChatGPT');
    expect(container.textContent).not.toContain('ws://');
    expect(container.textContent).not.toContain('/ws/toolkit');
  });
});
