import api from './api';
import { API_ROUTES } from '../constants/apiRoutes';

/**
 * AI Service
 * Centralizes all actions related to AI Security Copilot.
 */
export const aiService = {
  chat: async (message, model, context = {}) => {
    const { data } = await api.post(API_ROUTES.AI.CHAT, { message, model, context });
    return data;
  },
};

export default aiService;
