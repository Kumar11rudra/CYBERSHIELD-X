import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// 1. Mock API service structure
jest.mock('../services/api', () => {
  const mockFn = () => jest.fn();
  const apiObj = {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  };
  return {
    __esModule: true,
    default: apiObj,
    ...apiObj
  };
});

// 2. Mock AuthContext
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'anil-kumar', role: 'admin' },
    logout: jest.fn()
  })
}));

// 2b. Mock LanguageContext
jest.mock('../context/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'en',
    setLanguage: jest.fn(),
    t: (key) => key
  })
}));

// 3. Mock react-i18next
jest.mock('react-i18next', () => ({
  ...jest.requireActual('react-i18next'),
  useTranslation: () => ({
    t: (key) => key
  })
}));

import SecurityHelpModal from '../components/auth/SecurityHelpModal';
import CyberPassScanner from '../components/auth/CyberPassScanner';
import AdminPage from '../pages/AdminPage';

describe('Cross-Check: SecurityHelpModal & Redesigned AdminPage', () => {
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
      drawImage: () => {}
    });
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    const apiModule = require('../services/api');
    const apiTarget = apiModule.default || apiModule;
    const mockHandler = (url = '') => {
      if (url.includes('/admin/stats')) {
        return Promise.resolve({
          data: {
            totalUsers: 12,
            totalScans: 48,
            activeUsers: 10,
            riskBreakdown: { safe: 30, low: 10, medium: 5, dangerous: 3 },
            recentScans: [
              {
                _id: 'scan-1',
                target: 'https://malicious-test.com',
                threatScore: 88,
                riskLevel: 'dangerous',
                userId: { username: 'testoperator' },
                createdAt: '2026-10-01T12:00:00.000Z'
              }
            ]
          }
        });
      }
      if (url.includes('/admin/users')) {
        return Promise.resolve({
          data: {
            users: [
              {
                _id: 'user-1',
                username: 'anil-kumar',
                email: 'admin@cybershieldx.in',
                role: 'admin',
                isBanned: false,
                totalScans: 15,
                createdAt: '2026-10-01T12:00:00.000Z'
              },
              {
                _id: 'user-2',
                username: 'analyst1',
                email: 'analyst@cybershieldx.in',
                role: 'user',
                isBanned: false,
                totalScans: 8,
                createdAt: '2026-10-01T12:00:00.000Z'
              }
            ]
          }
        });
      }
      if (url.includes('/admin/audit-logs')) {
        return Promise.resolve({
          data: {
            logs: [
              {
                action: 'ADMIN_LOGIN',
                userId: { username: 'anil-kumar' },
                metadata: { ip: '192.168.1.1', details: 'Successful founder login' },
                timestamp: '2026-10-01T12:00:00.000Z'
              }
            ]
          }
        });
      }
      if (url.includes('/admin/firewall')) {
        return Promise.resolve({ data: { rules: ['192.168.1.100'] } });
      }
      if (url.includes('/admin/maintenance')) {
        return Promise.resolve({ data: { enabled: false } });
      }
      return Promise.resolve({ data: {} });
    };

    apiTarget.get.mockImplementation(mockHandler);
    apiTarget.post.mockResolvedValue({ data: { success: true } });
    apiTarget.patch.mockResolvedValue({ data: { success: true } });
    apiTarget.delete.mockResolvedValue({ data: { success: true } });
    if (apiModule.get && apiModule.get !== apiTarget.get) {
      apiModule.get.mockImplementation(mockHandler);
    }
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    container = null;
  });

  test('1. SecurityHelpModal renders all key security sections and responds to close trigger', () => {
    const handleClose = jest.fn();
    act(() => {
      root.render(<SecurityHelpModal isOpen={true} onClose={handleClose} />);
    });

    expect(container.textContent).toContain('SECURITY & AUTHENTICATION MANUAL');
    expect(container.textContent).toContain('Google Authenticator (6-Digit TOTP Code)');
    expect(container.textContent).toContain('CyberPass™ Digital Security Badge');
    expect(container.textContent).toContain('32-Character Secret Passkey');
    expect(container.textContent).toContain('Zero Database Password Vulnerability');

    const closeBtn = Array.from(container.querySelectorAll('button')).find(b =>
      b.textContent.includes('Got It, Close Guide')
    );
    expect(closeBtn).toBeDefined();

    act(() => {
      closeBtn.click();
    });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('2. CyberPassScanner renders the Google Authenticator guide box and triggers SecurityHelpModal', () => {
    const handlePasskey = jest.fn();
    act(() => {
      root.render(<CyberPassScanner onPasskeyDetected={handlePasskey} />);
    });

    const totpTab = Array.from(container.querySelectorAll('button')).find(b =>
      b.textContent.includes('Google Auth')
    );
    expect(totpTab).toBeDefined();

    act(() => {
      totpTab.click();
    });

    expect(container.textContent).toContain('Google Authenticator Guide');
    expect(container.textContent).toContain('Open Google Authenticator app on your phone');

    const helpBtn = Array.from(container.querySelectorAll('button')).find(b =>
      b.textContent.includes('Need Help?')
    );
    expect(helpBtn).toBeDefined();

    act(() => {
      helpBtn.click();
    });

    expect(document.body.textContent).toContain('SECURITY & AUTHENTICATION MANUAL');
  });

  test('3. AdminPage renders Executive Overview with real KPIs and Live Infrastructure Health', async () => {
    await act(async () => {
      root.render(
        <BrowserRouter>
          <AdminPage />
        </BrowserRouter>
      );
    });

    // Wait for loadPlatformData promises to settle
    await act(async () => {
      await Promise.resolve();
      await new Promise(r => setTimeout(r, 80));
    });

    expect(container.textContent).toContain('CYBERSHIELD X');
    expect(container.textContent).toContain('Founder Command Nexus');
    expect(container.textContent).toContain('OPERATOR: anil-kumar');

    // Hero KPI metrics
    expect(container.textContent).toContain('Total Registered Operators');
    expect(container.textContent).toContain('Total Platform Scans');
    expect(container.textContent).toContain('Dangerous Threats');
    expect(container.textContent).toContain('ALL SYSTEMS GO');

    // Live Infrastructure Health
    expect(container.textContent).toContain('Cloudflare Pages Edge');
    expect(container.textContent).toContain('Render API Gateway');
    expect(container.textContent).toContain('MongoDB Atlas Cluster');
    expect(container.textContent).toContain('CyberBot AI Copilot');

    // Recent Scans Table
    expect(container.textContent).toContain('Recent Security Scans');
    expect(container.textContent).toContain('https://malicious-test.com');
  });

  test('4. AdminPage allows switching to Operators & Users tab with operator table and actions', async () => {
    await act(async () => {
      root.render(
        <BrowserRouter>
          <AdminPage />
        </BrowserRouter>
      );
    });

    await act(async () => {
      await Promise.resolve();
      await new Promise(r => setTimeout(r, 80));
    });

    const usersTab = Array.from(container.querySelectorAll('button')).find(b =>
      b.textContent.includes('Operators & Users')
    );
    expect(usersTab).toBeDefined();

    await act(async () => {
      usersTab.click();
      await Promise.resolve();
    });

    expect(container.querySelector('input[placeholder="Search by username or email..."]')).not.toBeNull();
    expect(container.textContent).toContain('anil-kumar');
    expect(container.textContent).toContain('analyst1');
    expect(container.textContent).toContain('Intel Report');
  });

  test('5. AdminPage allows switching to Audit Trail and Security & Access tabs', async () => {
    await act(async () => {
      root.render(
        <BrowserRouter>
          <AdminPage />
        </BrowserRouter>
      );
    });

    await act(async () => {
      await Promise.resolve();
      await new Promise(r => setTimeout(r, 80));
    });

    const auditTab = Array.from(container.querySelectorAll('button')).find(b =>
      b.textContent.includes('Audit Trail')
    );
    expect(auditTab).toBeDefined();

    await act(async () => {
      auditTab.click();
      await Promise.resolve();
      await new Promise(r => setTimeout(r, 80));
    });

    expect(container.textContent).toContain('Platform Security Audit Trail');
    expect(container.textContent).toContain('ADMIN_LOGIN');

    const firewallTab = Array.from(container.querySelectorAll('button')).find(b =>
      b.textContent.includes('Security & Access')
    );
    expect(firewallTab).toBeDefined();

    await act(async () => {
      firewallTab.click();
      await Promise.resolve();
      await new Promise(r => setTimeout(r, 80));
    });

    expect(container.textContent).toContain('IP Firewall & Blocklist Perimeters');
    expect(container.textContent).toContain('Platform Maintenance Mode');
    expect(container.textContent).toContain('Founder Admin Security Credentials');
  });
});
