import api from './api';
import { API_ROUTES } from '../constants/apiRoutes';

/**
 * Dashboard Service
 * Centralizes all actions related to dashboard feeds, threat intelligence feeds,
 * SOC operations, playbooks, vulnerabilities bulk changes, and audit logs.
 */
export const dashboardService = {
  getStats: async () => {
    const { data } = await api.get(API_ROUTES.DASHBOARD.STATS);
    return data;
  },

  getFeeds: async () => {
    const { data } = await api.get(API_ROUTES.DASHBOARD.FEEDS);
    return data;
  },

  getMainDashboard: async () => {
    const { data } = await api.get(API_ROUTES.DASHBOARD.MAIN);
    return data;
  },

  getThreatFeed: async () => {
    const { data } = await api.get(API_ROUTES.DASHBOARD.THREAT_FEED);
    return data;
  },

  getAuditLogs: async (limit = 50) => {
    const { data } = await api.get(API_ROUTES.ADMIN.AUDIT_LOGS, { params: { limit } });
    return data;
  },

  getIocStats: async () => {
    const { data } = await api.get(API_ROUTES.IOC.STATS);
    return data;
  },

  syncIocFeeds: async () => {
    const { data } = await api.post(API_ROUTES.IOC.SYNC);
    return data;
  },

  getIntegrations: async () => {
    const { data } = await api.get(API_ROUTES.INTEGRATIONS.BASE);
    return data;
  },

  createIntegration: async (integrationData) => {
    const { data } = await api.post(API_ROUTES.INTEGRATIONS.BASE, integrationData);
    return data;
  },

  testIntegration: async (integrationId) => {
    const { data } = await api.post(API_ROUTES.INTEGRATIONS.TEST, { id: integrationId });
    return data;
  },

  getVulnerabilities: async (params) => {
    const { data } = await api.get(API_ROUTES.VULNERABILITIES.BASE, { params });
    return data;
  },

  updateVulnerabilitiesBulkStatus: async (bulkData) => {
    const { data } = await api.post(API_ROUTES.VULNERABILITIES.BULK_STATUS, bulkData);
    return data;
  },

  executeTool: async (toolData) => {
    const { data } = await api.post(API_ROUTES.TOOLS.EXECUTE, toolData);
    return data;
  },

  verifyUpi: async (upi) => {
    const { data } = await api.post(API_ROUTES.TOOLS.UPI, { upi });
    return data;
  },

  verifySms: async (sender, message) => {
    const { data } = await api.post(API_ROUTES.TOOLS.SMS, { sender, message });
    return data;
  },
};

export default dashboardService;
