import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useOrganization } from '../../context/OrganizationContext';
import { motion, AnimatePresence } from 'framer-motion';
import BrandLogo from './BrandLogo';
import CyberTerminal from './CyberTerminal';
import NetworkStatusHUD from './NetworkStatusHUD';
import NotificationCenter from './NotificationCenter';
import { useTranslation } from 'react-i18next';

// ─── Threat ticker ────────────────────────────────────────────────────────────
const TICKER = [
  '⚠ CISA KEV: Critical RCE in Ivanti Connect Secure',
  '🔴 ALERT: New Lumma Stealer campaign targeting Indian banks',
  '⚡ UrlEngine: 2.3M new IOCs detected in last 24h',
  '🛡 UrlEngine: 14,000+ IPs reported for DDoS activity today',
  '⚠ NCIIPC Advisory: Phishing attacks targeting UPI users',
  '🔴 CERT-In: Ransomware targeting MSME sector in India',
];

// ── Icon ───────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  dashboard: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  scanner: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18",
  email: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  history: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  admin: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  logout: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  terminal: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 18L18 6M6 6l12 12",
  sun: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z",
  moon: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z",
  vault: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  globe: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9",
  chevDown: "M19 9l-7 7-7-7",
  user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  bell: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  bulk: "M4 6h16M4 10h16M4 14h16M4 18h16",
  monitor: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  qrcode: "M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h2v2h-2v-2zm4 0h2v2h-2v-2zm-4 4h2v2h-2v-2zm4 0h2v2h-2v-2z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  pulse: "M3 12h4l3-8 4 16 3-8h4",
  toolkit: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
};

// ─── Grouped Navigation Structure ─────────────────────────────────────────────
const NAV_GROUPS = [
  {
    title: 'COMMAND',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
      { to: '/soc', label: 'SOC SIEM Console', icon: 'bell' },
      { to: '/system-health', label: 'System Health', icon: 'pulse' },
      { to: '/security', label: 'Security Posture', icon: 'shield' },
    ]
  },
  {
    title: 'SECURITY TOOLS',
    items: [
      { to: '/toolkit', label: 'All Tools (110)', icon: 'toolkit', badge: '110' },
      { to: '/scan', label: 'Live Scanner', icon: 'scanner', badge: 'LIVE' },
      { to: '/bulk-scan', label: 'Bulk Scanner', icon: 'bulk' },
      { to: '/web-forensics', label: 'Web Forensics', icon: 'globe' },
      { to: '/message-analyzer', label: 'Message Analyzer', icon: 'email' },
      { to: '/upi-verifier', label: 'UPI Verifier', icon: 'search' },
    ]
  },
  {
    title: 'WORKSPACE',
    items: [
      { to: '/history', label: 'Scan History', icon: 'history' },
      { to: '/vulnerabilities', label: 'Vulnerabilities', icon: 'shield' },
      { to: '/assets', label: 'Managed Assets', icon: 'monitor' },
      { to: '/integrations', label: 'Automations', icon: 'settings' },
      { to: '/remediation', label: 'AI Remediation', icon: 'pulse' },
      { to: '/vault', label: 'Quantum Vault', icon: 'vault' },
      { to: '/breach-checker', label: 'Dark Web Monitor', icon: 'monitor' },
    ]
  },
  {
    title: 'ACCOUNT',
    items: [
      { to: '/team', label: 'Core Team', icon: 'user' },
      { to: '/settings', label: 'Settings', icon: 'settings' },
    ]
  }
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const location = useLocation();
  const { organizations, activeOrgId, activeOrg, switchToPersonal, switchToOrg, isOrgMode } = useOrganization();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [clockTime, setClockTime] = useState('');
  const profileRef = useRef(null);
  const orgDropdownRef = useRef(null);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // Live real-time clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
      setClockTime(now.toLocaleDateString('en-US', options));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(e.target)) {
        setOrgDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout({ redirectTo: '/login' });
  };

  return (
    <div className="flex h-screen bg-cyber-bg text-cyber-text font-mono overflow-hidden selection:bg-cyber-accent/30 selection:text-cyber-accent">
      <CyberTerminal isOpen={terminalOpen} onClose={() => setTerminalOpen(false)} />

      {/* MOBILE HEADER BAR */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 h-16 backdrop-blur-xl border-b z-[60] flex items-center justify-between px-4 transition-colors ${isDark ? 'bg-[#020814]/90 border-white/10' : 'bg-white/90 border-black/10'}`}>
        <Link to="/" className="flex items-center gap-2.5">
          <BrandLogo size={24} />
          <span className="font-display font-black text-sm text-white tracking-widest uppercase">CYBERSHIELD X</span>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyber-accent/15 text-cyber-accent border border-cyber-accent/30 tracking-wider">v33.0.0</span>
        </Link>
        {user && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="p-2.5 bg-cyber-accent/10 border border-cyber-accent/30 rounded-xl text-cyber-accent backdrop-blur-xl shadow-lg hover:bg-cyber-accent/20 transition-all"
          >
            <Icon d={mobileMenuOpen ? ICONS.close : ICONS.menu} size={20} />
          </button>
        )}
      </div>

      {/* MOBILE BACKDROP OVERLAY */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
        />
      )}

      {/* SIDEBAR NAVIGATION (Desktop persistent + Mobile slide-over) */}
      {user && (
        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 flex flex-col backdrop-blur-3xl border-r transition-all duration-300 ease-in-out ${isDark ? 'bg-[#030914]/95 border-white/5 shadow-2xl' : 'bg-white/95 border-black/5'} ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          {/* Logo Brand Header */}
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="p-2 rounded-xl bg-cyber-accent/10 border border-cyber-accent/20 group-hover:border-cyber-accent/50 transition-all shadow-[0_0_15px_rgba(0,212,255,0.15)]">
                <BrandLogo size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-sm font-black tracking-wider text-white group-hover:text-cyber-accent transition-colors">CYBERSHIELD X</h1>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyber-accent/15 text-cyber-accent border border-cyber-accent/30 tracking-wider">v33.0.0</span>
                </div>
                <p className="font-mono text-[8px] text-cyber-accent/80 tracking-[0.25em] uppercase">Security Workspace</p>
              </div>
            </Link>
          </div>

          {/* Workspace Switcher */}
          {organizations.length > 0 && (
            <div className="px-4 pt-3 pb-1" ref={orgDropdownRef}>
              <button
                id="org-switcher-btn"
                onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all duration-200 text-left group ${
                  isOrgMode
                    ? 'bg-cyan-500/10 border-cyan-500/25 hover:border-cyan-500/50'
                    : 'bg-white/[0.03] border-white/5 hover:border-white/20'
                }`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                  isOrgMode
                    ? 'bg-gradient-to-br from-cyan-500/30 to-blue-600/30 text-cyan-300 border border-cyan-500/30'
                    : 'bg-gradient-to-br from-emerald-500/20 to-green-600/20 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {isOrgMode ? (activeOrg?.name?.[0] || 'O').toUpperCase() : '⌂'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[10px] font-bold text-white truncate uppercase tracking-wider">
                    {isOrgMode ? activeOrg?.name : 'Personal Space'}
                  </p>
                </div>
                <Icon d={ICONS.chevDown} size={12} />
              </button>

              <AnimatePresence>
                {orgDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
                    animate={{ opacity: 1, y: 0, scaleY: 1 }}
                    exit={{ opacity: 0, y: -6, scaleY: 0.95 }}
                    className="mt-1.5 py-1.5 bg-[#0a1628] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    <button
                      id="org-switch-personal"
                      onClick={() => { switchToPersonal(); setOrgDropdownOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all hover:bg-white/5 ${
                        !isOrgMode ? 'bg-emerald-500/10 text-emerald-400' : 'text-cyber-muted'
                      }`}
                    >
                      <span className="text-[10px]">⌂</span>
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Personal Space</span>
                    </button>
                    {organizations.map((org) => {
                      const orgId = org._id || org.id;
                      const isActive = activeOrgId === orgId;
                      return (
                        <button
                          key={orgId}
                          onClick={() => { switchToOrg(orgId); setOrgDropdownOpen(false); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all hover:bg-white/5 ${
                            isActive ? 'bg-cyan-500/10 text-cyan-300' : 'text-cyber-muted'
                          }`}
                        >
                          <span className="text-[9px] font-bold">{(org.name?.[0] || 'O').toUpperCase()}</span>
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider truncate">{org.name}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Grouped Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto custom-scrollbar">
            {NAV_GROUPS.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <p className="px-3 text-[8px] font-mono font-bold text-cyber-muted uppercase tracking-[0.25em]">
                  {group.title}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item, idx) => {
                    const isActive = location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
                    return (
                      <Link
                        key={idx}
                        to={item.to}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 group relative ${
                          isActive
                            ? 'bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/25 shadow-[0_0_12px_rgba(0,212,255,0.1)]'
                            : 'text-cyber-muted hover:text-white hover:bg-white/[0.03] border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon d={ICONS[item.icon] || ICONS.dashboard} size={16} />
                          <span className="font-mono text-[11px] font-medium tracking-wider truncate">
                            {item.label}
                          </span>
                        </div>
                        {item.badge && (
                          <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${
                            item.badge === 'LIVE' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-cyber-accent/15 text-cyber-accent border border-cyber-accent/30'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User Profile Footer & Logout */}
          <div className="p-3 border-t border-white/5 space-y-2">
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg overflow-hidden border border-cyber-accent/30 bg-cyber-accent/10 flex items-center justify-center text-[10px] font-bold text-cyber-accent">
                  {(user?.username?.[0] || 'U').toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] font-bold text-white truncate uppercase">{user?.username || 'Operator'}</p>
                  <p className="font-mono text-[8px] text-cyber-accent truncate tracking-wider">Level 4 Operator</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                aria-label="Logout"
                className="p-1.5 text-cyber-muted hover:text-cyber-red hover:bg-cyber-red/10 rounded-lg transition-colors"
              >
                <Icon d={ICONS.logout} size={15} />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Bar */}
        {user && (
          <header className={`h-14 flex items-center justify-between px-6 border-b backdrop-blur-xl z-30 transition-colors ${isDark ? 'border-white/5 bg-[#020814]/80' : 'border-black/5 bg-white/80'}`}>
            {/* Left: Section Path / Status */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-[10px] font-bold text-cyber-muted uppercase tracking-widest hidden sm:inline">CYBERSHIELD X SOC • 110 MODELS ACTIVE</span>
              </div>
            </div>

            {/* Right: Live Clock, Ticker & Profile */}
            <div className="flex items-center gap-4">
              {clockTime && (
                <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-cyber-muted bg-white/[0.02] border border-white/5 px-2.5 py-1 rounded-lg">
                  <span className="text-cyber-accent">⏱</span>
                  <span>{clockTime}</span>
                </div>
              )}

              <NotificationCenter />
              <NetworkStatusHUD />

              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  aria-label="Open profile menu"
                  className="flex items-center gap-2 px-2 py-1 rounded-xl border border-white/10 hover:border-cyber-accent/40 bg-white/[0.02] transition-all"
                >
                  <div className="w-6 h-6 rounded-lg bg-cyber-accent/20 border border-cyber-accent/40 flex items-center justify-center text-[10px] font-bold text-cyber-accent">
                    {(user?.username?.[0] || 'U').toUpperCase()}
                  </div>
                  <span className="font-mono text-[10px] text-white hidden sm:inline uppercase">{user.username}</span>
                  <Icon d={ICONS.chevDown} size={10} />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className={`absolute top-full right-0 mt-2 w-56 bg-[#0a1424] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl z-[100]`}
                    >
                      <div className="p-3 border-b border-white/5 bg-white/[0.02]">
                        <p className="text-xs font-bold text-cyber-accent uppercase tracking-wider">{user.username}</p>
                        <p className="text-[9px] text-cyber-muted truncate">{user.email || 'operator@cybershieldx.in'}</p>
                      </div>
                      <div className="p-1.5 flex flex-col gap-0.5">
                        <Link to="/settings" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-cyber-muted hover:text-white hover:bg-white/5 transition-colors">
                          <Icon d={ICONS.user} size={14} /> Profile & Settings
                        </Link>
                        <Link to="/history" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-cyber-muted hover:text-white hover:bg-white/5 transition-colors">
                          <Icon d={ICONS.history} size={14} /> Scan History
                        </Link>
                        <button
                          onClick={toggleTheme}
                          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-cyber-muted hover:text-white hover:bg-white/5 transition-colors w-full text-left"
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon d={isDark ? ICONS.sun : ICONS.moon} size={14} />
                            <span>Theme</span>
                          </div>
                          <span className="text-[9px] font-bold text-cyber-accent uppercase">{isDark ? 'Dark' : 'Light'}</span>
                        </button>
                        <div className="my-1 border-t border-white/5" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-cyber-red/90 hover:bg-cyber-red/10 transition-colors w-full text-left"
                        >
                          <Icon d={ICONS.logout} size={14} /> Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>
        )}

        {/* Scrollable Main Viewport */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

