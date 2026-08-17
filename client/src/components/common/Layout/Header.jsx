import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import NotificationCenter from '../NotificationCenter';
import NetworkStatusHUD from '../NetworkStatusHUD';
import UserDropdown from './sub-components/UserDropdown';
import ThreatTicker from './sub-components/ThreatTicker';

/**
 * Header Component
 * Top page navbar containing notifications, status HUD, and user dropover menus.
 */
export default function Header({
  user,
  profileOpen,
  setProfileOpen,
  profileRef,
  onLogout,
}) {
  const { isDark } = useTheme();

  return (
    <header
      className="h-16 flex items-center justify-between px-6 border-b border-cyber-border/10 backdrop-blur-xl bg-cyber-surface/40 z-30 transition-colors"
    >
      <div className="flex-1 flex items-center gap-4 overflow-hidden">
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-cyber-accent/5 border border-cyber-accent/20 text-cyber-accent text-[11px] font-mono shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-bold tracking-wider">v33.0.0</span>
        </div>
        <ThreatTicker />
      </div>

      <div className="flex items-center gap-4 ml-6">
        <NotificationCenter />
        <NetworkStatusHUD />

        {/* Profile Dropdown */}
        <UserDropdown
          user={user}
          profileOpen={profileOpen}
          setProfileOpen={setProfileOpen}
          profileRef={profileRef}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
}
