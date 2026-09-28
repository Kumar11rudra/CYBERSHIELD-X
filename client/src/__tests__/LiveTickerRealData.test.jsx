import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import api from '../services/api';

// Mock API service
jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// Mock AuthContext
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    logout: jest.fn(),
  }),
}));

// Mock ThemeContext
jest.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    isDark: true,
    toggleTheme: jest.fn(),
  }),
}));

// Mock OrganizationContext
jest.mock('../context/OrganizationContext', () => ({
  useOrganization: () => ({
    organizations: [],
    activeOrg: null,
    isOrgMode: false,
  }),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { changeLanguage: jest.fn() },
  }),
}));

// Mock framer-motion
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  const React = require('react');
  return {
    ...actual,
    useReducedMotion: () => false,
    AnimatePresence: ({ children }) => <>{children}</>,
    motion: new Proxy({}, {
      get: (target, prop) => {
        return ({ children, className, style, onClick, 'aria-label': ariaLabel, 'data-testid': testId }) => {
          const Tag = typeof prop === 'string' ? prop : 'div';
          return React.createElement(Tag, { className, style, onClick, 'aria-label': ariaLabel, 'data-testid': testId }, children);
        };
      },
    }),
  };
});

describe('Step 1: Homepage Real-Data Alert/Threat Ticker', () => {
  let container;
  let root;

  beforeAll(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    window.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    HTMLCanvasElement.prototype.getContext = () => ({
      fillRect: () => {},
      clearRect: () => {},
      getImageData: () => ({ data: [] }),
      putImageData: () => {},
      createImageData: () => ({ data: [] }),
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      fillText: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      arc: () => {},
      fill: () => {},
    });
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    jest.clearAllMocks();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    container = null;
  });

  test('1. LiveTicker initially renders fallback dataset immediately without blank state', () => {
    // Return pending promise so initial render displays static fallback
    api.get.mockReturnValueOnce(new Promise(() => {}));

    act(() => {
      root.render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );
    });

    const ticker = container.querySelector('[data-testid="homepage-live-ticker"]');
    expect(ticker).not.toBeNull();
    expect(ticker.textContent).toContain('CISA KEV: Critical RCE in Ivanti Connect Secure');
    expect(ticker.textContent).toContain('UrlEngine: 2.3M new IOCs detected');
  });

  test('2. LiveTicker dynamically updates with real CISA KEV data when /threat-feed responds', async () => {
    const mockRealTicker = [
      '⚠ CISA KEV: Citrix NetScaler Memory Buffer Vulnerability (CVE-2026-88772)',
      '🔴 CISA KEV (Ransomware): Progress MOVEit SQLi (CVE-2023-34362)',
      '⚠ CISA KEV: Microsoft SharePoint Code Injection (CVE-2026-65660)',
    ];

    api.get.mockResolvedValueOnce({
      data: {
        source: 'CISA Known Exploited Vulnerabilities Catalog',
        isLive: true,
        ticker: mockRealTicker,
      },
    });

    await act(async () => {
      root.render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );
    });

    const ticker = container.querySelector('[data-testid="homepage-live-ticker"]');
    expect(ticker).not.toBeNull();
    expect(ticker.textContent).toContain('Citrix NetScaler Memory Buffer Vulnerability (CVE-2026-88772)');
    expect(ticker.textContent).toContain('Progress MOVEit SQLi (CVE-2023-34362)');
    expect(ticker.textContent).toContain('Microsoft SharePoint Code Injection (CVE-2026-65660)');
  });

  test('3. LiveTicker gracefully preserves fallback ticker when API call fails or times out', async () => {
    api.get.mockRejectedValueOnce(new Error('Network timeout (ETIMEDOUT)'));

    await act(async () => {
      root.render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );
    });

    const ticker = container.querySelector('[data-testid="homepage-live-ticker"]');
    expect(ticker).not.toBeNull();
    // Fallback is still intact, no crash
    expect(ticker.textContent).toContain('CISA KEV: Critical RCE in Ivanti Connect Secure');
  });

  test('4. LiveTicker gracefully handles malformed or empty ticker payload from API', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        ticker: [],
      },
    });

    await act(async () => {
      root.render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );
    });

    const ticker = container.querySelector('[data-testid="homepage-live-ticker"]');
    expect(ticker).not.toBeNull();
    expect(ticker.textContent).toContain('CISA KEV: Critical RCE in Ivanti Connect Secure');
  });

  test('5. LiveTicker sanitizes HTML tags from remote ticker strings', async () => {
    const maliciousTicker = [
      '⚠ CISA KEV: Exploit<script>alert("xss")</script> in Target (CVE-2026-0001)',
    ];

    api.get.mockResolvedValueOnce({
      data: {
        ticker: maliciousTicker,
      },
    });

    await act(async () => {
      root.render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );
    });

    const ticker = container.querySelector('[data-testid="homepage-live-ticker"]');
    expect(ticker.innerHTML).not.toContain('<script>');
    expect(ticker.textContent).toContain('Exploitalert("xss") in Target (CVE-2026-0001)');
  });

  test('6. LiveTicker preserves styling, animation keyframes and duplicate track loop', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        ticker: ['⚠ CISA KEV: Real Exploit 1 (CVE-2026-0001)', '🔴 CISA KEV: Real Exploit 2 (CVE-2026-0002)'],
      },
    });

    await act(async () => {
      root.render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );
    });

    const ticker = container.querySelector('[data-testid="homepage-live-ticker"]');
    expect(ticker.style.position).toBe('absolute');
    expect(ticker.style.top).toBe('0px');
    expect(ticker.style.overflow).toBe('hidden');

    const track = ticker.firstElementChild;
    expect(track.style.animation).toBe('ticker 40s linear infinite');

    // Duplicate track loop mapping has exactly 4 items (2 + 2)
    const spans = track.querySelectorAll('span');
    expect(spans).toHaveLength(4);
    expect(spans[0].style.color).toBe('rgb(0, 191, 255)');
    expect(spans[0].style.fontSize).toBe('13px');
  });
});
