import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';

// Mock AuthContext
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'test_operator', name: 'Test Operator' },
    logout: jest.fn(),
  }),
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Step 2: Dashboard 0/1 Binary Matrix Rain Background', () => {
  let container;
  let root;

  beforeAll(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
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
    sessionStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    jest.clearAllMocks();
  });

  afterEach(() => {
    act(() => {
      if (root) root.unmount();
    });
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  test('1. Dashboard renders BinaryMatrixRain canvas background layer', () => {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <DashboardPage />
        </MemoryRouter>
      );
    });

    const matrixCanvas = container.querySelector('canvas[data-testid="binary-matrix-rain"]');
    expect(matrixCanvas).not.toBeNull();
    expect(matrixCanvas.getAttribute('aria-hidden')).toBe('true');
  });

  test('2. Matrix is present exactly once on the Dashboard (not duplicated per card)', () => {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <DashboardPage />
        </MemoryRouter>
      );
    });

    const matrixCanvases = container.querySelectorAll('canvas[data-testid="binary-matrix-rain"]');
    expect(matrixCanvases).toHaveLength(1);

    // Verify cards are rendered in grid without internal matrix instances
    const toolCards = container.querySelectorAll('article');
    expect(toolCards.length).toBeGreaterThan(0);
    toolCards.forEach((card) => {
      expect(card.querySelector('canvas')).toBeNull();
    });
  });

  test('3. Matrix background has non-interactive pointer behavior (pointer-events-none, z-0)', () => {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <DashboardPage />
        </MemoryRouter>
      );
    });

    const matrixCanvas = container.querySelector('canvas[data-testid="binary-matrix-rain"]');
    expect(matrixCanvas.className).toContain('pointer-events-none');
    expect(matrixCanvas.className).toContain('z-0');
    expect(matrixCanvas.className).toContain('fixed');
  });

  test('4. Dashboard existing tool grid, search, and category filters remain functional', () => {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <DashboardPage />
        </MemoryRouter>
      );
    });

    // Tool grid exists
    const grid = container.querySelector('main');
    expect(grid).not.toBeNull();
    expect(grid.className).toContain('z-10');

    // Search bar is interactive
    const searchInput = container.querySelector('input[type="text"]');
    expect(searchInput).not.toBeNull();

    // Category pills are rendered
    const categoryButtons = container.querySelectorAll('button');
    expect(categoryButtons.length).toBeGreaterThan(0);
  });

  test('5. Tool card click interactions open ExternalAlternativesModal without Matrix interference', () => {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <DashboardPage />
        </MemoryRouter>
      );
    });

    const toolCards = container.querySelectorAll('article');
    expect(toolCards.length).toBeGreaterThan(0);

    // Click the first card
    act(() => {
      toolCards[0].click();
    });

    // ExternalAlternativesModal opens cleanly
    const modal = container.querySelector('[role="dialog"]');
    expect(modal).not.toBeNull();
  });
});
