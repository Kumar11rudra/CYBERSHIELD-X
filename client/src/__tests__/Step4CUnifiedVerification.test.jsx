import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import Layout from '../components/common/Layout';
import HomePage from '../pages/HomePage';
import ComingSoonView from '../components/toolkit/ComingSoonView';
import BinaryMatrixRain from '../components/home/BinaryMatrixRain';
import CyberTerminalModal from '../components/terminal/CyberTerminalModal';

// Mock AuthContext
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'usr-analyst-1', email: 'analyst@cybershield.internal', role: 'ADMIN' },
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
      }
    }),
  };
});

// Mock react-router-dom useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock API
jest.mock('../services/api', () => ({
  get: jest.fn().mockResolvedValue({ data: { data: { status: 'ready' } } }),
  post: jest.fn().mockResolvedValue({ data: { success: true } }),
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

// Mock IntersectionObserver for Counter in HomePage
class MockIntersectionObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}
window.IntersectionObserver = MockIntersectionObserver;
global.IntersectionObserver = MockIntersectionObserver;

describe('CYBERSHIELD X — STEP 4C UNIFIED VERIFICATION BATTERY', () => {
  let container;
  let root;

  beforeEach(() => {
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

  describe('Gate A: Brand Logo Navigation to /', () => {
    test('Layout renders brand logo linking to / on both desktop and mobile', () => {
      act(() => {
        root.render(
          <MemoryRouter>
            <Layout />
          </MemoryRouter>
        );
      });

      const brandLinks = container.querySelectorAll('a[aria-label="CyberShield X Home"]');
      expect(brandLinks.length).toBeGreaterThanOrEqual(2);
      brandLinks.forEach((link) => {
        expect(link.getAttribute('href')).toBe('/');
      });
    });
  });

  describe('Gate B: Binary Matrix Rain Specification', () => {
    test('BinaryMatrixRain mounts canvas with aria-hidden="true" and pointer-events-none', () => {
      act(() => {
        root.render(<BinaryMatrixRain />);
      });

      const canvas = container.querySelector('[data-testid="binary-matrix-rain"]');
      expect(canvas).not.toBeNull();
      expect(canvas.getAttribute('aria-hidden')).toBe('true');
      expect(canvas.className).toContain('pointer-events-none');
    });

    test('BinaryMatrixRain uses requestAnimationFrame and cancels on unmount', () => {
      const originalRAF = window.requestAnimationFrame;
      const originalCAF = window.cancelAnimationFrame;

      const mockRAF = jest.fn().mockReturnValue(12345);
      const mockCAF = jest.fn();

      window.requestAnimationFrame = mockRAF;
      window.cancelAnimationFrame = mockCAF;

      const mockGetContext = jest.fn().mockReturnValue({
        fillRect: jest.fn(),
        fillText: jest.fn(),
        fillStyle: '',
        font: '',
      });
      HTMLCanvasElement.prototype.getContext = mockGetContext;

      act(() => {
        root.render(<BinaryMatrixRain />);
      });
      expect(mockRAF).toHaveBeenCalled();

      act(() => {
        root.unmount();
      });
      expect(mockCAF).toHaveBeenCalledWith(12345);

      window.requestAnimationFrame = originalRAF;
      window.cancelAnimationFrame = originalCAF;
    });

    test('BinaryMatrixRain respects prefers-reduced-motion without animation loop', () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const mockRAF = jest.fn();
      window.requestAnimationFrame = mockRAF;

      const mockGetContext = jest.fn().mockReturnValue({
        fillRect: jest.fn(),
        fillText: jest.fn(),
        fillStyle: '',
        font: '',
      });
      HTMLCanvasElement.prototype.getContext = mockGetContext;

      act(() => {
        root.render(<BinaryMatrixRain />);
      });

      // Under reduced motion, requestAnimationFrame should NOT be called
      expect(mockRAF).not.toHaveBeenCalled();

      window.matchMedia = originalMatchMedia;
    });
  });

  describe('Gate C: Home Featured Cards External-Only Flow', () => {
    test('HomePage renders BinaryMatrixRain in the background', () => {
      act(() => {
        root.render(
          <MemoryRouter>
            <HomePage />
          </MemoryRouter>
        );
      });
      expect(container.querySelector('[data-testid="binary-matrix-rain"]')).not.toBeNull();
    });

    test('HomePage featured tool cards open ExternalAlternativesModal on click', () => {
      act(() => {
        root.render(
          <MemoryRouter>
            <HomePage />
          </MemoryRouter>
        );
      });

      // Modal initially closed
      expect(container.querySelector('[role="dialog"]')).toBeNull();

      // Find tool cards in the featured tools section
      const toolCards = container.querySelectorAll('article');
      expect(toolCards.length).toBeGreaterThanOrEqual(1);

      // Click the first featured tool card
      act(() => {
        toolCards[0].click();
      });

      // Verify ExternalAlternativesModal opened
      const modal = container.querySelector('[role="dialog"]');
      expect(modal).not.toBeNull();
      expect(modal.textContent).toContain('External Alternatives');
      expect(modal.textContent).toContain('Outbound Provider Policy');

      // Verify it did NOT navigate to /toolkit/:toolId or /signup
      expect(mockNavigate).not.toHaveBeenCalledWith(expect.stringMatching(/^\/toolkit\/.+/));
      expect(mockNavigate).not.toHaveBeenCalledWith('/signup');
    });
  });

  describe('Gate D: Terminal Entry Cleanup', () => {
    test('ComingSoonView launches directly into /terminal with query parameters', () => {
      act(() => {
        root.render(
          <MemoryRouter>
            <ComingSoonView toolId="dns" />
          </MemoryRouter>
        );
      });

      const form = container.querySelector('form');
      expect(form).not.toBeNull();

      act(() => {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringMatching(/^\/terminal\?tool=dns&target=/)
      );
    });

    test('ComingSoonView does not contain stale AI triage copy', () => {
      act(() => {
        root.render(
          <MemoryRouter>
            <ComingSoonView toolId="dns" />
          </MemoryRouter>
        );
      });
      expect(container.textContent).not.toContain('AI triage synthesis');
      expect(container.textContent).toContain('host-native execution');
    });
  });

  describe('Gate E: Legacy CyberTerminalModal Decommissioning', () => {
    test('CyberTerminalModal is decommissioned and redirects to /terminal if mounted', () => {
      const mockClose = jest.fn();
      act(() => {
        root.render(
          <MemoryRouter>
            <CyberTerminalModal
              isOpen={true}
              onClose={mockClose}
              initialTool={{ id: 'nmap' }}
              initialTarget="scanme.nmap.org"
            />
          </MemoryRouter>
        );
      });

      expect(mockClose).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/terminal?tool=nmap&target=scanme.nmap.org');
    });

    test('Layout does not render CyberTerminalModal', () => {
      act(() => {
        root.render(
          <MemoryRouter>
            <Layout />
          </MemoryRouter>
        );
      });
      expect(container.querySelector('.cyber-terminal-modal')).toBeNull();
    });
  });
});
