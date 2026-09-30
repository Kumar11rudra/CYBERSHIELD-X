import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import SecurityCopilot from '../components/chatbot/SecurityCopilot';

// Mock API service
jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn().mockResolvedValue({
      data: {
        content: 'Test reply from CyberBot',
        model: 'Google Gemini 2.5 Flash',
        provider: 'Google AI Studio'
      }
    })
  }
}));

describe('SecurityCopilot — CyberBot Avatar & Visual Identity', () => {
  let container;
  let root;

  beforeAll(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
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

  test('1. Floating action trigger renders CyberBot avatar image (/bot-avatar.png)', () => {
    act(() => {
      root.render(<SecurityCopilot />);
    });

    const button = container.querySelector('button[aria-label="Open Security Copilot"]');
    expect(button).not.toBeNull();

    const avatarImg = button.querySelector('img[alt="CyberBot Copilot"]');
    expect(avatarImg).not.toBeNull();
    expect(avatarImg.getAttribute('src')).toBe('/bot-avatar.png');
  });

  test('2. Opening the copilot reveals header with CyberBot avatar and COPILOT badge', () => {
    act(() => {
      root.render(<SecurityCopilot />);
    });

    const trigger = container.querySelector('button[aria-label="Open Security Copilot"]');
    act(() => {
      trigger.click();
    });

    const headerAvatar = container.querySelector('img[alt="CyberBot"]');
    expect(headerAvatar).not.toBeNull();
    expect(headerAvatar.getAttribute('src')).toBe('/bot-avatar.png');

    expect(container.textContent).toContain('CyberBot');
    expect(container.textContent).toContain('COPILOT');
  });

  test('3. Assistant messages render CyberBot avatar icon and intelligence badge', () => {
    act(() => {
      root.render(<SecurityCopilot />);
    });

    const trigger = container.querySelector('button[aria-label="Open Security Copilot"]');
    act(() => {
      trigger.click();
    });

    expect(container.textContent).toContain('CyberBot Intelligence');
  });
});
