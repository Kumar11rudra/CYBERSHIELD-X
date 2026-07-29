import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../context/ThemeContext';
import { Icon, ICONS } from '../icons';

/**
 * UserDropdown Component
 * Renders the operator profile menu dropover widget.
 */
export default function UserDropdown({ user, profileOpen, setProfileOpen, profileRef, onLogout }) {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  if (!user) return null;

  return (
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
            className={`absolute top-full right-0 mt-3 w-64 bg-cyber-card border rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl z-[100] transition-colors ${
              isDark ? 'border-white/10' : 'border-black/5'
            }`}
          >
            <div
              className={`p-4 border-b transition-colors ${
                isDark ? 'border-white/5 bg-white/5' : 'border-black/5 bg-black/5'
              }`}
            >
              <p className="text-xs font-bold text-cyber-accent uppercase tracking-widest">
                {user.username}
              </p>
              <p className="text-[10px] text-cyber-muted truncate">{user.email}</p>
            </div>
            <div className="p-2 flex flex-col gap-1">
              <Link
                to="/settings"
                onClick={() => setProfileOpen(false)}
                className={`flex items-center gap-3 p-2 rounded-lg text-xs transition-colors ${
                  isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
                }`}
              >
                <Icon d={ICONS.user} /> {t('navigation.myProfile')}
              </Link>
              <Link
                to="/history"
                onClick={() => setProfileOpen(false)}
                className={`flex items-center gap-3 p-2 rounded-lg text-xs transition-colors ${
                  isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
                }`}
              >
                <Icon d={ICONS.history} /> {t('navigation.scanHistory')}
              </Link>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  onLogout();
                }}
                className="flex items-center gap-3 p-2 rounded-lg text-xs text-cyber-red/80 hover:bg-cyber-red/10 transition-colors w-full"
              >
                <Icon d={ICONS.logout} /> {t('navigation.logout')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
