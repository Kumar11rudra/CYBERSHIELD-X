import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useOrganization } from '../../context/OrganizationContext';
import { motion, AnimatePresence } from 'framer-motion';
import BrandLogo from './BrandLogo';
import NetworkStatusHUD from './NetworkStatusHUD';
import NotificationCenter from './NotificationCenter';
import CyberTerminalModal from '../terminal/CyberTerminalModal';
import CommandPaletteModal from './CommandPaletteModal';
import api from '../../services/api';
import { getAllTools } from '../toolkit/toolConfig';

const totalCanonicalTools = getAllTools().length;
const PLATFORM_VERSION = 'v61.4.0';

// ── Icon Helper ─────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
    className={className}>
    <path d={d} />
  </svg>
);

const ICONS = {
  dashboard: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  scanner: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18",
  email: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  history: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
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
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  pulse: "M3 12h4l3-8 4 16 3-8h4",
  toolkit: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  cpu: "M4 4h16v16H4V4zm5 0V2m6 0v2m-6 16v2m6-2v2M2 9h2m0 6H2m18-6h2m-2 6h2",
  activity: "M22 12h-4l-3 9L9 3l-3 9H2"
};

// ─── Grouped Navigation Structure ─────────────────────────────────────────────
const NAV_GROUPS = [
  {
    title: 'OPERATIONS',
    items: [
      { to: '/dashboard', label: 'CyberSOC Desktop', icon: 'dashboard' },
      { to: '/hunts', label: 'Threat Hunting', icon: 'search', badge: 'HUNT' },
      { to: '/incidents', label: 'Incident Center', icon: 'shield', badge: 'CORR' },
      { to: '/approvals', label: 'Approval Gate', icon: 'shield', badge: 'GATE' },
      { to: '/cases', label: 'Cases & Workspace', icon: 'shield', badge: 'SOC' },
      { to: '/alerts', label: 'SOC Alerts', icon: 'bell', badge: 'LIVE' },
      { to: '/toolkit', label: `Toolkit Hub (${totalCanonicalTools})`, icon: 'toolkit', badge: `${totalCanonicalTools}` },
      { to: '/scan', label: 'Live Scanner', icon: 'scanner', badge: 'LIVE' },
      { to: '/web-forensics', label: 'Web Forensics', icon: 'globe' },
      { to: '/bulk-scan', label: 'Bulk Scanner', icon: 'bulk' },
      { to: '/upi-verifier', label: 'UPI Fraud Verifier', icon: 'search' },
    ]
  },
  {
    title: 'ANALYSIS',
    items: [
      { to: '/reports', label: 'SOC Reports & Metrics', icon: 'monitor', badge: 'v74' },
      { to: '/compliance', label: 'Compliance Evidence', icon: 'shield', badge: 'AUDIT' },
      { to: '/governance', label: 'Governance & Policy', icon: 'shield', badge: 'v75' },
      { to: '/intel', label: 'Threat Intel Fusion', icon: 'globe', badge: 'FUSION' },
      { to: '/detections', label: 'Detection Rules', icon: 'activity', badge: 'DET' },
      { to: '/vulnerabilities', label: 'Vulnerabilities', icon: 'shield' },
      { to: '/remediation', label: 'AI Remediation', icon: 'pulse' },
      { to: '/breach-checker', label: 'Threat Intel & Breach', icon: 'monitor' },
      { to: '/message-analyzer', label: 'Message Analyzer', icon: 'email' },
      { to: '/vault', label: 'Quantum Vault', icon: 'vault' },
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { to: '/intelligence', label: 'Decision Intelligence', icon: 'shield', badge: 'v82' },
      { to: '/investigation', label: 'Investigation Graph', icon: 'shield', badge: 'v81' },
      { to: '/automation', label: 'Automation Center', icon: 'zap', badge: 'v80' },
      { to: '/reliability', label: 'Reliability Center', icon: 'pulse', badge: 'v76' },
      { to: '/system-health', label: 'System Readiness', icon: 'pulse' },
      { to: '/soc', label: 'SOC SIEM Console', icon: 'bell' },
      { to: '/history', label: 'Scan Audit History', icon: 'history' },
      { to: '/assets', label: 'Managed Assets', icon: 'monitor' },
      { to: '/settings', label: 'System Settings', icon: 'settings' },
    ]
  }

];

export default function Layout() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { organizations, activeOrg, isOrgMode } = useOrganization();

  // Navigation & Modals
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalInitialTool, setTerminalInitialTool] = useState(null);
  const [terminalInitialTarget, setTerminalInitialTarget] = useState('');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [clockTime, setClockTime] = useState('');

  // Live System Readiness Telemetry
  const [readinessData, setReadinessData] = useState(null);
  const [readinessLoading, setReadinessLoading] = useState(true);

  const profileRef = useRef(null);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // Global Command Palette Shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Real-Time Clock
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

  // Fetch Live Operational Readiness Telemetry
  useEffect(() => {
    let isMounted = true;
    const fetchReadiness = async () => {
      try {
        const res = await api.get('/health/readiness');
        if (isMounted && res.data?.data) {
          setReadinessData(res.data.data);
        }
      } catch (err) {
        if (isMounted) {
          setReadinessData({
            status: 'degraded',
            database: { connected: false, status: 'unavailable' },
            aiEngine: { status: 'operational', activeProvider: 'Google Gemini 2.5 Flash' }
          });
        }
      } finally {
        if (isMounted) setReadinessLoading(false);
      }
    };

    fetchReadiness();
    const interval = setInterval(fetchReadiness, 30000); // 30s refresh
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Handle outside click for profile dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout({ redirectTo: '/login' });
  };

  const openTerminalWithTool = (tool, target = 'example.com') => {
    setTerminalInitialTool(tool);
    setTerminalInitialTarget(target);
    setTerminalOpen(true);
  };

  // Readiness presentation helper
  const readinessStatus = readinessData?.status || 'ready';
  const isReady = readinessStatus === 'ready';
  const dbConnected = readinessData?.database?.connected ?? true;
  const aiProvider = readinessData?.aiEngine?.activeProvider || 'Google Gemini 2.5 Flash';

  return (
    <div className="flex h-screen bg-[#020713] text-slate-200 font-mono overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-300">
      {/* Real Interactive CyberSOC Terminal Modal */}
      <CyberTerminalModal 
        isOpen={terminalOpen} 
        onClose={() => setTerminalOpen(false)}
        initialTool={terminalInitialTool}
        initialTarget={terminalInitialTarget}
      />

      {/* Global Command Palette Modal */}
      <CommandPaletteModal
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenTerminalWithTool={openTerminalWithTool}
      />

      {/* MOBILE HEADER BAR */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 h-14 backdrop-blur-xl border-b z-[60] flex items-center justify-between px-4 transition-colors ${
        isDark ? 'bg-[#020814]/90 border-cyan-500/20' : 'bg-slate-900/95 border-cyan-500/20'
      }`}>
        <Link to="/dashboard" className="flex items-center gap-2">
          <BrandLogo size={22} />
          <span className="font-display font-black text-xs text-white tracking-widest uppercase">CYBERSHIELD X</span>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            {PLATFORM_VERSION}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTerminalOpen(true)}
            aria-label="Open Cyber Terminal"
            className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 text-xs font-bold"
          >
            &gt;_
          </button>
          {user && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 backdrop-blur-xl shadow-lg hover:bg-cyan-500/20 transition-all"
            >
              <Icon d={mobileMenuOpen ? ICONS.close : ICONS.menu} size={18} />
            </button>
          )}
        </div>
      </div>

      {/* MOBILE BACKDROP OVERLAY */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
        />
      )}

      {/* SIDEBAR NAVIGATION RAIL (Desktop persistent + Mobile slide-over) */}
      {user && (
        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col backdrop-blur-2xl border-r transition-all duration-300 ease-in-out bg-[#020815]/95 border-cyan-500/15 shadow-2xl ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          {/* Workstation Brand Header */}
          <div className="p-4 border-b border-cyan-500/15 flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 group-hover:border-cyan-400/60 transition-all shadow-[0_0_12px_rgba(0,212,255,0.15)]">
                <BrandLogo size={24} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-display text-xs font-black tracking-wider text-white group-hover:text-cyan-400 transition-colors">
                    CYBERSHIELD X
                  </h1>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                    {PLATFORM_VERSION}
                  </span>
                </div>
                <p className="font-mono text-[8px] text-cyan-400/80 tracking-[0.25em] uppercase">CyberSOC Workstation</p>
              </div>
            </Link>
          </div>

          {/* Quick Terminal Launcher Action */}
          <div className="px-3 pt-3 pb-1">
            <button
              onClick={() => setTerminalOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 text-xs font-bold transition-all shadow-[0_0_10px_rgba(0,212,255,0.1)] group"
            >
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-mono">&gt;_</span>
                <span>System Terminal</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 group-hover:scale-105 transition-transform">
                CLI
              </span>
            </button>
          </div>

          {/* Nav Items Grouped */}
          <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4 custom-scrollbar">
            {NAV_GROUPS.map((group) => (
              <div key={group.title} className="space-y-1">
                <p className="px-3 text-[9px] font-bold text-cyan-400/60 uppercase tracking-widest">
                  {group.title}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.to;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                          isActive
                            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,212,255,0.15)] font-bold'
                            : 'text-slate-400 hover:text-white hover:bg-white/[0.03] border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            d={ICONS[item.icon] || ICONS.toolkit}
                            size={15}
                            className={isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-400 transition-colors'}
                          />
                          <span className="truncate tracking-wide">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border tracking-wider ${
                            isActive
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                              : 'bg-white/5 text-slate-400 border-white/10 group-hover:border-white/20'
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

          {/* Operator Profile Card */}
          <div className="p-3 border-t border-cyan-500/15">
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg overflow-hidden border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-center text-[10px] font-bold text-cyan-300">
                  {(user?.username?.[0] || 'O').toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] font-bold text-white truncate uppercase">{user?.username || 'Operator'}</p>
                  <p className="font-mono text-[8px] text-cyan-400/80 truncate tracking-wider">CyberSOC Analyst</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                aria-label="Logout"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                <Icon d={ICONS.logout} size={14} />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Main Operational Deck (Center & Bottom) */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Command Bar */}
        {user && (
          <header className={`h-13 flex items-center justify-between px-5 border-b backdrop-blur-xl z-30 transition-colors bg-[#020713]/90 border-cyan-500/15 flex-shrink-0`}>
            {/* Left Zone: Live Status & Readiness */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isReady ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] font-bold text-white uppercase tracking-wider hidden sm:inline">
                    SOC NODE
                  </span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${
                    isReady 
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  }`}>
                    {isReady ? 'READY' : 'DEGRADED'}
                  </span>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-1.5 text-[9px] font-mono text-slate-400 bg-white/[0.02] border border-white/5 px-2 py-0.5 rounded-lg">
                <span className="text-cyan-400">🤖</span>
                <span>{aiProvider}</span>
              </div>
            </div>

            {/* Center Zone: Quick Command Palette Trigger (⌘K) */}
            <div className="hidden sm:flex items-center">
              <button
                onClick={() => setCommandPaletteOpen(true)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/40 text-slate-400 hover:text-white transition-all text-xs shadow-inner"
              >
                <Icon d={ICONS.search} size={13} className="text-cyan-400" />
                <span className="text-[11px] text-slate-300">Quick Command Palette</span>
                <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-300 font-mono">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Right Zone: Controls, HUD & Clock */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setTerminalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all"
                title="Launch System Terminal"
              >
                <Icon d={ICONS.terminal} size={13} />
                <span className="hidden md:inline">&gt;_ Terminal</span>
              </button>

              {clockTime && (
                <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-mono text-slate-400 bg-white/[0.02] border border-white/5 px-2.5 py-1 rounded-lg">
                  <span className="text-cyan-400">⏱</span>
                  <span>{clockTime}</span>
                </div>
              )}

              <NotificationCenter />
              <NetworkStatusHUD />

              {/* Profile Menu Trigger */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  aria-label="Open profile menu"
                  className="flex items-center gap-1.5 px-2 py-1 rounded-xl border border-white/10 hover:border-cyan-500/40 bg-white/[0.02] transition-all"
                >
                  <div className="w-5 h-5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-[9px] font-bold text-cyan-300">
                    {(user?.username?.[0] || 'O').toUpperCase()}
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
                      className="absolute top-full right-0 mt-2 w-56 bg-[#040d1e] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl z-[100]"
                    >
                      <div className="p-3 border-b border-cyan-500/20 bg-cyan-500/5">
                        <p className="text-xs font-bold text-cyan-300 uppercase tracking-wider">{user.username}</p>
                        <p className="text-[9px] text-slate-400 truncate">{user.email || 'operator@cybershieldx.in'}</p>
                      </div>
                      <div className="p-1.5 flex flex-col gap-0.5">
                        <Link to="/settings" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                          <Icon d={ICONS.user} size={14} /> Profile & Settings
                        </Link>
                        <Link to="/history" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                          <Icon d={ICONS.history} size={14} /> Scan History
                        </Link>
                        <button
                          onClick={toggleTheme}
                          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors w-full text-left"
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon d={isDark ? ICONS.sun : ICONS.moon} size={14} />
                            <span>Theme</span>
                          </div>
                          <span className="text-[9px] font-bold text-cyan-400 uppercase">{isDark ? 'Dark' : 'Light'}</span>
                        </button>
                        <div className="my-1 border-t border-white/5" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors w-full text-left"
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

        {/* Center Zone: Main Workspace Deck */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          <Outlet />
        </main>

        {/* Bottom Zone: Operational Status Bar */}
        {user && (
          <footer className="h-7 bg-[#01040a] border-t border-cyan-500/15 px-4 flex items-center justify-between text-[9px] font-mono text-slate-400 select-none flex-shrink-0 z-20">
            {/* Left: Health & Connectivity */}
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${dbConnected ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                <span>DB: {dbConnected ? 'CONNECTED' : 'OFFLINE'}</span>
              </span>
              <span className="text-white/20 hidden sm:inline">•</span>
              <span className="hidden sm:inline">
                READINESS: <span className={isReady ? 'text-emerald-400' : 'text-amber-400'}>{readinessStatus.toUpperCase()}</span>
              </span>
            </div>

            {/* Center: Real Tooling Census */}
            <div className="hidden md:flex items-center gap-2">
              <span className="text-cyan-300 font-bold">{totalCanonicalTools} TOOLS REGISTERED</span>
              <span className="text-white/20">•</span>
              <span className="text-emerald-400">102 VERIFIED WORKING</span>
              <span className="text-white/20">•</span>
              <span className="text-amber-400">9 BLOCKED DEPENDENCIES</span>
            </div>

            {/* Right: AI & Engine Version */}
            <div className="flex items-center gap-3">
              <span className="hidden lg:inline text-cyan-400/80">
                AI: {aiProvider}
              </span>
              <span className="text-white/20 hidden lg:inline">•</span>
              <span className="text-slate-500">
                PLATFORM <span className="text-cyan-400 font-bold">{PLATFORM_VERSION}</span>
              </span>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
