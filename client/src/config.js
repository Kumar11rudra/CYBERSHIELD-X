/**
 * 🛰️ Nexus Network Configuration
 * Handles dynamic API and Socket resolution for the production environment.
 */

const getApiBaseUrl = () => {
  // Use REACT_APP_API_URL if set (works in both dev and prod builds)
  if (process.env.REACT_APP_API_URL) {
    const base = process.env.REACT_APP_API_URL.replace(/\/+$/, '');
    return base.endsWith('/api') ? base : `${base}/api`;
  }

  // Fallback for local development
  return 'http://localhost:3001/api';
};

const getSocketUrl = () => {
  // Use the backend URL for socket connections
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/+$/, '');
  }
  
  // Local development
  return 'http://localhost:3001';
};

export const API_BASE_URL = getApiBaseUrl();
export const SOCKET_URL = getSocketUrl();
