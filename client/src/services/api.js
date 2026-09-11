import axios from 'axios';
import { API_BASE_URL, SOCKET_URL } from '../config';


const NEXUS_SESSION_KEY = 'cybershield.nexus.session';

const createSessionToken = () => {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `nexus-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
};

const getSessionStorage = () => {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const getNexusSessionToken = () => {
  const storage = getSessionStorage();
  if (!storage) return createSessionToken();

  let token = storage.getItem(NEXUS_SESSION_KEY);
  if (!token) {
    token = createSessionToken();
    storage.setItem(NEXUS_SESSION_KEY, token);
  }
  return token;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ─── Request Interceptor: Attach Auth Token, CSRF session + Org tenant header ────
api.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  config.headers['x-nexus-session-token'] = getNexusSessionToken();

  // Attach stored JWT Bearer token as fallback for cross-domain cookie restrictions
  try {
    const token = localStorage.getItem('cybershield_token');
    if (token && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (err) {
    // LocalStorage might be blocked or unavailable
  }

  // Attach active organization scope for multi-tenant requests
  try {
    const activeOrgId = localStorage.getItem('cybershield.active.orgId');
    if (activeOrgId) {
      config.headers['x-organization-id'] = activeOrgId;
    }
  } catch (err) {
    // LocalStorage might be blocked or unavailable
  }

  return config;
});

// ─── Response Interceptor: Single-Flight Token Refresh Lock ─────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    const isAuthRoute = originalRequest.url && (
      originalRequest.url.includes('/auth/refresh') ||
      originalRequest.url.includes('/auth/login') ||
      originalRequest.url.includes('/auth/signup') ||
      originalRequest.url.includes('/auth/admin-login')
    );

    // Only intercept 401 on non-auth requests that have not been retried yet
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        let fallbackRefreshToken = null;
        try {
          fallbackRefreshToken = localStorage.getItem('cybershield_refresh_token');
        } catch {}

        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken: fallbackRefreshToken },
          { withCredentials: true }
        );

        const newAccessToken = data.token;
        if (newAccessToken) {
          try {
            localStorage.setItem('cybershield_token', newAccessToken);
            if (data.refreshToken) {
              localStorage.setItem('cybershield_refresh_token', data.refreshToken);
            }
          } catch {}
        }

        // CRITICAL FIX: Set updated Authorization header on the originating request before retrying
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;

        processQueue(null, newAccessToken);
        isRefreshing = false;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        // Clear expired credentials from local storage
        try {
          localStorage.removeItem('cybershield_token');
          localStorage.removeItem('cybershield_refresh_token');
        } catch {}

        // Notify application of session expiration
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cybershield:session-expired', {
            detail: { code: 'AUTH_SESSION_EXPIRED', message: 'Session expired' }
          }));
        }

        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const resolveRealtimeServerUrl = () => SOCKET_URL;

export default api;
