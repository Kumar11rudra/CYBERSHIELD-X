'use strict';

/**
 * 🛡️ CyberShield X — Workflow & Integration Client Service (Phase 81 Step 7)
 *
 * Provides a unified, type-safe frontend API service layer for:
 * - Enterprise ITSM & Webhook Integrations (/api/integrations)
 * - Case External Tickets & Synchronization (/api/cases)
 * - Human-in-the-Loop Approval Lifecycle (/api/approvals)
 * - Sanitized Audit Logs (/api/audit)
 *
 * Security & Design Principles:
 * - Reuses existing authenticated api.js client (handles JWT, session token, and active org header)
 * - Never communicates with external providers directly from browser
 * - Never stores secrets, tokens, or credentials in local/session storage
 * - Never exposes raw webhook payloads or unmasked tokens
 * - Validates all external ticket URLs to prevent XSS / script injection (safe URL parser)
 * - Zero action execution: strictly fetches data and dispatches authorized backend mutations
 */

import api from './api';

/**
 * Validates whether an external ticket URL is safe for browser navigation.
 * Strictly permits only https: and http: protocols.
 * Blocks javascript:, data:, file:, and vbscript: URIs.
 *
 * @param {string} url - Candidate URL
 * @returns {boolean} True if safe to render in <a href="..." target="_blank" rel="noopener noreferrer">
 */
export const isSafeExternalUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    // If relative or invalid URL syntax, disallow external opening
    return false;
  }
};

/**
 * Returns a secure CSS badge styling class for Case externalTicket syncStatus.
 *
 * @param {string} status - syncStatus ('IN_SYNC', 'PENDING_OUTBOUND', 'PENDING_INBOUND', 'FAILED')
 * @returns {string} Tailwind CSS class string
 */
export const getSyncStatusBadgeClass = (status) => {
  switch (String(status || '').toUpperCase()) {
    case 'IN_SYNC':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'PENDING_OUTBOUND':
    case 'PENDING_INBOUND':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse';
    case 'FAILED':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    default:
      return 'bg-slate-800 text-slate-400 border-slate-700';
  }
};

/**
 * Returns a secure CSS badge styling class for integration healthStatus.
 *
 * @param {string} health - healthStatus ('Healthy', 'Warning', 'Failed', 'Unknown')
 * @returns {string} Tailwind CSS class string
 */
export const getHealthBadgeClass = (health) => {
  switch (String(health || '')) {
    case 'Healthy':
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    case 'Warning':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    case 'Failed':
      return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    default:
      return 'text-slate-400 bg-slate-800 border-slate-700';
  }
};

/**
 * Canonical Phase 81 Workflow & Integration Client Service
 */
const workflowIntegrationService = {
  /**
   * Fetch all configured external integrations for the active organization.
   *
   * @param {object} [params] - Query parameters
   * @returns {Promise<Array>} List of integration configs
   */
  async getIntegrations(params = {}) {
    const res = await api.get('/integrations', { params });
    // Normalize backend pagination/data shapes
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    if (Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  },

  /**
   * Create a new integration connector.
   *
   * @param {object} integrationData - Form payload
   * @returns {Promise<object>} Created integration document
   */
  async createIntegration(integrationData) {
    const res = await api.post('/integrations', integrationData);
    return res.data;
  },

  /**
   * Update an existing integration connector.
   *
   * @param {string} id - Integration ID
   * @param {object} integrationData - Updated fields
   * @returns {Promise<object>} Updated integration document
   */
  async updateIntegration(id, integrationData) {
    const res = await api.put(`/integrations/${id}`, integrationData);
    return res.data;
  },

  /**
   * Delete / deprovision an integration connector.
   *
   * @param {string} id - Integration ID
   * @returns {Promise<object>} Result confirmation
   */
  async deleteIntegration(id) {
    const res = await api.delete(`/integrations/${id}`);
    return res.data;
  },

  /**
   * Test an external integration connection.
   *
   * @param {string} id - Integration ID
   * @returns {Promise<object>} Test outcome { success, message | error }
   */
  async testIntegration(id) {
    const res = await api.post('/integrations/test', { id });
    return res.data;
  },

  /**
   * Fetch cases to extract bound external tickets (Case.externalTickets).
   *
   * @param {object} [params] - Query filters (page, limit, q, status)
   * @returns {Promise<Array>} List of case objects
   */
  async getCases(params = {}) {
    const res = await api.get('/cases', { params });
    if (Array.isArray(res.data?.data?.cases)) {
      return res.data.data.cases;
    }
    if (Array.isArray(res.data?.cases)) {
      return res.data.cases;
    }
    if (Array.isArray(res.data?.data)) {
      return res.data.data;
    }
    if (Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  },

  /**
   * Fetch pending or historical approvals from the Phase 77/81 lifecycle.
   *
   * @param {object} [params] - Query filters (status, riskLevel, page, limit)
   * @returns {Promise<Array>} List of PendingApproval documents
   */
  async getApprovals(params = {}) {
    const res = await api.get('/approvals', { params });
    if (Array.isArray(res.data?.data?.approvals)) {
      return res.data.data.approvals;
    }
    if (Array.isArray(res.data?.approvals)) {
      return res.data.approvals;
    }
    if (Array.isArray(res.data?.data)) {
      return res.data.data;
    }
    if (Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  },

  /**
   * Fetch audit activity logs for synchronization events.
   *
   * @param {object} [params] - Query filters
   * @returns {Promise<Array>} List of sanitized audit log entries
   */
  async getAuditLogs(params = {}) {
    try {
      const res = await api.get('/audit', { params });
      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      if (res.data?.data?.logs && Array.isArray(res.data.data.logs)) {
        return res.data.data.logs;
      }
      if (Array.isArray(res.data)) {
        return res.data;
      }
      return [];
    } catch {
      return [];
    }
  },
};

export { workflowIntegrationService };
export default workflowIntegrationService;
