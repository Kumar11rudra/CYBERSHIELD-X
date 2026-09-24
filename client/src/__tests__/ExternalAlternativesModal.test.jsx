import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import ExternalAlternativesModal from '../components/toolkit/cards/ExternalAlternativesModal';

global.IS_REACT_ACT_ENVIRONMENT = true;

describe('ExternalAlternativesModal Component', () => {
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

  const lowRiskTool = {
    id: 'dns',
    name: 'DNS Enumerator',
    category: 'DNS & Network Intelligence'
  };

  const highRiskTool = {
    id: 'semgrep',
    name: 'Semgrep SAST',
    category: 'DevSecOps / Supply Chain Security'
  };

  const nativeOnlyTool = {
    id: 'remediation',
    name: 'Remediation Playbook',
    category: 'Incident Response'
  };

  test('renders verified alternatives for standard tool with direct navigation', () => {
    const handleClose = jest.fn();

    act(() => {
      root.render(
        <ExternalAlternativesModal
          tool={lowRiskTool}
          isOpen={true}
          onClose={handleClose}
        />
      );
    });

    expect(container.textContent).toContain('DNS Enumerator');
    expect(container.textContent).toContain('Verified Industry Alternative Providers');

    // Find launch links
    const launchLinks = container.querySelectorAll('a[target="_blank"]');
    expect(launchLinks.length).toBeGreaterThan(0);

    const firstLink = launchLinks[0];
    expect(firstLink.getAttribute('rel')).toBe('noopener noreferrer');
    expect(firstLink.getAttribute('href')).toMatch(/^https:\/\//);
    // Verify no session, token, or target parameter in URL
    expect(firstLink.getAttribute('href')).not.toContain('target=');
    expect(firstLink.getAttribute('href')).not.toContain('token=');
    expect(firstLink.getAttribute('href')).not.toContain('auth=');
  });

  test('enforces warning gate for HIGH/CRITICAL privacy risk tools before enabling navigation', () => {
    act(() => {
      root.render(
        <ExternalAlternativesModal
          tool={highRiskTool}
          isOpen={true}
          onClose={jest.fn()}
        />
      );
    });

    // Checkbox should be present for HIGH risk notice
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBeGreaterThan(0);

    // Initial state: link should be disabled (aria-disabled="true", no href)
    const initialLink = container.querySelector('a[aria-disabled="true"]');
    expect(initialLink).not.toBeNull();
    expect(initialLink.getAttribute('href')).toBeNull();

    // Operator checks the acknowledgment gate
    act(() => {
      checkboxes[0].click();
    });

    // Post-acknowledgment: link should be enabled with valid officialUrl
    const enabledLink = container.querySelectorAll('a[target="_blank"]')[0];
    expect(enabledLink.getAttribute('aria-disabled')).toBe('false');
    expect(enabledLink.getAttribute('href')).toMatch(/^https:\/\//);
  });

  test('renders native-only informational fallback for tools without public external alternative', () => {
    const handleNative = jest.fn();
    const handleClose = jest.fn();

    act(() => {
      root.render(
        <ExternalAlternativesModal
          tool={nativeOnlyTool}
          isOpen={true}
          onClose={handleClose}
          onOpenNativeTool={handleNative}
        />
      );
    });

    expect(container.textContent).toContain('Proprietary CyberShield X Architecture');
    expect(container.textContent).toContain('Deploy Native Remediation Playbook');

    const deployButton = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent.includes('Deploy Native')
    );
    expect(deployButton).toBeDefined();

    act(() => {
      deployButton.click();
    });

    expect(handleNative).toHaveBeenCalledWith(nativeOnlyTool);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('closes modal when Escape key is pressed or close button is clicked', () => {
    const handleClose = jest.fn();

    act(() => {
      root.render(
        <ExternalAlternativesModal
          tool={lowRiskTool}
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

    // Test Escape key
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
