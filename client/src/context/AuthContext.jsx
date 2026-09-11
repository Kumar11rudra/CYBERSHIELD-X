import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { captureBrowserLocation, captureNetworkInfo } from '../utils/location';

export const AUTH_STATE = {
  UNKNOWN: 'UNKNOWN',
  AUTHENTICATING: 'AUTHENTICATING',
  AUTHENTICATED: 'AUTHENTICATED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  REFRESHING: 'REFRESHING',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  AUTH_ERROR: 'AUTH_ERROR',
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState(AUTH_STATE.UNKNOWN);
  const [authError, setAuthError] = useState(null);
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('cybershield_token');
    } catch {
      return null;
    }
  });

  const loadUser = useCallback(async () => {
    setAuthState((prev) => (prev === AUTH_STATE.UNKNOWN ? AUTH_STATE.AUTHENTICATING : prev));
    try {
      const res = await api.get('/auth/me');
      if (res.data?.user) {
        setUser(res.data.user);
        setAuthState(AUTH_STATE.AUTHENTICATED);
        setAuthError(null);
      } else {
        setUser(null);
        setAuthState(AUTH_STATE.UNAUTHENTICATED);
      }
    } catch (err) {
      setUser(null);
      if (err.response?.status === 401) {
        setAuthState(AUTH_STATE.UNAUTHENTICATED);
      } else {
        setAuthState(AUTH_STATE.AUTH_ERROR);
        setAuthError(err.message || 'Failed to authenticate');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Bootstrap session on mount
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Listen for custom session-expired event from API interceptor
  useEffect(() => {
    const handleSessionExpired = (event) => {
      setUser(null);
      setToken(null);
      setAuthState(AUTH_STATE.SESSION_EXPIRED);
      setAuthError(event.detail?.message || 'Your session has expired. Please sign in again.');
      setLoading(false);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('cybershield:session-expired', handleSessionExpired);
      return () => window.removeEventListener('cybershield:session-expired', handleSessionExpired);
    }
  }, []);

  // Multi-tab cross-tab synchronization via storage events
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'cybershield_token' || e.key === 'cybershield_auth_event') {
        const currentToken = localStorage.getItem('cybershield_token');
        if (!currentToken) {
          // Another tab logged out
          setUser(null);
          setToken(null);
          setAuthState(AUTH_STATE.UNAUTHENTICATED);
          setLoading(false);
        } else if (currentToken !== token) {
          // Another tab logged in or refreshed token
          setToken(currentToken);
          loadUser();
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [token, loadUser]);

  const login = async (email, password, otp = null) => {
    setAuthState(AUTH_STATE.AUTHENTICATING);
    const location = await captureBrowserLocation();
    const network = captureNetworkInfo();

    try {
      const res = await api.post('/auth/login', {
        email,
        identity: email,
        password,
        otp,
        clientIntel: { location, network }
      });

      const { token: newToken, refreshToken: newRefreshToken, user: newUser } = res.data;
      if (newToken) {
        try {
          localStorage.setItem('cybershield_token', newToken);
          if (newRefreshToken) localStorage.setItem('cybershield_refresh_token', newRefreshToken);
          localStorage.setItem('cybershield_auth_event', `login:${Date.now()}`);
        } catch {}
      }

      setToken(newToken);
      setUser(newUser);
      setAuthState(AUTH_STATE.AUTHENTICATED);
      setAuthError(null);
      return newUser;
    } catch (err) {
      setAuthState(AUTH_STATE.UNAUTHENTICATED);
      throw err;
    }
  };

  const adminLogin = async (identity, password) => {
    setAuthState(AUTH_STATE.AUTHENTICATING);
    const location = await captureBrowserLocation();
    const network = captureNetworkInfo();

    try {
      const res = await api.post('/auth/admin-login', { identity, password, clientIntel: { location, network } });
      const { token: newToken, refreshToken: newRefreshToken, user: newUser } = res.data;
      if (newToken) {
        try {
          localStorage.setItem('cybershield_token', newToken);
          if (newRefreshToken) localStorage.setItem('cybershield_refresh_token', newRefreshToken);
          localStorage.setItem('cybershield_auth_event', `login:${Date.now()}`);
        } catch {}
      }

      setToken(newToken);
      setUser(newUser);
      setAuthState(AUTH_STATE.AUTHENTICATED);
      setAuthError(null);
      return newUser;
    } catch (err) {
      setAuthState(AUTH_STATE.UNAUTHENTICATED);
      throw err;
    }
  };

  const signup = async (username, email, password, mobileNumber, fullName) => {
    setAuthState(AUTH_STATE.AUTHENTICATING);
    const location = await captureBrowserLocation();
    const network = captureNetworkInfo();

    try {
      const res = await api.post('/auth/signup', {
        username,
        email,
        password,
        mobileNumber,
        fullName,
        clientIntel: { location, network }
      });

      const { token: newToken, refreshToken: newRefreshToken, user: newUser } = res.data;
      if (newToken) {
        try {
          localStorage.setItem('cybershield_token', newToken);
          if (newRefreshToken) localStorage.setItem('cybershield_refresh_token', newRefreshToken);
          localStorage.setItem('cybershield_auth_event', `login:${Date.now()}`);
        } catch {}
      }

      setToken(newToken);
      setUser(newUser);
      setAuthState(AUTH_STATE.AUTHENTICATED);
      setAuthError(null);
      return newUser;
    } catch (err) {
      setAuthState(AUTH_STATE.UNAUTHENTICATED);
      throw err;
    }
  };

  const logout = async ({ redirectTo = '/' } = {}) => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('[AUTH] Logout notification failed:', err.message);
    } finally {
      try {
        localStorage.removeItem('cybershield_token');
        localStorage.removeItem('cybershield_refresh_token');
        localStorage.removeItem('cybershield.active.orgId');
        localStorage.setItem('cybershield_auth_event', `logout:${Date.now()}`);
      } catch {}

      setToken(null);
      setUser(null);
      setAuthState(AUTH_STATE.UNAUTHENTICATED);
      setAuthError(null);

      if (redirectTo && typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
    }
  };

  const updateUser = (updates) => setUser((prev) => ({ ...prev, ...updates }));

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      authState,
      authError,
      login,
      adminLogin,
      signup,
      logout,
      updateUser,
      loadUser,
      AUTH_STATE
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
