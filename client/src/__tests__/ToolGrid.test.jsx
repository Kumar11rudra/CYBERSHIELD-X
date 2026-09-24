import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import ToolGrid from '../components/toolkit/cards/ToolGrid';

global.IS_REACT_ACT_ENVIRONMENT = true;

describe('ToolGrid Component', () => {
  let container;
  let root;

  beforeEach(() => {
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

  const mockTools = [
    {
      id: 'dns',
      name: 'DNS Enumerator',
      category: 'DNS & Network Intelligence',
      description: 'DNS zone and record enumeration.',
      executionTarget: 'Native'
    },
    {
      id: 'whois',
      name: 'WHOIS Lookup',
      category: 'Reconnaissance',
      description: 'Query domain registration and registrar records.',
      executionTarget: 'Native'
    },
    {
      id: 'sqlmap',
      name: 'SQLMap Scanner',
      category: 'Vulnerability Assessment',
      description: 'Automated SQL injection vulnerability detection.',
      executionTarget: 'CLI'
    }
  ];

  test('renders tool cards for provided tools array with accessible roles', () => {
    const handleDiscovery = jest.fn();

    act(() => {
      root.render(
        <ToolGrid
          tools={mockTools}
          onExternalDiscovery={handleDiscovery}
        />
      );
    });

    const grid = container.querySelector('[role="list"]');
    expect(grid).not.toBeNull();

    const items = container.querySelectorAll('[role="listitem"]');
    expect(items.length).toBe(3);

    expect(container.textContent).toContain('DNS Enumerator');
    expect(container.textContent).toContain('WHOIS Lookup');
    expect(container.textContent).toContain('SQLMap Scanner');
  });

  test('renders neutral empty state when tool array is empty or filtered to zero', () => {
    act(() => {
      root.render(
        <ToolGrid
          tools={[]}
          emptyMessage="No tools match the selected category."
        />
      );
    });

    expect(container.querySelector('[role="list"]')).toBeNull();
    expect(container.textContent).toContain('No tools match the selected category.');
  });

  test('defensively ignores null or non-object entries in tools array', () => {
    const dirtyTools = [
      null,
      mockTools[0],
      undefined,
      'invalid-string',
      mockTools[1]
    ];

    act(() => {
      root.render(
        <ToolGrid
          tools={dirtyTools}
        />
      );
    });

    const items = container.querySelectorAll('[role="listitem"]');
    expect(items.length).toBe(2);
    expect(container.textContent).toContain('DNS Enumerator');
    expect(container.textContent).toContain('WHOIS Lookup');
    expect(container.textContent).not.toContain('invalid-string');
  });

  test('propagates action callbacks from child tool cards directly to onExternalDiscovery', () => {
    const handleDiscovery = jest.fn();

    act(() => {
      root.render(
        <ToolGrid
          tools={mockTools}
          onExternalDiscovery={handleDiscovery}
        />
      );
    });

    // Competing Open buttons must be absent
    const openButtons = container.querySelectorAll('button[aria-label^="Open "]');
    expect(openButtons.length).toBe(0);

    // View alternatives buttons must be present for all tools
    const altButtons = container.querySelectorAll('button[aria-label^="View alternatives for "]');
    expect(altButtons.length).toBe(3);

    // Clicking button invokes external discovery
    act(() => {
      altButtons[1].click();
    });

    expect(handleDiscovery).toHaveBeenCalledTimes(1);
    expect(handleDiscovery).toHaveBeenCalledWith(mockTools[1]);

    // Clicking card container invokes external discovery
    const articles = container.querySelectorAll('article');
    expect(articles.length).toBe(3);

    act(() => {
      articles[0].click();
    });

    expect(handleDiscovery).toHaveBeenCalledTimes(2);
    expect(handleDiscovery).toHaveBeenCalledWith(mockTools[0]);
  });

  test('strictly rejects and ignores arbitrary onOpen callback to eliminate internal execution paths (P1-4B-01)', () => {
    const arbitraryInternalExecutionHandler = jest.fn();

    act(() => {
      root.render(
        <ToolGrid
          tools={mockTools}
          onOpen={arbitraryInternalExecutionHandler}
        />
      );
    });

    const altButtons = container.querySelectorAll('button[aria-label^="View alternatives for "]');
    expect(altButtons.length).toBe(3);

    act(() => {
      altButtons[0].click();
    });

    // onOpen must NOT have been called
    expect(arbitraryInternalExecutionHandler).not.toHaveBeenCalled();

    const articles = container.querySelectorAll('article');
    act(() => {
      articles[0].click();
    });

    expect(arbitraryInternalExecutionHandler).not.toHaveBeenCalled();
  });

  test('strictly ignores onAlternatives prop and enforces zero fallback to onAlternatives', () => {
    const legacyAlternativesSpy = jest.fn();

    act(() => {
      root.render(
        <ToolGrid
          tools={mockTools}
          onAlternatives={legacyAlternativesSpy}
        />
      );
    });

    const altButtons = container.querySelectorAll('button[aria-label^="View alternatives for "]');
    act(() => {
      altButtons[0].click();
    });

    // onAlternatives is NOT part of ToolGrid contract and must NOT be called
    expect(legacyAlternativesSpy).not.toHaveBeenCalled();

    const articles = container.querySelectorAll('article');
    act(() => {
      articles[0].click();
    });

    expect(legacyAlternativesSpy).not.toHaveBeenCalled();
  });
});
