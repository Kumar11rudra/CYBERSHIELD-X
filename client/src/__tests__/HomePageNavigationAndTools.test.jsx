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
    t: (key) => {
      const map = {
        'home.hero.ctaCreate': 'CREATE ACCOUNT',
        'home.hero.ctaSignIn': 'SIGN IN',
      };
      return map[key] || key;
    },
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

describe('🛡️ HomePage Classic Ergonomics & Layout Verification', () => {
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

  test('hero always renders classic CREATE ACCOUNT and SIGN IN buttons', async () => {
    mockUser = null;

    await act(async () => {
      root.render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    const createBtn = buttons.find((b) => b.textContent.includes('CREATE ACCOUNT'));
    const signInBtn = buttons.find((b) => b.textContent.includes('SIGN IN'));

    expect(createBtn).toBeDefined();
    expect(signInBtn).toBeDefined();
  });

  test('hero renders CREATE ACCOUNT and SIGN IN for authenticated operators as well', async () => {
    mockUser = { id: 'usr-analyst-1', email: 'analyst@cybershield.local', role: 'admin' };

    await act(async () => {
      root.render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    const createBtn = buttons.find((b) => b.textContent.includes('CREATE ACCOUNT'));
    const signInBtn = buttons.find((b) => b.textContent.includes('SIGN IN'));

    expect(createBtn).toBeDefined();
    expect(signInBtn).toBeDefined();
  });

  test('explore button navigates to security tools without cluttering homepage', async () => {
    mockUser = null;

    await act(async () => {
      root.render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    const exploreBtn = buttons.find((b) => b.textContent.includes('Explore All Security Tools'));
    expect(exploreBtn).toBeDefined();
  });
});
