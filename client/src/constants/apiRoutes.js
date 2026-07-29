/**
 * CyberShield X API Endpoint Definitions
 * Maps backend paths to structured constants.
 */
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    CHECK_USERNAME: '/auth/check-username',
    PASSWORD_CHECK: '/auth/password-check',
    EMAIL_CHECK: '/auth/email-check',
    REQUEST_EMAIL_OTP: '/auth/request-email-otp',
    VERIFY_EMAIL_OTP: '/auth/verify-email-otp',
    REQUEST_PASSWORD_RESET: '/auth/request-password-reset',
    VERIFY_RESET_OTP: '/auth/verify-reset-otp',
    RESET_PASSWORD: '/auth/reset-password',
    UPDATE_PASSWORD: '/auth/update-password',
    REVOKE_SESSION: '/auth/sessions/revoke',
    ENABLE_2FA: '/auth/2fa/enable',
    DISABLE_2FA: '/auth/2fa/disable',
    CONFIRM_2FA: '/auth/2fa/confirm',
    WEBHOOK: '/auth/webhook',
    SESSIONS: '/auth/sessions',
    ME: '/auth/me',
    DELETE_ACCOUNT: '/auth/delete-account',
  },
  SCAN: {
    TRIGGER: '/scan',
    BULK: '/scan/bulk',
    DETAILS: (id) => `/scan/${id}`,
    HISTORY: '/history',
    SHARE: (id) => `/shared-scan/${id}`,
  },
  ASSETS: {
    BASE: '/assets',
    SINGLE: (id) => `/assets/${id}`,
    SCHEDULES: '/schedules',
  },
  VAULT: {
    ADD: '/vault/add',
    BASE: '/vault',
  },
  DASHBOARD: {
    STATS: '/dashboard/stats',
    FEEDS: '/dashboard/feeds',
    MAIN: '/dashboard',
    THREAT_FEED: '/threat-feed',
  },
  AI: {
    CHAT: '/ai/chat',
  },
  VULNERABILITIES: {
    BASE: '/vulnerabilities',
    BULK_STATUS: '/vulnerabilities/bulk-status',
  },
  INTEGRATIONS: {
    BASE: '/integrations',
    TEST: '/integrations/test',
  },
  IOC: {
    SYNC: '/ioc/sync-feeds',
    STATS: '/ioc/feed-stats',
  },
  ADMIN: {
    AUDIT_LOGS: '/admin/audit-logs',
  },
  TOOLS: {
    UPI: '/tools/upi',
    SMS: '/tools/sms',
    EXECUTE: '/toolkit/execute',
  },
};
export default API_ROUTES;
