import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../pages/HomePage';

let mockUser = null;

// Mock IntersectionObserver for JSDOM
class MockIntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.IntersectionObserver = MockIntersectionObserver;
global.IntersectionObserver = MockIntersectionObserver;

// Mock API service
jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({ data: { ticker: ['MOCK THREAT FEED ITEM'] } }),
    post: jest.fn().mockResolvedValue({ data: {} }),
  },
}));

// Mock AuthContext dynamically
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: jest.fn(),
  }),
  AuthContext: {
    Provider: ({ value, children }) => children,
    Consumer: ({ children }) => children({ user: mockUser }),
  },
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

// Mock framer-motion to simplify rendering in JSDOM
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    useReducedMotion: () => false,
    AnimatePresence: ({ children }) => <>{children}</>,
    motion: new Proxy({}, {
      get: (target, prop) => {
        return ({ children, className, style, onClick, 'aria-label': ariaLabel, 'data-testid': testId, ...rest }) => {
          const Tag = typeof prop === 'string' ? prop : 'div';
          return (
            <Tag className={className} style={style} onClick={onClick} aria-label={ariaLabel} data-testid={testId}>
              {children}
            </Tag>
          );
        };
      },
    }),
  };
});

// Mock Canvas / Matrix Rain
jest.mock('../components/home/BinaryMatrixRain', () => () => <div data-testid="matrix-rain" />);

global.IS_REACT_ACT_ENVIRONMENT = true;
jest.setTimeout(15000);

describe('🛡️ HomePage Ergonomics & Tool Exploration Verification', () => {
  let container;
  let root;

  beforeEach(() => {
    mockUser = null;
    jest.clearAllMocks();
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

  test('unauthenticated visitor: navbar shows Sign In / Get Started, does NOT show Dashboard tab', async () => {
    mockUser = null;

    await act(async () => {
      root.render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );
    });

    // Verify dashboard tab is absent
    const dashboardTab = container.querySelector('[data-testid="homepage-dashboard-tab"]');
    expect(dashboardTab).toBeNull();

    // Verify Sign In and Get Started links exist
    const navText = container.textContent;
    expect(navText).toContain('Sign In');
    expect(navText).toContain('Get Started');
  });

  test('authenticated user: navbar displays glowing [ 🛡️ DASHBOARD ➔ ] link', async () => {
    mockUser = { id: 'usr-analyst-1', email: 'analyst@cybershield.local', role: 'admin' };

    await act(async () => {
      root.render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );
    });

    const dashboardTab = container.querySelector('[data-testid="homepage-dashboard-tab"]');
    expect(dashboardTab).not.toBeNull();
    expect(dashboardTab.getAttribute('href')).toBe('/dashboard');
    expect(dashboardTab.textContent).toContain('DASHBOARD');
  });

  test('clicking "Explore All Security Tools" toggles inline repository without page redirection', async () => {
    mockUser = null;

    await act(async () => {
      root.render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );
    });

    // Initially, expanded section should not exist
    expect(container.querySelector('[data-testid="homepage-expanded-tools-section"]')).toBeNull();

    const toggleButton = container.querySelector('[data-testid="explore-all-tools-toggle"]');
    expect(toggleButton).not.toBeNull();
    expect(toggleButton.textContent).toContain('EXPLORE ALL 125 SECURITY TOOLS & CAPABILITIES');

    // Click toggle to expand
    await act(async () => {
      toggleButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Expanded section must now be rendered
    const expandedSection = container.querySelector('[data-testid="homepage-expanded-tools-section"]');
    expect(expandedSection).not.toBeNull();

    // Search input must be present
    const searchInput = container.querySelector('[data-testid="homepage-tool-search-input"]');
    expect(searchInput).not.toBeNull();

    // Button label toggles to COLLAPSE
    expect(toggleButton.textContent).toContain('COLLAPSE SECURITY TOOLS REPOSITORY');

    // Filter tools via search input
    await act(async () => {
      searchInput.value = 'port scanner';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Toggle button to collapse
    await act(async () => {
      toggleButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Section is collapsed
    expect(container.querySelector('[data-testid="homepage-expanded-tools-section"]')).toBeNull();
    expect(toggleButton.textContent).toContain('EXPLORE ALL 125 SECURITY TOOLS & CAPABILITIES');
  });
});
