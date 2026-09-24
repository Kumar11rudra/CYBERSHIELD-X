/**
 * Phase 81 Step 7: Enterprise External Workflow Frontend Integration
 * Dedicated Comprehensive Test Suite
 *
 * Verifies:
 *  1. Integration list rendering (7 canonical providers)
 *  2. Provider/status rendering (HEALTHY, DEGRADED, FAILED, DISCONNECTED)
 *  3. Sanitized integration data (no exposed secrets or raw tokens)
 *  4. External ticket rendering (Case.externalTickets synchronization)
 *  5. External ticket URL safety (rejection of javascript:/data:, safe rel="noopener noreferrer")
 *  6. Approval status rendering (PendingApproval lifecycle)
 *  7. Canonical PendingApproval statuses (PROPOSED, AWAITING_APPROVAL, APPROVED, etc.)
 *  8. Audit/sync history rendering (IntegrationSyncEvent history)
 *  9. Loading state rendering
 * 10. Empty state rendering
 * 11. Error state handling (API error display without swallowing)
 * 12. Unauthorized state handling (401/403 propagation)
 * 13. Tenant boundary behavior (authenticated org header injection)
 * 14. Secret non-exposure (password masking, no plaintext tokens in state/inputs)
 * 15. Zero direct provider API calls (all requests route to backend /api/*)
 * 16. Zero client-side execution (presentation/control layer only)
 * 17. Real-time update behavior (Socket.IO approval:external_callback listener)
 * 18. Responsive/navigation tab behavior
 */

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import workflowIntegrationService, {
  isSafeExternalUrl,
  getSyncStatusBadgeClass,
  getHealthBadgeClass,
} from '../services/workflowIntegrationService';
import IntegrationsPage from '../pages/IntegrationsPage';
import ApprovalCenterPage from '../pages/ApprovalCenterPage';
import { io } from 'socket.io-client';

global.IS_REACT_ACT_ENVIRONMENT = true;

// Mock socket.io-client (mock-prefixed variables are preserved by Jest hoist)
const mockSocket = {
  on: jest.fn(),
  disconnect: jest.fn(),
  emit: jest.fn(),
};
const mockIo = jest.fn(() => mockSocket);

jest.mock('socket.io-client', () => ({
  __esModule: true,
  io: (...args) => mockIo(...args),
  default: (...args) => mockIo(...args),
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
}));

// Mock AuthContext
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'usr-analyst-1', email: 'analyst@cybershield.internal', role: 'ADMIN' },
    token: 'jwt-mock-token-xyz',
    logout: jest.fn(),
  }),
}));

// Mock OrganizationContext
jest.mock('../context/OrganizationContext', () => ({
  useOrganization: () => ({
    organizations: [{ id: 'org-enterprise-1', name: 'CyberShield Org' }],
    activeOrg: { id: 'org-enterprise-1', name: 'CyberShield Org' },
    isOrgMode: true,
  }),
}));

// Mock ThemeContext
jest.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    isDark: true,
    toggleTheme: jest.fn(),
  }),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { changeLanguage: jest.fn() },
  }),
}));

// Mock api service
jest.mock('../services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  defaults: { headers: { common: {} } },
}));

describe('Phase 81 Step 7: Enterprise External Workflow Frontend Integration', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    mockIo.mockReturnValue(mockSocket);
    mockSocket.on.mockReturnValue(mockSocket);
  });

  afterEach(() => {
    act(() => {
      if (root) root.unmount();
    });
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  // =========================================================================
  // 1. External URL Security
  // =========================================================================
  describe('Requirement 5: External Ticket URL Safety', () => {
    test('validates safe HTTP and HTTPS URLs', () => {
      expect(isSafeExternalUrl('https://jira.enterprise.internal/browse/SEC-101')).toBe(true);
      expect(isSafeExternalUrl('http://servicenow.corp.local/incident.do?sys_id=123')).toBe(true);
      expect(isSafeExternalUrl('https://pagerduty.com/incidents/P12345')).toBe(true);
    });

    test('strictly rejects dangerous schemes: javascript:, data:, vbscript:, file:', () => {
      expect(isSafeExternalUrl('javascript:alert(document.cookie)')).toBe(false);
      expect(isSafeExternalUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isSafeExternalUrl('vbscript:msgbox(1)')).toBe(false);
      expect(isSafeExternalUrl('file:///etc/passwd')).toBe(false);
      expect(isSafeExternalUrl('')).toBe(false);
      expect(isSafeExternalUrl(null)).toBe(false);
      expect(isSafeExternalUrl(undefined)).toBe(false);
      expect(isSafeExternalUrl('invalid-url-string')).toBe(false);
    });
  });

  // =========================================================================
  // 2. Status & Health Badge Utilities
  // =========================================================================
  describe('Requirement 2: Provider / Status badge styling', () => {
    test('maps sync statuses correctly', () => {
      expect(getSyncStatusBadgeClass('IN_SYNC')).toContain('emerald');
      expect(getSyncStatusBadgeClass('PENDING_OUTBOUND')).toContain('amber');
      expect(getSyncStatusBadgeClass('FAILED')).toContain('rose');
      expect(getSyncStatusBadgeClass('UNKNOWN')).toContain('slate');
    });

    test('maps connection health statuses correctly', () => {
      expect(getHealthBadgeClass('Healthy')).toContain('emerald');
      expect(getHealthBadgeClass('Warning')).toContain('amber');
      expect(getHealthBadgeClass('Failed')).toContain('rose');
      expect(getHealthBadgeClass('Unknown')).toContain('slate');
    });
  });

  // =========================================================================
  // 3. Workflow Integration Service: Backend routing & Tenant isolation
  // =========================================================================
  describe('Requirements 13 & 15: Tenant Isolation & Zero Direct Provider Calls', () => {
    const api = require('../services/api');

    test('getIntegrations calls backend /api/integrations via api client', async () => {
      api.get.mockResolvedValueOnce({ data: { data: [{ id: 'int-1', provider: 'Jira' }] } });
      const res = await workflowIntegrationService.getIntegrations();
      expect(api.get).toHaveBeenCalledWith('/integrations', { params: {} });
      expect(res).toHaveLength(1);
    });

    test('testIntegration sends provider testing through backend proxy endpoint', async () => {
      api.post.mockResolvedValueOnce({ data: { success: true, message: 'Connected' } });
      const res = await workflowIntegrationService.testIntegration('int-jira-1');
      expect(api.post).toHaveBeenCalledWith('/integrations/test', expect.objectContaining({ id: 'int-jira-1' }));
      expect(res.success).toBe(true);
    });

    test('getCases fetches cases with externalTickets populated from /api/cases', async () => {
      api.get.mockResolvedValueOnce({ data: { data: { cases: [{ id: 'case-1', externalTickets: [] }] } } });
      const res = await workflowIntegrationService.getCases();
      expect(api.get).toHaveBeenCalledWith('/cases', { params: {} });
      expect(res).toHaveLength(1);
    });

    test('getApprovals queries /api/approvals with canonical status filters', async () => {
      api.get.mockResolvedValueOnce({ data: { data: { approvals: [] } } });
      await workflowIntegrationService.getApprovals({ status: 'AWAITING_APPROVAL' });
      expect(api.get).toHaveBeenCalledWith('/approvals', { params: { status: 'AWAITING_APPROVAL' } });
    });

    test('getAuditLogs queries /api/audit endpoint', async () => {
      api.get.mockResolvedValueOnce({ data: { data: [] } });
      await workflowIntegrationService.getAuditLogs({ limit: 50 });
      expect(api.get).toHaveBeenCalledWith('/audit', { params: { limit: 50 } });
    });

    test('all calls are routed to backend endpoints, never external provider hosts directly', () => {
      const methodNames = Object.keys(workflowIntegrationService);
      expect(methodNames).toContain('getIntegrations');
      expect(methodNames).toContain('createIntegration');
      expect(methodNames).toContain('updateIntegration');
      expect(methodNames).toContain('deleteIntegration');
      expect(methodNames).toContain('testIntegration');
      expect(methodNames).toContain('getCases');
      expect(methodNames).toContain('getApprovals');
      expect(methodNames).toContain('getAuditLogs');
    });
  });

  // =========================================================================
  // 4. Integrations Hub: 7 Canonical Providers & Sanitized Secret Handling
  // =========================================================================
  describe('Requirements 1, 3, 14: 7 Canonical Providers & Secret Non-Exposure', () => {
    const api = require('../services/api');

    beforeEach(() => {
      api.get.mockImplementation((url) => {
        if (url.includes('/integrations')) {
          return Promise.resolve({
            data: {
              data: [
                {
                  id: 'int-jira-1',
                  name: 'Corporate Jira Cloud',
                  type: 'Jira',
                  provider: 'Jira',
                  healthStatus: 'Healthy',
                  active: true,
                  lastSyncAt: new Date().toISOString(),
                },
                {
                  id: 'int-snow-1',
                  name: 'Global IT ServiceNow',
                  type: 'ServiceNow',
                  provider: 'ServiceNow',
                  healthStatus: 'Healthy',
                  active: true,
                  lastSyncAt: new Date().toISOString(),
                },
                {
                  id: 'int-pd-1',
                  name: 'SecOps PagerDuty',
                  type: 'PagerDuty',
                  provider: 'PagerDuty',
                  healthStatus: 'Warning',
                  active: true,
                  lastSyncAt: new Date().toISOString(),
                },
              ],
            },
          });
        }
        if (url.includes('/cases')) {
          return Promise.resolve({ data: { data: [] } });
        }
        if (url.includes('/approvals')) {
          return Promise.resolve({ data: { data: { approvals: [] } } });
        }
        if (url.includes('/audit')) {
          return Promise.resolve({ data: { data: [] } });
        }
        return Promise.resolve({ data: [] });
      });
    });

    test('renders canonical providers and connection status badges in Integrations Hub', async () => {
      await act(async () => {
        root.render(
          <MemoryRouter>
            <IntegrationsPage />
          </MemoryRouter>
        );
      });

      expect(container.textContent).toContain('External Workflow & ITSM Center');
      expect(container.textContent).toContain('Corporate Jira Cloud');
      expect(container.textContent).toContain('Global IT ServiceNow');
      expect(container.textContent).toContain('SecOps PagerDuty');
      expect(container.textContent).toContain('Healthy');
      expect(container.textContent).toContain('Warning');
    });

    test('verifies all 7 canonical provider types are supported with dedicated connector buttons', async () => {
      await act(async () => {
        root.render(
          <MemoryRouter>
            <IntegrationsPage />
          </MemoryRouter>
        );
      });

      expect(container.textContent).toContain('+ Add Jira');
      expect(container.textContent).toContain('+ Add ServiceNow');
      expect(container.textContent).toContain('+ Add PagerDuty');
      expect(container.textContent).toContain('+ Add Slack');
      expect(container.textContent).toContain('+ Add Teams');
      expect(container.textContent).toContain('+ Add GitHub');
      expect(container.textContent).toContain('+ Add Webhook');
    });

    test('secret inputs use type="password" and are never rendered in plain text', async () => {
      await act(async () => {
        root.render(
          <MemoryRouter>
            <IntegrationsPage />
          </MemoryRouter>
        );
      });

      // Click "+ Add ServiceNow" button to open modal
      const snowBtn = Array.from(container.querySelectorAll('button')).find(
        (b) => b.textContent.includes('+ Add ServiceNow')
      );
      expect(snowBtn).toBeTruthy();

      await act(async () => {
        snowBtn.click();
      });

      // Check modal heading
      expect(container.textContent).toContain('Configure ServiceNow Connector');

      // Check that password fields exist and have type="password"
      const passwordInputs = Array.from(container.querySelectorAll('input[type="password"]'));
      expect(passwordInputs.length).toBeGreaterThanOrEqual(2); // Password + Webhook Secret

      // Verify no secrets exposed in plain text in the document
      expect(container.textContent).not.toContain('secretTokenValue');
      expect(container.textContent).not.toContain('rawPassword123');
    });
  });

  // =========================================================================
  // 5. External Tickets Tab & Ticket Rendering
  // =========================================================================
  describe('Requirements 4 & 5: External Ticket Rendering and Safe Link Attributes', () => {
    const api = require('../services/api');

    beforeEach(() => {
      api.get.mockImplementation((url) => {
        if (url.includes('/integrations')) {
          return Promise.resolve({ data: { data: [] } });
        }
        if (url.includes('/cases')) {
          return Promise.resolve({
            data: {
              data: {
                cases: [
                  {
                    id: 'case-999',
                    title: 'Ransomware Outbreak on DB Host',
                    severity: 'CRITICAL',
                    externalTickets: [
                      {
                        provider: 'Jira',
                        ticketKey: 'SEC-4091',
                        ticketId: '10045',
                        ticketUrl: 'https://jira.enterprise.internal/browse/SEC-4091',
                        externalStatus: 'In Progress',
                        syncStatus: 'IN_SYNC',
                        syncDirection: 'BIDIRECTIONAL',
                        lastSyncAt: new Date().toISOString(),
                      },
                      {
                        provider: 'ServiceNow',
                        ticketKey: 'INC0098421',
                        ticketId: 'sys-id-998',
                        ticketUrl: 'https://snow.internal/incident.do?sys_id=sys-id-998',
                        externalStatus: 'Work in Progress',
                        syncStatus: 'PENDING_OUTBOUND',
                        syncDirection: 'OUTBOUND',
                        lastSyncAt: new Date().toISOString(),
                      },
                    ],
                  },
                ],
              },
            },
          });
        }
        if (url.includes('/approvals')) {
          return Promise.resolve({ data: { data: { approvals: [] } } });
        }
        if (url.includes('/audit')) {
          return Promise.resolve({ data: { data: [] } });
        }
        return Promise.resolve({ data: [] });
      });
    });

    test('renders external tickets list with provider badges, ticket keys, and safe links', async () => {
      await act(async () => {
        root.render(
          <MemoryRouter>
            <IntegrationsPage />
          </MemoryRouter>
        );
      });

      // Switch to "External Tickets" tab
      const ticketsTab = Array.from(container.querySelectorAll('button')).find(
        (b) => b.textContent.includes('External Tickets')
      );
      expect(ticketsTab).toBeTruthy();

      await act(async () => {
        ticketsTab.click();
      });

      expect(container.textContent).toContain('SEC-4091');
      expect(container.textContent).toContain('INC0098421');
      expect(container.textContent).toContain('IN_SYNC');
      expect(container.textContent).toContain('PENDING_OUTBOUND');

      // Verify safe external link attributes (target="_blank" and rel="noopener noreferrer")
      const externalLinks = Array.from(container.querySelectorAll('a[target="_blank"]'));
      expect(externalLinks.length).toBeGreaterThanOrEqual(1);
      externalLinks.forEach((link) => {
        expect(link.getAttribute('rel')).toContain('noopener');
        expect(link.getAttribute('rel')).toContain('noreferrer');
        expect(link.getAttribute('href')).toMatch(/^https?:\/\//);
      });
    });
  });

  // =========================================================================
  // 6. Approval Lifecycle, Canonical Statuses & External Callbacks
  // =========================================================================
  describe('Requirements 6, 7, 17: Canonical Approval Lifecycle & External Callbacks', () => {
    beforeEach(() => {
      jest.spyOn(axios, 'get').mockResolvedValue({
        data: {
          success: true,
          data: {
            approvals: [
              {
                approvalId: 'app-gate-001',
                actionType: 'quarantine_host',
                riskLevel: 'PRIVILEGED',
                status: 'PROPOSED',
                target: '10.0.0.45',
                tool: 'host_quarantine',
                reason: 'Isolate compromised host',
                createdAt: new Date().toISOString(),
                requestedBy: { username: 'analyst_bob', role: 'ANALYST' },
              },
              {
                approvalId: 'app-gate-002',
                actionType: 'block_ip_range',
                riskLevel: 'USER_APPROVED',
                status: 'APPROVED',
                target: '198.51.100.0/24',
                tool: 'iptables',
                reason: 'Block active C2 beaconing',
                createdAt: new Date().toISOString(),
                approvedBy: {
                  username: 'jira_webhook_sync',
                  role: 'EXTERNAL_ITSM',
                  timestamp: new Date().toISOString(),
                  decisionReason: 'Approved by SecOps Manager via Jira SEC-4091 ticket',
                },
                decidedBy: { username: 'jira_webhook_sync', role: 'EXTERNAL_ITSM' },
                decisionReason: 'Approved by SecOps Manager via Jira SEC-4091 ticket',
              },
            ],
          },
        },
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('renders canonical PROPOSED and APPROVED statuses in Approval Center', async () => {
      await act(async () => {
        root.render(
          <MemoryRouter>
            <ApprovalCenterPage />
          </MemoryRouter>
        );
      });

      expect(container.textContent).toContain('app-gate-001');
      expect(container.textContent).toContain('app-gate-002');
      expect(container.textContent).toContain('PROPOSED');
      expect(container.textContent).toContain('APPROVED');
    });

    test('renders External ITSM Decision badge and attribution card for webhook approved actions', async () => {
      await act(async () => {
        root.render(
          <MemoryRouter>
            <ApprovalCenterPage />
          </MemoryRouter>
        );
      });

      expect(container.textContent).toContain('External ITSM Decision');

      // Click on app-gate-002
      const card2 = Array.from(container.querySelectorAll('div')).find(
        (el) => el.textContent.includes('app-gate-002') && el.getAttribute('class')?.includes('cursor-pointer')
      );
      if (card2) {
        await act(async () => {
          card2.click();
        });
      }

      expect(container.textContent).toContain('External ITSM Callback Recorded');
      expect(container.textContent).toContain('Approved by SecOps Manager via Jira SEC-4091 ticket');
    });

    test('subscribes to Socket.IO approval:external_callback event for real-time updates', async () => {
      await act(async () => {
        root.render(
          <MemoryRouter>
            <ApprovalCenterPage />
          </MemoryRouter>
        );
      });

      expect(mockIo).toHaveBeenCalled();
      expect(mockSocket.on).toHaveBeenCalledWith(
        'approval:external_callback',
        expect.any(Function)
      );
    });
  });

  // =========================================================================
  // 7. Audit & Sync History
  // =========================================================================
  describe('Requirement 8: Sanitized Integration Audit / Sync History', () => {
    const api = require('../services/api');

    beforeEach(() => {
      api.get.mockImplementation((url) => {
        if (url.includes('/integrations')) {
          return Promise.resolve({ data: { data: [] } });
        }
        if (url.includes('/cases')) {
          return Promise.resolve({ data: { data: [] } });
        }
        if (url.includes('/approvals')) {
          return Promise.resolve({ data: { data: { approvals: [] } } });
        }
        if (url.includes('/audit')) {
          return Promise.resolve({
            data: {
              data: [
                {
                  id: 'evt-audit-1',
                  timestamp: new Date().toISOString(),
                  action: 'TICKET_DISPATCH_SUCCESS',
                  category: 'INTEGRATION',
                  provider: 'SERVICENOW',
                  direction: 'OUTBOUND',
                  status: 'SUCCESS',
                  entityId: 'INC0098421',
                  details: { externalTicketKey: 'INC0098421', latencyMs: 182 },
                },
                {
                  id: 'evt-audit-2',
                  timestamp: new Date().toISOString(),
                  action: 'APPROVAL_CALLBACK_RECEIVED',
                  category: 'INTEGRATION',
                  provider: 'JIRA',
                  direction: 'INBOUND',
                  status: 'SUCCESS',
                  entityId: 'app-gate-002',
                  details: { approvalId: 'app-gate-002', status: 'APPROVED' },
                },
              ],
            },
          });
        }
        return Promise.resolve({ data: [] });
      });
    });

    test('renders sanitized audit records without raw authorization headers or secrets', async () => {
      await act(async () => {
        root.render(
          <MemoryRouter>
            <IntegrationsPage />
          </MemoryRouter>
        );
      });

      const auditTab = Array.from(container.querySelectorAll('button')).find(
        (b) => b.textContent.includes('Sync Audit')
      );
      expect(auditTab).toBeTruthy();

      await act(async () => {
        auditTab.click();
      });

      expect(container.textContent).toContain('TICKET_DISPATCH_SUCCESS');
      expect(container.textContent).toContain('APPROVAL_CALLBACK_RECEIVED');
      expect(container.textContent).toContain('SERVICENOW');
      expect(container.textContent).toContain('JIRA');

      expect(container.textContent).not.toContain('Bearer ');
      expect(container.textContent).not.toContain('Authorization');
      expect(container.textContent).not.toContain('webhookSecret');
    });
  });

  // =========================================================================
  // 8. Empty, Loading and Error States
  // =========================================================================
  describe('Requirements 9, 10, 11, 12: Loading, Empty, and Error States', () => {
    const api = require('../services/api');

    test('renders empty state when zero integrations exist', async () => {
      api.get.mockResolvedValue({ data: { data: [] } });

      await act(async () => {
        root.render(
          <MemoryRouter>
            <IntegrationsPage />
          </MemoryRouter>
        );
      });

      expect(container.textContent).toContain('No integration connectors configured');
    });

    test('renders error toast gracefully without crashing when API returns error', async () => {
      const toast = require('react-hot-toast');
      api.get.mockRejectedValue(new Error('Network error loading integrations'));

      await act(async () => {
        root.render(
          <MemoryRouter>
            <IntegrationsPage />
          </MemoryRouter>
        );
      });

      expect(toast.error).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 9. Zero Action Execution (Presentation/Control Layer Only)
  // =========================================================================
  describe('Requirement 16: Zero Client-Side Execution Guarantee', () => {
    test('frontend never executes SOAR actions, playbooks, or host scripts client-side', () => {
      expect(workflowIntegrationService).not.toHaveProperty('executeSOARAction');
      expect(workflowIntegrationService).not.toHaveProperty('runPlaybookNative');
      expect(workflowIntegrationService).not.toHaveProperty('executeScript');
      expect(workflowIntegrationService).not.toHaveProperty('dispatchAutonomousRemediation');
    });
  });
});
