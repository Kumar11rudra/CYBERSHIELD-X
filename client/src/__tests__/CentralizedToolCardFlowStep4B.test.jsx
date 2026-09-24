import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';
import ToolkitPage from '../pages/ToolkitPage';
import ToolGrid from '../components/toolkit/cards/ToolGrid';
import CyberToolCard from '../components/toolkit/cards/CyberToolCard';
import ExternalAlternativesModal from '../components/toolkit/cards/ExternalAlternativesModal';
import { getAllTools } from '../components/toolkit/toolConfig';
import { EXTERNAL_ALTERNATIVES } from '../components/toolkit/cards/externalAlternatives';

// Mock AuthContext for DashboardPage
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'nexus_analyst' },
    token: 'test-session-token'
  })
}));

// Mock useNavigate to verify zero /toolkit/:id or /terminal card routing
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

describe('Centralized Tool Card Flow — Step 4B External-Only Integration', () => {
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

  const mockTool = {
    id: 'dns',
    name: 'DNS Enumerator',
    description: 'Queries DNS primary nameservers, TXT SPF records, and MX mail exchanges.',
    category: 'DNS & Network Intelligence',
    avatarArchetype: 'Net Warden'
  };

  test('1. Dashboard card click opens ExternalAlternativesModal', () => {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <DashboardPage />
        </MemoryRouter>
      );
    });

    // Modal initially closed
    expect(container.querySelector('[role="dialog"]')).toBeNull();

    // Find the first tool card in Dashboard
    const cards = container.querySelectorAll('article');
    expect(cards.length).toBeGreaterThan(0);

    // Click card container
    act(() => {
      cards[0].click();
    });

    // ExternalAlternativesModal is now rendered
    const modal = container.querySelector('[role="dialog"]');
    expect(modal).not.toBeNull();
    expect(container.textContent).toContain('External Alternatives ::');
  });

  test('2. Toolkit card click opens ExternalAlternativesModal', () => {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/toolkit']}>
          <ToolkitPage />
        </MemoryRouter>
      );
    });

    // Modal initially closed
    expect(container.querySelector('[role="dialog"]')).toBeNull();

    // Find the primary button on first card
    const altButtons = container.querySelectorAll('button[aria-label^="View alternatives for "]');
    expect(altButtons.length).toBeGreaterThan(0);

    // Click CTA button
    act(() => {
      altButtons[0].click();
    });

    // ExternalAlternativesModal is now rendered
    const modal = container.querySelector('[role="dialog"]');
    expect(modal).not.toBeNull();
    expect(container.textContent).toContain('External Alternatives ::');
  });

  test('3. correct canonical tool ID reaches ExternalAlternativesModal', () => {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/toolkit']}>
          <ToolkitPage />
        </MemoryRouter>
      );
    });

    // Locate DNS card specifically
    const dnsCard = container.querySelector('button[aria-label="View alternatives for DNS Enumeration Engine"]');
    expect(dnsCard).not.toBeNull();

    act(() => {
      dnsCard.click();
    });

    // Modal should show DNS Enumeration Engine details and its verified provider
    expect(container.textContent).toContain('DNS Enumeration Engine');
    expect(container.textContent).toContain('Reconnaissance');
    expect(container.textContent).toContain('MXToolbox');
  });

  test('4. all 111 tools remain renderable across catalog without errors', () => {
    const allTools = getAllTools();
    expect(allTools.length).toBe(111);

    const handleSelect = jest.fn();

    act(() => {
      root.render(
        <ToolGrid
          tools={allTools}
          onExternalDiscovery={handleSelect}
        />
      );
    });

    const items = container.querySelectorAll('[role="listitem"]');
    expect(items.length).toBe(111);

    // Verify key boundary tools render cleanly
    expect(container.textContent).toContain('DNS Enumeration Engine');
    expect(container.textContent).toContain('AI Remediation Planner');
    expect(container.textContent).toContain('UPI Verifier');
    expect(container.textContent).toContain('SMS Analyzer');
  });

  test('5. no internal /toolkit/:id card navigation is triggered on card interaction', () => {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <DashboardPage />
        </MemoryRouter>
      );
    });

    const altButton = container.querySelector('button[aria-label="View alternatives for DNS Enumeration Engine"]');
    expect(altButton).not.toBeNull();

    act(() => {
      altButton.click();
    });

    // mockNavigate must NOT have been called with /toolkit/dns
    expect(mockNavigate).not.toHaveBeenCalledWith('/toolkit/dns');
    expect(mockNavigate).not.toHaveBeenCalledWith(expect.stringMatching(/\/toolkit\//));
  });

  test('6. no /terminal navigation is triggered on card interaction', () => {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/toolkit']}>
          <ToolkitPage />
        </MemoryRouter>
      );
    });

    const card = container.querySelector('article');
    act(() => {
      card.click();
    });

    expect(mockNavigate).not.toHaveBeenCalledWith('/terminal');
  });

  test('7. no /api/toolkit/execute API is invoked on card interaction', () => {
    const fetchSpy = jest.spyOn(global, 'fetch');

    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/toolkit']}>
          <ToolkitPage />
        </MemoryRouter>
      );
    });

    const card = container.querySelector('article');
    act(() => {
      card.click();
    });

    expect(fetchSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/toolkit/execute'),
      expect.anything()
    );

    fetchSpy.mockRestore();
  });

  test('8. no /api/terminal/execute-native is invoked on card interaction', () => {
    const fetchSpy = jest.spyOn(global, 'fetch');

    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <DashboardPage />
        </MemoryRouter>
      );
    });

    const card = container.querySelector('article');
    act(() => {
      card.click();
    });

    expect(fetchSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/terminal/execute-native'),
      expect.anything()
    );

    fetchSpy.mockRestore();
  });

  test('9. no AI or LLM execution is triggered on card interaction', () => {
    const fetchSpy = jest.spyOn(global, 'fetch');

    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/toolkit']}>
          <ToolkitPage />
        </MemoryRouter>
      );
    });

    const card = container.querySelector('article');
    act(() => {
      card.click();
    });

    expect(fetchSpy).not.toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/(ai|copilot|gemini|llm)/),
      expect.anything()
    );

    fetchSpy.mockRestore();
  });

  test('10. HIGH/CRITICAL warning gate remains functional and enforces acknowledgment', () => {
    // Sqlmap is HIGH privacy risk
    const sqlmapTool = {
      id: 'sqlmap',
      name: 'SQLMap Scanner',
      category: 'Vulnerability Assessment'
    };

    act(() => {
      root.render(
        <ExternalAlternativesModal
          tool={sqlmapTool}
          isOpen={true}
          onClose={jest.fn()}
        />
      );
    });

    expect(container.textContent).toContain('Privacy & Data Security Notice');

    const outboundLink = container.querySelector('a[target="_blank"]');
    expect(outboundLink).not.toBeNull();
    // Before acknowledgment, href must be omitted or navigation prevented
    expect(outboundLink.getAttribute('aria-disabled')).toBe('true');

    // Find checkbox and acknowledge
    const checkbox = container.querySelector('input[type="checkbox"]');
    expect(checkbox).not.toBeNull();
    expect(checkbox.checked).toBe(false);

    act(() => {
      checkbox.click();
    });

    expect(checkbox.checked).toBe(true);
    expect(outboundLink.getAttribute('aria-disabled')).toBe('false');
    expect(outboundLink.getAttribute('href')).toBe('https://sqlmap.org/');
  });

  test('11. external link attributes strictly enforce target="_blank" and rel="noopener noreferrer"', () => {
    act(() => {
      root.render(
        <ExternalAlternativesModal
          tool={mockTool}
          isOpen={true}
          onClose={jest.fn()}
        />
      );
    });

    const links = container.querySelectorAll('a');
    expect(links.length).toBeGreaterThan(0);

    links.forEach((link) => {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    });
  });

  test('12. zero target, credential, or token forwarding into external URLs', () => {
    act(() => {
      root.render(
        <ExternalAlternativesModal
          tool={mockTool}
          isOpen={true}
          onClose={jest.fn()}
        />
      );
    });

    const links = container.querySelectorAll('a');
    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (href) {
        expect(href).not.toContain('target=');
        expect(href).not.toContain('token=');
        expect(href).not.toContain('secret=');
        expect(href).not.toContain('session=');
        expect(href).not.toContain('Bearer');
      }
    });
  });

  test('13. ToolGrid consistently forwards onExternalDiscovery to child CyberToolCard', () => {
    const handleSelect = jest.fn();

    act(() => {
      root.render(
        <ToolGrid
          tools={[mockTool]}
          onExternalDiscovery={handleSelect}
        />
      );
    });

    const card = container.querySelector('article');
    act(() => {
      card.click();
    });

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'dns' }));

    const btn = container.querySelector('button[aria-label^="View alternatives for "]');
    act(() => {
      btn.click();
    });

    expect(handleSelect).toHaveBeenCalledTimes(2);
  });

  test('14. keyboard card activation (Enter & Space) opens external discovery', () => {
    const handleSelect = jest.fn();

    act(() => {
      root.render(
        <CyberToolCard
          tool={mockTool}
          onAlternatives={handleSelect}
        />
      );
    });

    const article = container.querySelector('article');

    // Press Enter
    act(() => {
      article.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
    expect(handleSelect).toHaveBeenCalledTimes(1);

    // Press Space
    act(() => {
      article.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    });
    expect(handleSelect).toHaveBeenCalledTimes(2);
  });

  test('15. ExternalAlternativesModal dismisses and closes cleanly', () => {
    const handleClose = jest.fn();

    act(() => {
      root.render(
        <ExternalAlternativesModal
          tool={mockTool}
          isOpen={true}
          onClose={handleClose}
        />
      );
    });

    const closeBtn = container.querySelector('button[aria-label="Close modal"]');
    expect(closeBtn).not.toBeNull();

    act(() => {
      closeBtn.click();
    });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('16. responsive grid layout renders appropriate list and grid classes', () => {
    act(() => {
      root.render(
        <ToolGrid
          tools={[mockTool]}
          onExternalDiscovery={jest.fn()}
        />
      );
    });

    const grid = container.querySelector('[role="list"]');
    expect(grid).not.toBeNull();
    expect(grid.className).toContain('grid');
    expect(grid.className).toContain('grid-cols-1');
    expect(grid.className).toContain('sm:grid-cols-2');
  });

  test('17. ToolGrid strictly ignores arbitrary onOpen callback to prevent internal execution fallback (P1-4B-01)', () => {
    const internalExecutionSpy = jest.fn();

    act(() => {
      root.render(
        <ToolGrid
          tools={[mockTool]}
          onOpen={internalExecutionSpy}
        />
      );
    });

    const card = container.querySelector('article');
    const btn = container.querySelector('button[aria-label^="View alternatives for "]');

    // Click card container
    act(() => {
      card.click();
    });
    expect(internalExecutionSpy).not.toHaveBeenCalled();

    // Click primary button
    act(() => {
      btn.click();
    });
    expect(internalExecutionSpy).not.toHaveBeenCalled();
  });

  test('18. ToolGrid strictly ignores legacy onAlternatives and has zero fallback expressions', () => {
    const legacyAlternativesSpy = jest.fn();

    act(() => {
      root.render(
        <ToolGrid
          tools={[mockTool]}
          onAlternatives={legacyAlternativesSpy}
        />
      );
    });

    const card = container.querySelector('article');
    const btn = container.querySelector('button[aria-label^="View alternatives for "]');

    // Click card container
    act(() => {
      card.click();
    });
    expect(legacyAlternativesSpy).not.toHaveBeenCalled();

    // Click primary button
    act(() => {
      btn.click();
    });
    expect(legacyAlternativesSpy).not.toHaveBeenCalled();
  });
});
