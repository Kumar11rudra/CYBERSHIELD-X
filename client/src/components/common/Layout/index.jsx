import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import CyberTerminal from '../CyberTerminal';
import BrandLogo from '../BrandLogo';
import { Icon, ICONS } from './icons';

// Sub-components
import Sidebar from './Sidebar';
import Header from './Header';

/**
 * Layout Component
 * Main template frame coordinator for CyberShield X.
 */
export default function Layout() {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);

  const profileRef = useRef(null);
  const orgDropdownRef = useRef(null);

  // Click outside to close menus
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

  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <div className="flex h-screen bg-cyber-bg text-cyber-text font-mono overflow-hidden selection:bg-cyber-accent/30 selection:text-cyber-accent">
      <CyberTerminal isOpen={terminalOpen} onClose={() => setTerminalOpen(false)} />

      {/* MOBILE HEADER BAR */}
      <div
        className={`lg:hidden fixed top-0 left-0 right-0 h-16 backdrop-blur-xl border-b z-[60] flex items-center justify-between px-4 transition-colors ${
          isDark ? 'bg-[#020814]/80 border-white/5' : 'bg-white/80 border-black/5'
        }`}
      >
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

      {/* Persistent Sidebar */}
      {user && !isDashboard && (
        <Sidebar
          user={user}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          orgDropdownOpen={orgDropdownOpen}
          setOrgDropdownOpen={setOrgDropdownOpen}
          orgDropdownRef={orgDropdownRef}
          onLogout={handleLogout}
        />
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar Header */}
        {!isDashboard && (
          <Header
            user={user}
            profileOpen={profileOpen}
            setProfileOpen={setProfileOpen}
            profileRef={profileRef}
            onLogout={handleLogout}
          />
        )}

        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
