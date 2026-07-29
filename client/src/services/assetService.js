import api from './api';
import { API_ROUTES } from '../constants/apiRoutes';

/**
 * Asset Service
 * Centralizes all actions related to asset management, vault, and scheduling.
 */
export const assetService = {
  getAssets: async () => {
    const { data } = await api.get(API_ROUTES.ASSETS.BASE);
    return data;
  },

  createAsset: async (assetData) => {
    const { data } = await api.post(API_ROUTES.ASSETS.BASE, assetData);
    return data;
  },

  deleteAsset: async (id) => {
    const { data } = await api.delete(API_ROUTES.ASSETS.SINGLE(id));
    return data;
  },

  getSchedules: async () => {
    const { data } = await api.get(API_ROUTES.ASSETS.SCHEDULES);
    return data;
  },

  createSchedule: async (scheduleData) => {
    const { data } = await api.post(API_ROUTES.ASSETS.SCHEDULES, scheduleData);
    return data;
  },

  addToVault: async (vaultData) => {
    const { data } = await api.post(API_ROUTES.VAULT.ADD, vaultData);
    return data;
  },

  getVaultAssets: async () => {
    const { data } = await api.get(API_ROUTES.VAULT.BASE);
    return data;
  },
};

export default assetService;
