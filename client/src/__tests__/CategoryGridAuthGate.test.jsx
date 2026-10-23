import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import NexusCategoryGrid from '../components/home/NexusCategoryGrid';
import { AuthContext } from '../context/AuthContext';

// Mock IntersectionObserver for framer-motion in JSDOM
class MockIntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.IntersectionObserver = MockIntersectionObserver;
global.IntersectionObserver = MockIntersectionObserver;

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

describe('🔒 NexusCategoryGrid Authentication Gate (Security Remediation)', () => {
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

  test('user clicking category card triggers onSelectCategory without redirecting to /login', async () => {
    const mockSelectCategory = jest.fn();

    await act(async () => {
      root.render(
        <MemoryRouter>
          <AuthContext.Provider value={{ user: null }}>
            <NexusCategoryGrid onSelectCategory={mockSelectCategory} />
          </AuthContext.Provider>
        </MemoryRouter>
      );
    });

    const cards = container.querySelectorAll('[role="button"]');
    expect(cards.length).toBeGreaterThan(0);

    // Click the first category card
    act(() => {
      cards[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Must invoke onSelectCategory and NOT redirect to /login
    expect(mockSelectCategory).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalledWith('/login');
  });

  test('user pressing Enter on category card triggers onSelectCategory without redirect', async () => {
    const mockSelectCategory = jest.fn();

    await act(async () => {
      root.render(
        <MemoryRouter>
          <AuthContext.Provider value={{ user: null }}>
            <NexusCategoryGrid onSelectCategory={mockSelectCategory} />
          </AuthContext.Provider>
        </MemoryRouter>
      );
    });

    const cards = container.querySelectorAll('[role="button"]');
    expect(cards.length).toBeGreaterThan(0);

    // Press Enter on the second card
    act(() => {
      cards[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });

    expect(mockSelectCategory).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalledWith('/login');
  });

  test('user clicking category card with onAlternatives opens alternatives modal without redirect', async () => {
    const mockAlternatives = jest.fn();

    await act(async () => {
      root.render(
        <MemoryRouter>
          <AuthContext.Provider value={{ user: null }}>
            <NexusCategoryGrid onAlternatives={mockAlternatives} />
          </AuthContext.Provider>
        </MemoryRouter>
      );
    });

    const cards = container.querySelectorAll('[role="button"]');
    expect(cards.length).toBeGreaterThan(0);

    // Click the first category card
    act(() => {
      cards[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Must invoke onAlternatives with tool object and NOT redirect to /login
    expect(mockAlternatives).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalledWith('/login');
    const calledWith = mockAlternatives.mock.calls[0][0];
    expect(calledWith).toBeDefined();
    expect(calledWith.id).toBeDefined();
  });

  test('fallback without props navigates safely to /dashboard', async () => {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <AuthContext.Provider value={{ user: null }}>
            <NexusCategoryGrid />
          </AuthContext.Provider>
        </MemoryRouter>
      );
    });

    const cards = container.querySelectorAll('[role="button"]');
    act(() => {
      cards[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
});
