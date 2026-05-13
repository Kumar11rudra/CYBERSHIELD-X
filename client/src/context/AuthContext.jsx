import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { captureBrowserLocation, captureNetworkInfo } from '../utils/location';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null); // Keep state if needed by UI, but don't persist

  const loadUser = useCallback(async () => {
    if (localStorage.getItem('csx_demo_mode') === 'true') {
      setUser({
        _id: "demo_12345",
        username: "Guest_Agent",
        email: "demo@cybershield.local",
        role: "demo",
        avatar: null
      });
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      // We don't get the token back here if HttpOnly, so token state might just stay null,
      // but user indicates auth status.
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password, otp = null) => {
    // CAPTURE DEEP INTEL: Location & Network
    const location = await captureBrowserLocation();
    const network = captureNetworkInfo();

    const res = await api.post('/auth/login', {
      email,
      password,
      otp, // Pass the 2FA token if provided
      clientIntel: { location, network }
    });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const googleLogin = async (googleAccessToken) => {
    const location = await captureBrowserLocation();
    const network = captureNetworkInfo();

    const res = await api.post('/auth/google', {
      access_token: googleAccessToken,
      clientIntel: { location, network }
    });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const demoLogin = async () => {
    const demoUser = {
      _id: "demo_12345",
      username: "Guest_Agent",
      email: "demo@cybershield.local",
      role: "demo",
      avatar: null
    };
    setUser(demoUser);
    localStorage.setItem('csx_demo_mode', 'true');
    return demoUser;
  };

  const adminLogin = async (identity, password) => {
    const location = await captureBrowserLocation();
    const network = captureNetworkInfo();

    const res = await api.post('/auth/admin-login', { identity, password, clientIntel: { location, network } });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const signup = async (username, email, password, mobileNumber, verificationToken, fullName, age, country, gender) => {
    const location = await captureBrowserLocation();
    const network = captureNetworkInfo();

    const res = await api.post('/auth/signup', {
      username,
      email,
      password,
      mobileNumber,
      verificationToken,
      fullName,
      age,
      country,
      gender,
      clientIntel: { location, network }
    });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const logout = async ({ redirectTo = '/' } = {}) => {
    localStorage.removeItem('csx_demo_mode');
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('[AUTH] Logout notification failed:', err.message);
    } finally {
      setToken(null);
      setUser(null);
      if (redirectTo) window.location.href = redirectTo;
    }
  };

  const updateUser = (updates) => setUser((prev) => ({ ...prev, ...updates }));

  return (
    <AuthContext.Provider value={{ user, token, loading, login, googleLogin, adminLogin, demoLogin, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
