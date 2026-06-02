import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
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
  '⚡ VirusTotal: 2.3M new IOCs detected in last 24h',
  '🛡 AbuseIPDB: 14,000+ IPs reported for DDoS activity today',
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
  hash: "M7 20l4-16m2 16l4-16M6 9h14M4 15h14",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  phone: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
  lock: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  pulse: "M3 12h4l3-8 4 16 3-8h4",
  toolkit: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
};

const getNavItems = (t) => [
  { to: '/dashboard', label: t('navigation.dashboard'), icon: 'dashboard' },
  { to: '/toolkit', label: t('navigation.toolkit'), icon: 'toolkit' },
  { to: '/scan', label: t('navigation.liveScanner'), icon: 'scanner' },
  { to: '/bulk-scan', label: t('navigation.bulkScanner'), icon: 'bulk' },
  { to: '/message-analyzer', label: t('navigation.messageAnalyzer'), icon: 'email' },
  { to: '/web-forensics', label: t('navigation.webForensics'), icon: 'globe' },
  { to: '/vault', label: t('navigation.quantumVault'), icon: 'vault' },
  { to: '/breach-checker', label: t('navigation.darkWebMonitor'), icon: 'monitor' },
  { to: '/upi-verifier', label: t('navigation.upiVerifier'), icon: 'search' },
  { to: '/qr-scanner', label: t('navigation.qrScanner'), icon: 'qrcode' },
  { to: '/api-limits', label: t('navigation.apiRateLimits'), icon: 'pulse' },
  { to: '/history', label: t('navigation.scanHistory'), icon: 'history' },
  { to: '/security', label: t('navigation.securityPosture'), icon: 'shield' },
  { to: '/membership', label: t('navigation.membership'), icon: 'shield' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const navItems = getNavItems(t);

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

  return (
    <div className="flex h-screen bg-cyber-bg text-cyber-text font-mono overflow-hidden selection:bg-cyber-accent/30 selection:text-cyber-accent">
      <CyberTerminal isOpen={terminalOpen} onClose={() => setTerminalOpen(false)} />

      {/* MOBILE HEADER BAR */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 h-16 backdrop-blur-xl border-b z-[60] flex items-center justify-between px-4 transition-colors ${isDark ? 'bg-[#020814]/80 border-white/5' : 'bg-white/80 border-black/5'}`}>
        <BrandLogo size={24} />
        {user && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-3 bg-cyber-accent/10 border border-cyber-accent/30 rounded-xl text-cyber-accent backdrop-blur-xl shadow-lg hover:bg-cyber-accent/20 transition-all"
          >
            <Icon d={mobileMenuOpen ? ICONS.close : ICONS.menu} size={24} />
          </button>
        )}
      </div>

      {/* Persistent Sidebar (Hidden on Dashboard for AI-First Mode) */}
      {user && !location.pathname.startsWith('/dashboard') && (
        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 flex flex-col backdrop-blur-3xl border-r transition-all duration-500 ease-cyber ${isDark ? 'bg-[#020814]/90 border-white/5' : 'bg-white/90 border-black/5'} ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-8 border-b border-white/5">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="p-3 rounded-2xl bg-cyber-accent/10 border border-cyber-accent/20 group-hover:border-cyber-accent/50 transition-all shadow-[0_0_20px_rgba(0,212,255,0.2)]">
              <BrandLogo size={32} />
            </div>
            <div>
              <h1 className="font-display text-lg font-black tracking-tighter text-white group-hover:text-cyber-accent transition-colors">NEXUS</h1>
              <p className="font-mono text-[9px] text-cyber-muted tracking-[0.3em] uppercase">Security Hub</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item, idx) => (
            <Link
              key={idx}
              to={item.to}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${location.pathname === item.to ? 'bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/20 shadow-[0_0_15px_rgba(0,212,255,0.1)]' : 'text-cyber-muted hover:text-white hover:bg-white/[0.03] border border-transparent'}`}
            >
              {/* Active Indicator Line */}
              {location.pathname === item.to && (
                <motion.div layoutId="activeNav" className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-cyber-accent rounded-r-full" />
              )}
              
              <Icon d={ICONS[item.icon]} size={22} />
              <span className="font-mono text-[11px] font-bold uppercase tracking-widest">{item.label}</span>
              
              {/* Subtle hover glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyber-accent/0 to-cyber-accent/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 space-y-6">
          {/* HUD Status */}
          <div className="space-y-3 px-2">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[9px] text-cyber-muted uppercase tracking-widest">Network Link</span>
              <span className="text-[10px] text-cyber-green animate-pulse">ESTABLISHED</span>
            </div>
            <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div animate={{ x: ['-100%', '100%'] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="w-1/2 h-full bg-gradient-to-r from-transparent via-cyber-accent to-transparent" />
            </div>
          </div>

          {/* User Section */}
          {user ? (
            <div className="flex items-center gap-4 p-3 bg-white/[0.03] border border-white/5 rounded-2xl group hover:border-cyber-accent/30 transition-all">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 group-hover:border-cyber-accent/50 transition-all">
                <img src="/bot-avatar.png" alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[11px] font-black text-white truncate uppercase">{user?.username}</p>
                <p className="font-mono text-[8px] text-cyber-muted uppercase tracking-tighter">Level 4 Operator</p>
              </div>
              <button onClick={handleLogout} className="p-2 text-cyber-muted hover:text-cyber-red transition-colors">
                <Icon d={ICONS.logout} size={18} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 p-2 bg-[#00bfff]/5 border border-[#00bfff]/20 rounded-2xl">
              <Link to="/login" className="text-center py-2.5 bg-cyber-accent text-[#020814] font-bold text-xs uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-transform">
                Operator Sign In
              </Link>
              <Link to="/signup" className="text-center py-2 bg-transparent text-cyber-accent font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-white/5 transition-colors">
                Create Account
              </Link>
            </div>
          )}
        </div>
      </aside>
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {!location.pathname.startsWith('/dashboard') && (
        <header className={`h-16 flex items-center justify-between px-6 border-b backdrop-blur-xl z-30 transition-colors ${isDark ? 'border-white/5 bg-black/20' : 'border-black/5 bg-white/40'}`}>
          <div className="flex-1 flex items-center gap-6 overflow-hidden">
            <div className="threat-ticker-track flex gap-8 whitespace-nowrap text-[10px] font-mono text-cyber-muted uppercase tracking-widest italic opacity-50">
              {[...TICKER, ...TICKER].map((t, i) => <span key={i}>{t}</span>)}
            </div>
          </div>

          <div className="flex items-center gap-4 ml-6">
            <NotificationCenter />
            <NetworkStatusHUD />

            {/* Profile Dropdown */}
            {user && (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="w-10 h-10 rounded-xl border border-white/10 overflow-hidden hover:border-cyber-accent/50 transition-all focus:ring-2 focus:ring-cyber-accent/20"
                >
                  <img
                    src={`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${user.username}`}
                    alt="Avatar"
                  />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className={`absolute top-full right-0 mt-3 w-64 bg-cyber-card border rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl z-[100] transition-colors ${isDark ? 'border-white/10' : 'border-black/5'}`}
                    >
                      <div className={`p-4 border-b transition-colors ${isDark ? 'border-white/5 bg-white/5' : 'border-black/5 bg-black/5'}`}>
                        <p className="text-xs font-bold text-cyber-accent uppercase tracking-widest">{user.username}</p>
                        <p className="text-[10px] text-cyber-muted truncate">{user.email}</p>
                      </div>
                      <div className="p-2 flex flex-col gap-1">
                        <Link to="/settings" className={`flex items-center gap-3 p-2 rounded-lg text-xs transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}><Icon d={ICONS.user} /> {t('navigation.myProfile')}</Link>
                        <Link to="/history" className={`flex items-center gap-3 p-2 rounded-lg text-xs transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}><Icon d={ICONS.history} /> {t('navigation.scanHistory')}</Link>
                        <button onClick={handleLogout} className="flex items-center gap-3 p-2 rounded-lg text-xs text-cyber-red/80 hover:bg-cyber-red/10 transition-colors w-full"><Icon d={ICONS.logout} /> {t('navigation.logout')}</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </header>
        )}

        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
