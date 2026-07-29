import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../context/ThemeContext';
import BrandLogo from '../BrandLogo';
import { Icon, ICONS } from './icons';
import WorkspaceSwitcher from './sub-components/WorkspaceSwitcher';

const getNavItems = (t) => [
  { to: '/dashboard', label: t('navigation.dashboard'), icon: 'dashboard' },
  { to: '/soc', label: t('navigation.soc') || 'SOC SIEM Command', icon: 'bell' },
  { to: '/system-health', label: 'System Health', icon: 'pulse' },
  { to: '/assets', label: t('navigation.assets') || 'Managed Assets', icon: 'monitor' },
  { to: '/vulnerabilities', label: 'Vulnerability Management', icon: 'shield' },
  { to: '/integrations', label: 'Security Automation', icon: 'settings' },
  { to: '/remediation', label: 'AI Remediation', icon: 'pulse' },
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

/**
 * Sidebar Component
 * Left pane sidebar panel for operators dashboard links.
 */
export default function Sidebar({
  user,
  mobileMenuOpen,
  setMobileMenuOpen,
  orgDropdownOpen,
  setOrgDropdownOpen,
  orgDropdownRef,
  onLogout,
}) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const location = useLocation();
  const navItems = getNavItems(t);

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-50 w-72 flex flex-col backdrop-blur-3xl border-r transition-all duration-500 ease-cyber ${
        isDark ? 'bg-cyber-surface/90 border-cyber-border/10' : 'bg-cyber-surface/90 border-cyber-border/10'
      } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
    >
      <div className="p-8 border-b border-cyber-border/10">
        <Link to="/" className="flex items-center gap-4 group">
          <div className="p-3 rounded-2xl bg-cyber-accent/10 border border-cyber-accent/20 group-hover:border-cyber-accent/50 transition-all shadow-[0_0_20px_rgba(0,71,65,0.15)]">
            <BrandLogo size={32} />
          </div>
          <div>
            <h1 className="font-display text-lg font-black tracking-tighter text-cyber-text group-hover:text-cyber-accent transition-colors">
              NEXUS
            </h1>
            <p className="font-mono text-[9px] text-cyber-muted tracking-[0.3em] uppercase">
              Security Hub
            </p>
          </div>
        </Link>
      </div>

      {/* Workspace Switcher */}
      <WorkspaceSwitcher
        orgDropdownOpen={orgDropdownOpen}
        setOrgDropdownOpen={setOrgDropdownOpen}
        orgDropdownRef={orgDropdownRef}
      />

      <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item, idx) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={idx}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                isActive
                  ? 'bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/20 shadow-[0_0_15px_rgba(0,71,65,0.1)]'
                  : 'text-cyber-muted hover:text-cyber-text hover:bg-cyber-primary/5 border border-transparent'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-cyber-accent rounded-r-full"
                />
              )}
              <Icon d={ICONS[item.icon]} size={22} />
              <span className="font-mono text-[11px] font-bold uppercase tracking-widest">
                {item.label}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyber-accent/0 to-cyber-accent/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-cyber-border/10 space-y-6">
        <div className="space-y-3 px-2">
          <div className="flex justify-between items-center">
            <span className="font-mono text-[9px] text-cyber-muted uppercase tracking-widest">
              Network Link
            </span>
            <span className="text-[10px] text-cyber-green animate-pulse">ESTABLISHED</span>
          </div>
          <div className="h-[2px] w-full bg-cyber-primary/10 rounded-full overflow-hidden">
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="w-1/2 h-full bg-gradient-to-r from-transparent via-cyber-accent to-transparent"
            />
          </div>
        </div>

        {user ? (
          <div className="flex items-center gap-4 p-3 bg-cyber-primary/5 border border-cyber-border/10 rounded-2xl group hover:border-cyber-accent/30 transition-all">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-cyber-border/10 group-hover:border-cyber-accent/50 transition-all">
              <img src="/bot-avatar.png" alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[11px] font-black text-cyber-text truncate uppercase">
                {user.username}
              </p>
              <p className="font-mono text-[8px] text-cyber-muted uppercase tracking-tighter">
                Level 4 Operator
              </p>
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-cyber-muted hover:text-cyber-red transition-colors"
            >
              <Icon d={ICONS.logout} size={18} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 p-2 bg-[#004741]/5 border border-[#004741]/20 rounded-2xl">
            <Link
              to="/login"
              className="text-center py-2.5 bg-cyber-accent text-cyber-bg font-bold text-xs uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-transform"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="text-center py-2 bg-transparent text-cyber-accent font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-cyber-primary/5 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
