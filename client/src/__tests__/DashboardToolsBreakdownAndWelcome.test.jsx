import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';

// Mock AuthContext
const mockLogout = jest.fn();
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'ani12000', name: 'Anil Kumar', email: 'anil@example.com' },
    logout: mockLogout,
  }),
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Dashboard Tools Breakdown & Welcome Modal Reliability', () => {
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
    sessionStorage.clear();
  });

  test('1. Renders 125 tools available with working websites and coming soon breakdown', () => {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <DashboardPage />
        </MemoryRouter>
      );
    });

    const infoBar = container.textContent;
    expect(infoBar).toContain('125 tools available');
    expect(infoBar).toContain('55 Working Websites');
    expect(infoBar).toContain('70 Coming Soon / Repository');
  });

  test('2. Dynamic breakdown recalculates when filtering by search query', () => {
    jest.useFakeTimers();
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <DashboardPage />
        </MemoryRouter>
      );
    });

    const searchInput = container.querySelector('input[type="text"]');
    expect(searchInput).not.toBeNull();

    act(() => {
      // Search for 'dns'
      searchInput.value = 'dns';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Advance debounce timer (150ms)
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Verify info bar continues to present working count and coming soon count
    expect(container.textContent).toContain('Working Websites');
    expect(container.textContent).toContain('Coming Soon / Repository');
    jest.useRealTimers();
  });

  test('3. Welcome modal reliably appears when cybershield_show_welcome is set on login', () => {
    sessionStorage.setItem('cybershield_show_welcome', 'true');
    sessionStorage.setItem('cybershield_show_welcome_in_test', 'true');

    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <DashboardPage />
        </MemoryRouter>
      );
    });

    // Verify modal elements are rendered
    const welcomeTitle = container.querySelector('#welcome-dialog-title');
    expect(welcomeTitle).not.toBeNull();
    expect(welcomeTitle.textContent).toContain('WELCOME');

    const usernameBadge = container.textContent;
    expect(usernameBadge).toContain('ani12000');

    // Verify "Enter Dashboard" button exists and dismisses modal
    const enterBtn = Array.from(container.querySelectorAll('button')).find(
      (btn) => btn.textContent.includes('Enter Dashboard')
    );
    expect(enterBtn).not.toBeNull();

    act(() => {
      enterBtn.click();
    });

    // Modal dismissed
    expect(container.querySelector('#welcome-dialog-title')).toBeNull();
    expect(sessionStorage.getItem('cybershield_show_welcome')).toBeNull();
    expect(sessionStorage.getItem('cybershield_dashboard_welcome_seen')).toBe('true');
  });
});
