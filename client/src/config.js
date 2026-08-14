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

  // Dynamic production detection
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return 'https://cybershield-x.onrender.com/api';
    }
  }

  // Fallback for local development
  return 'http://localhost:3001/api';
};

const getSocketUrl = () => {
  // Use the backend URL for socket connections
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/+$/, '');
  }

  // Dynamic production detection
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return 'https://cybershield-x.onrender.com';
    }
  }
  
  // Local development
  return 'http://localhost:3001';
};

export const API_BASE_URL = getApiBaseUrl();
export const SOCKET_URL = getSocketUrl();

