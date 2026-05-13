/**
 * 🛰️ Nexus Network Configuration
 * Handles dynamic API and Socket resolution for the production environment.
 */

const getApiBaseUrl = () => {
  // If we are in production, we use relative paths (handled by Nginx)
  if (process.env.NODE_ENV === 'production') {
    return '/api';
  }
  
  // Fallback for local development
  return process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
};

const getSocketUrl = () => {
  // Production sockets are tunneled through the main domain
  if (process.env.NODE_ENV === 'production') {
    return window.location.origin;
  }
  
  // Local development
  return 'http://localhost:5001';
};

export const API_BASE_URL = getApiBaseUrl();
export const SOCKET_URL = getSocketUrl();
