import api from './api';
import { API_ROUTES } from '../constants/apiRoutes';

/**
 * Scan Service
 * Centralizes all actions related to triggering scans, fetching scan details,
 * retrieving scan history, and sharing scan results.
 */
export const scanService = {
  triggerScan: async (scanConfig) => {
    const { data } = await api.post(API_ROUTES.SCAN.TRIGGER, scanConfig);
    return data;
  },

  triggerBulkScan: async (bulkConfig) => {
    const { data } = await api.post(API_ROUTES.SCAN.BULK, bulkConfig);
    return data;
  },

  getScanDetails: async (id) => {
    const { data } = await api.get(API_ROUTES.SCAN.DETAILS(id));
    return data;
  },

  getScanHistory: async (params) => {
    const { data } = await api.get(API_ROUTES.SCAN.HISTORY, { params });
    return data;
  },

  getSharedScan: async (id) => {
    const { data } = await api.get(API_ROUTES.SCAN.SHARE(id));
    return data;
  },
};

export default scanService;
