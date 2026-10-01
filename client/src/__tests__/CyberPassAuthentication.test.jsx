import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import CyberPassScanner from '../components/auth/CyberPassScanner';
import CyberBadgeModal from '../components/auth/CyberBadgeModal';

describe('CyberPass™ Authentication UI Components', () => {
  let container;
  let root;

  beforeAll(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    HTMLCanvasElement.prototype.getContext = () => ({
      fillRect: () => {},
      clearRect: () => {},
      getImageData: () => ({ data: new Uint8ClampedArray(400) }),
      putImageData: () => {},
      createImageData: () => ({ data: [] }),
      drawImage: () => {},
    });
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    container = null;
  });

  test('1. CyberPassScanner renders Mode Switcher tabs correctly', () => {
    const handlePasskey = jest.fn();
    act(() => {
      root.render(<CyberPassScanner onPasskeyDetected={handlePasskey} />);
    });

    expect(container.textContent).toContain('Upload Badge');
    expect(container.textContent).toContain('Live Scan');
    expect(container.textContent).toContain('Passkey');
  });

  test('2. CyberPassScanner allows switching to Manual Passkey tab and entering code', () => {
    const handlePasskey = jest.fn();
    act(() => {
      root.render(<CyberPassScanner onPasskeyDetected={handlePasskey} />);
    });

    // Find and click Passkey tab button
    const buttons = Array.from(container.querySelectorAll('button'));
    const passkeyTab = buttons.find(b => b.textContent.includes('Passkey'));
    expect(passkeyTab).toBeDefined();

    act(() => {
      passkeyTab.click();
    });

    const input = container.querySelector('input[placeholder*="CSX-FOUNDER-MASTER-PASSKEY"]');
    expect(input).not.toBeNull();

    act(() => {
      // Simulate typing in input
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      ).set;
      nativeInputValueSetter.call(input, 'CSX-TEST-PASSKEY-12345');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const submitBtn = Array.from(container.querySelectorAll('button')).find(b =>
      b.textContent.includes('Verify & Authenticate')
    );
    expect(submitBtn).toBeDefined();

    act(() => {
      submitBtn.click();
    });

    expect(handlePasskey).toHaveBeenCalledWith('CSX-TEST-PASSKEY-12345');
  });

  test('3. CyberBadgeModal renders badge details and action buttons', () => {
    const mockBadge = {
      name: 'Anil Kumar',
      role: 'admin',
      clearance: 'FOUNDER & LEAD',
      backupCode: 'CSX-FOUNDER-BACKUP-9999',
      qrDataUrl: 'data:image/png;base64,mockqrdata'
    };

    const handleClose = jest.fn();
    const handleProceed = jest.fn();

    act(() => {
      root.render(
        <CyberBadgeModal
          badge={mockBadge}
          onClose={handleClose}
          onProceed={handleProceed}
        />
      );
    });

    expect(container.textContent).toContain('YOUR SECURITY BADGE');
    expect(container.textContent).toContain('Anil Kumar');
    expect(container.textContent).toContain('FOUNDER & LEAD');
    expect(container.textContent).toContain('CSX-FOUNDER-BACKUP-9999');
    expect(container.textContent).toContain('Save Badge (.PNG)');
    expect(container.textContent).toContain('Continue →');
  });
});
