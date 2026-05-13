import axios from 'axios';
import { API_BASE_URL } from '../config';

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

// ─── Request Interceptor: Attach CSRF session header ──────────────────────────
api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase();
  if (!['get', 'head', 'options'].includes(method)) {
    config.headers = config.headers || {};
    config.headers['x-nexus-session-token'] = getNexusSessionToken();
  }
  return config;
});

// ─── Response Interceptor: Silent Token Refresh ───────────────────────────────
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
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/refresh-token')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {}, { withCredentials: true });
        processQueue(null, data.accessToken);
        isRefreshing = false;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        // Optional: window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
