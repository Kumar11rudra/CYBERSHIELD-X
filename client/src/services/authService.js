import api from './api';
import { API_ROUTES } from '../constants/apiRoutes';

/**
 * Authentication Service
 * Centralizes all operations matching /auth/* routes.
 */
export const authService = {
  login: async (identity, password) => {
    const { data } = await api.post(API_ROUTES.AUTH.LOGIN, { identity, password });
    return data;
  },

  signup: async (signupData) => {
    const { data } = await api.post(API_ROUTES.AUTH.SIGNUP, signupData);
    return data;
  },

  checkUsername: async (username) => {
    const { data } = await api.post(API_ROUTES.AUTH.CHECK_USERNAME, { username });
    return data;
  },

  checkPasswordStrength: async (password) => {
    const { data } = await api.post(API_ROUTES.AUTH.PASSWORD_CHECK, { password });
    return data;
  },

  checkEmailAvailability: async (email) => {
    const { data } = await api.post(API_ROUTES.AUTH.EMAIL_CHECK, { email });
    return data;
  },

  requestEmailOtp: async (email) => {
    const { data } = await api.post(API_ROUTES.AUTH.REQUEST_EMAIL_OTP, { email });
    return data;
  },

  verifyEmailOtp: async (email, otp) => {
    const { data } = await api.post(API_ROUTES.AUTH.VERIFY_EMAIL_OTP, { email, otp });
    return data;
  },

  requestPasswordReset: async (email) => {
    const { data } = await api.post(API_ROUTES.AUTH.REQUEST_PASSWORD_RESET, { email });
    return data;
  },

  verifyResetOtp: async (email, otp) => {
    const { data } = await api.post(API_ROUTES.AUTH.VERIFY_RESET_OTP, { email, otp });
    return data;
  },

  resetPassword: async (email, token, newPassword) => {
    const { data } = await api.post(API_ROUTES.AUTH.RESET_PASSWORD, { email, token, newPassword });
    return data;
  },

  updatePassword: async (oldPassword, newPassword) => {
    const { data } = await api.post(API_ROUTES.AUTH.UPDATE_PASSWORD, { oldPassword, newPassword });
    return data;
  },

  revokeSession: async (sessionId) => {
    const { data } = await api.post(API_ROUTES.AUTH.REVOKE_SESSION, { sessionId });
    return data;
  },

  enable2Fa: async () => {
    const { data } = await api.post(API_ROUTES.AUTH.ENABLE_2FA);
    return data;
  },

  disable2Fa: async () => {
    const { data } = await api.post(API_ROUTES.AUTH.DISABLE_2FA);
    return data;
  },

  confirm2Fa: async (otp) => {
    const { data } = await api.post(API_ROUTES.AUTH.CONFIRM_2FA, { otp });
    return data;
  },

  updateWebhook: async (webhookUrl, test = false) => {
    const { data } = await api.patch(API_ROUTES.AUTH.WEBHOOK, { webhookUrl, test });
    return data;
  },

  getSessions: async () => {
    const { data } = await api.get(API_ROUTES.AUTH.SESSIONS);
    return data;
  },

  updateAvatar: async (avatarData) => {
    const { data } = await api.patch(API_ROUTES.AUTH.ME, { avatar: avatarData });
    return data;
  },

  deleteAccount: async () => {
    const { data } = await api.delete(API_ROUTES.AUTH.DELETE_ACCOUNT);
    return data;
  },

  revokeDeviceSession: async (deviceId) => {
    const { data } = await api.post(API_ROUTES.AUTH.REVOKE_SESSION, { deviceId });
    return data;
  },
};

export default authService;
