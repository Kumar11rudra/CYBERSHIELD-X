/**
 * 🛰️ Nexus Network Configuration
 * Handles dynamic API and Socket resolution for the production environment.
 */

const getApiBaseUrl = () => {
  // Dynamic production detection
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // Ignore localhost env variables in production browser environment
      if (process.env.REACT_APP_API_URL && !process.env.REACT_APP_API_URL.includes('localhost') && !process.env.REACT_APP_API_URL.includes('127.0.0.1')) {
        const base = process.env.REACT_APP_API_URL.replace(/\/+$/, '');
        return base.endsWith('/api') ? base : `${base}/api`;
      }
      return 'https://cybershield-x.onrender.com/api';
    }
  }

  // Fallback for local development
  if (process.env.REACT_APP_API_URL) {
    const base = process.env.REACT_APP_API_URL.replace(/\/+$/, '');
    return base.endsWith('/api') ? base : `${base}/api`;
  }

  return 'http://localhost:3001/api';
};

const getSocketUrl = () => {
  // Dynamic production detection
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // Ignore localhost env variables in production browser environment
      if (process.env.REACT_APP_API_URL && !process.env.REACT_APP_API_URL.includes('localhost') && !process.env.REACT_APP_API_URL.includes('127.0.0.1')) {
        return process.env.REACT_APP_API_URL.replace(/\/+$/, '');
      }
      return 'https://cybershield-x.onrender.com';
    }
  }

  // Fallback for local development
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/+$/, '');
  }
  
  return 'http://localhost:3001';
};

export const API_BASE_URL = getApiBaseUrl();
export const SOCKET_URL = getSocketUrl();

