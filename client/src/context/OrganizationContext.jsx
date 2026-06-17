import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const OrganizationContext = createContext(null);

const STORAGE_KEY = 'cybershield.active.orgId';

/**
 * Global getter used by the api.js interceptor.
 * This avoids circular imports between context and service layers.
 */
let _activeOrgIdGetter = () => null;
export const getActiveOrgId = () => _activeOrgIdGetter();

export const OrganizationProvider = ({ children }) => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [activeOrgId, setActiveOrgIdState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });
  const [activeOrg, setActiveOrg] = useState(null);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // Keep the global getter in sync
  _activeOrgIdGetter = () => activeOrgId;

  const setActiveOrgId = useCallback((orgId) => {
    setActiveOrgIdState(orgId);
    try {
      if (orgId) {
        localStorage.setItem(STORAGE_KEY, orgId);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  // Fetch organizations when user is available
  const fetchOrganizations = useCallback(async () => {
    if (!user) {
      setOrganizations([]);
      setActiveOrg(null);
      return;
    }
    setLoadingOrgs(true);
    try {
      const res = await api.get('/orgs');
      const orgs = res.data?.orgs || [];
      setOrganizations(orgs);

      // Validate active org still exists
      if (activeOrgId) {
        const found = orgs.find((o) => (o._id || o.id) === activeOrgId);
        if (found) {
          setActiveOrg(found);
        } else {
          // Org no longer accessible, fall back to personal
          setActiveOrgId(null);
          setActiveOrg(null);
        }
      } else {
        setActiveOrg(null);
      }
    } catch (err) {
      console.warn('[ORG] Failed to fetch organizations:', err.message);
      setOrganizations([]);
    } finally {
      setLoadingOrgs(false);
    }
  }, [user, activeOrgId, setActiveOrgId]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // When active org changes, update the activeOrg object
  useEffect(() => {
    if (!activeOrgId) {
      setActiveOrg(null);
      return;
    }
    const found = organizations.find((o) => (o._id || o.id) === activeOrgId);
    setActiveOrg(found || null);
  }, [activeOrgId, organizations]);

  const switchToPersonal = useCallback(() => {
    setActiveOrgId(null);
    setActiveOrg(null);
  }, [setActiveOrgId]);

  const switchToOrg = useCallback((orgId) => {
    setActiveOrgId(orgId);
    const found = organizations.find((o) => (o._id || o.id) === orgId);
    setActiveOrg(found || null);
  }, [organizations, setActiveOrgId]);

  const value = {
    organizations,
    activeOrgId,
    activeOrg,
    loadingOrgs,
    switchToPersonal,
    switchToOrg,
    refreshOrganizations: fetchOrganizations,
    isOrgMode: Boolean(activeOrgId),
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error('useOrganization must be used within OrganizationProvider');
  return ctx;
};
