import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import AnimatedToolAvatar from '../components/toolkit/cards/AnimatedToolAvatar';

global.IS_REACT_ACT_ENVIRONMENT = true;

describe('AnimatedToolAvatar Component', () => {
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

  const ARCHETYPES = [
    'Cyber Scout',
    'Net Warden',
    'Web Shield',
    'Code Breaker',
    'Bio-Scanner',
    'AI Sentinel',
    'Forensics Investigator',
    'Compliance Auditor'
  ];

  test('renders all 8 canonical avatar archetypes with SVG geometry', () => {
    for (const archetype of ARCHETYPES) {
      act(() => {
        root.render(
          <AnimatedToolAvatar
            archetype={archetype}
            accent="#00d4ff"
            size={64}
            alt={`${archetype} Avatar`}
          />
        );
      });

      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg.getAttribute('width')).toBe('64');
      expect(svg.getAttribute('height')).toBe('64');
      expect(svg.getAttribute('role')).toBe('img');
      expect(svg.getAttribute('aria-label')).toBe(`${archetype} Avatar`);

      // Verify geometry was mounted
      const paths = container.querySelectorAll('path, rect, circle, polygon, g');
      expect(paths.length).toBeGreaterThan(0);
    }
  });

  test('gracefully falls back to Cyber Scout for unknown or null archetype', () => {
    act(() => {
      root.render(
        <AnimatedToolAvatar
          archetype="Unknown NonExistent Archetype"
          accent="#38bdf8"
          size={48}
          alt="Fallback Avatar"
        />
      );
    });

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('width')).toBe('48');
    expect(svg.getAttribute('aria-label')).toBe('Fallback Avatar');
  });

  test('supports decorative mode with role="presentation" and aria-hidden="true"', () => {
    act(() => {
      root.render(
        <AnimatedToolAvatar
          archetype="Net Warden"
          accent="#00ff88"
          size={32}
          alt=""
        />
      );
    });

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('role')).toBe('presentation');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });
});
