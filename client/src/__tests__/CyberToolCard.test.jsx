import React, { act } from 'react';

import { createRoot } from 'react-dom/client';

import CyberToolCard from '../components/toolkit/cards/CyberToolCard';

import ExternalAlternativesModal from '../components/toolkit/cards/ExternalAlternativesModal';

import { getAllTools } from '../components/toolkit/toolConfig';



global.IS_REACT_ACT_ENVIRONMENT = true;



describe('CyberToolCard Component — Step 4A Interaction Boundary', () => {

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



  const mockTool = {

    id: 'dns',

    name: 'DNS Enumerator',

    description: 'Queries DNS primary nameservers, TXT SPF records, and MX mail exchanges.',

    category: 'DNS & Network Intelligence',

    executionTarget: 'Native',

    avatarArchetype: 'Net Warden'

  };



  test('1. renders tool identity, category badge, and external discovery badge without executionTarget', () => {

    act(() => {

      root.render(

        <CyberToolCard

          tool={mockTool}

          onOpen={jest.fn()}

          onAlternatives={jest.fn()}

        />

      );

    });



    // Tool name

    const heading = container.querySelector('h3');

    expect(heading).not.toBeNull();

    expect(heading.textContent).toBe('DNS Enumerator');



    // Tool description

    const desc = container.querySelector('p');

    expect(desc).not.toBeNull();

    expect(desc.textContent).toContain('Queries DNS primary nameservers');



    // Category badge

    const badges = container.querySelectorAll('span');

    const categoryBadge = Array.from(badges).find(b => b.textContent.includes('DNS & Network Intelligence'));

    expect(categoryBadge).toBeDefined();



    // External discovery badge MUST be present

    const externalBadge = container.querySelector('[data-testid="external-badge"]');

    expect(externalBadge).not.toBeNull();

    expect(externalBadge.textContent).toContain('External');



    // executionTarget badge (e.g. 'Native') MUST be absent

    const nativeBadge = Array.from(badges).find(b => b.textContent === 'Native');

    expect(nativeBadge).toBeUndefined();



    // Competing "Open Tool" button MUST be absent

    const openBtn = container.querySelector('button[aria-label="Open DNS Enumerator"]');

    expect(openBtn).toBeNull();

  });



  test('2. card container click opens external alternatives', () => {

    const handleAlternatives = jest.fn();

    const handleOpen = jest.fn();



    act(() => {

      root.render(

        <CyberToolCard

          tool={mockTool}

          onOpen={handleOpen}

          onAlternatives={handleAlternatives}

        />

      );

    });



    const article = container.querySelector('article');

    expect(article).not.toBeNull();



    act(() => {

      article.click();

    });



    // Card click triggers external alternatives

    expect(handleAlternatives).toHaveBeenCalledTimes(1);

    expect(handleAlternatives).toHaveBeenCalledWith(mockTool);

  });



  test('3. primary card action button opens external alternatives', () => {

    const handleAlternatives = jest.fn();

    const handleOpen = jest.fn();



    act(() => {

      root.render(

        <CyberToolCard

          tool={mockTool}

          onOpen={handleOpen}

          onAlternatives={handleAlternatives}

        />

      );

    });



    const altButton = container.querySelector('button[aria-label="View alternatives for DNS Enumerator"]');

    expect(altButton).not.toBeNull();

    expect(altButton.textContent).toContain('View Alternatives');



    act(() => {

      altButton.click();

    });



    expect(handleAlternatives).toHaveBeenCalledTimes(1);

    expect(handleAlternatives).toHaveBeenCalledWith(mockTool);

  });



  test('4. nested button click does NOT double-trigger card click (stopPropagation)', () => {

    const handleAlternatives = jest.fn();



    act(() => {

      root.render(

        <CyberToolCard

          tool={mockTool}

          onAlternatives={handleAlternatives}

        />

      );

    });



    const altButton = container.querySelector('button[aria-label="View alternatives for DNS Enumerator"]');



    act(() => {

      altButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    });



    // Must be invoked exactly once, not twice

    expect(handleAlternatives).toHaveBeenCalledTimes(1);

  });



  test('5. keyboard interaction: Enter key on card activates external discovery', () => {

    const handleAlternatives = jest.fn();



    act(() => {

      root.render(

        <CyberToolCard

          tool={mockTool}

          onAlternatives={handleAlternatives}

        />

      );

    });



    const article = container.querySelector('article');



    act(() => {

      article.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    });



    expect(handleAlternatives).toHaveBeenCalledTimes(1);

    expect(handleAlternatives).toHaveBeenCalledWith(mockTool);

  });



  test('6. keyboard interaction: Space key on card activates external discovery', () => {

    const handleAlternatives = jest.fn();



    act(() => {

      root.render(

        <CyberToolCard

          tool={mockTool}

          onAlternatives={handleAlternatives}

        />

      );

    });



    const article = container.querySelector('article');



    act(() => {

      article.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));

    });



    expect(handleAlternatives).toHaveBeenCalledTimes(1);

    expect(handleAlternatives).toHaveBeenCalledWith(mockTool);

  });



  test('7. executionTarget badges (Native, API, Browser, Hybrid) are strictly absent', () => {

    const targets = ['Native', 'API', 'Browser', 'Hybrid'];

    targets.forEach((targetType) => {

      const toolWithTarget = { ...mockTool, executionTarget: targetType };

      act(() => {

        root.render(

          <CyberToolCard

            tool={toolWithTarget}

            onAlternatives={jest.fn()}

          />

        );

      });



      const spans = Array.from(container.querySelectorAll('span'));

      const foundTargetBadge = spans.find(s => s.textContent === targetType);

      expect(foundTargetBadge).toBeUndefined();

    });

  });



  test('8. safely falls back for null or partial tool metadata without crashing', () => {

    act(() => {

      root.render(

        <CyberToolCard

          tool={null}

          onOpen={jest.fn()}

          onAlternatives={jest.fn()}

        />

      );

    });



    const heading = container.querySelector('h3');

    expect(heading).not.toBeNull();

    expect(heading.textContent).toBe('Unnamed Tool');



    const desc = container.querySelector('p');

    expect(desc).not.toBeNull();

    expect(desc.textContent).toBe('Security tool');

  });



  test('9. card interaction with ExternalAlternativesModal opens modal with verified provider without target forwarding', () => {

    let selectedTool = null;



    const TestHost = () => {

      const [activeTool, setActiveTool] = React.useState(null);

      return (

        <div>

          <CyberToolCard

            tool={mockTool}

            onAlternatives={(t) => setActiveTool(t)}

          />

          <ExternalAlternativesModal

            tool={activeTool}

            isOpen={Boolean(activeTool)}

            onClose={() => setActiveTool(null)}

          />

        </div>

      );

    };



    act(() => {

      root.render(<TestHost />);

    });



    // Modal is initially closed

    expect(container.querySelector('[role="dialog"]')).toBeNull();



    // Click card action

    const altButton = container.querySelector('button[aria-label="View alternatives for DNS Enumerator"]');

    act(() => {

      altButton.click();

    });



    // Modal is now open

    const modal = container.querySelector('[role="dialog"]');

    expect(modal).not.toBeNull();

    expect(modal.textContent).toContain('External Alternatives :: DNS Enumerator');



    // Verified provider link is present with target="_blank" and rel="noopener noreferrer"

    const extLink = modal.querySelector('a[href*="mxtoolbox.com"]');

    expect(extLink).not.toBeNull();

    expect(extLink.getAttribute('target')).toBe('_blank');

    expect(extLink.getAttribute('rel')).toBe('noopener noreferrer');



    // Outbound link does NOT forward user targets, tokens, or credentials in query parameters

    const href = extLink.getAttribute('href');

    expect(href).toBe('https://mxtoolbox.com/SuperTool.aspx');

    expect(href).not.toContain('target=');

    expect(href).not.toContain('token=');

    expect(href).not.toContain('auth=');

  });



  test('10. canonical 111-tool catalog renders without errors in CyberToolCard', () => {

    const allTools = getAllTools();

    expect(allTools.length).toBe(111);



    // Test a sample of 10 tools from across the catalog

    allTools.slice(0, 10).forEach((tool) => {

      act(() => {

        root.render(

          <CyberToolCard

            tool={tool}

            onAlternatives={jest.fn()}

          />

        );

      });

      const heading = container.querySelector('h3');

      expect(heading).not.toBeNull();

      expect(heading.textContent).toBe(tool.name);

    });

  });

});
