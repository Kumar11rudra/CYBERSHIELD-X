import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

const ACTION_ICONS = {
  LOGIN: '🔑',
  LOGOUT: '🚪',
  SCAN: '🔍',
  LOGIN_ACCOUNT_LOCKED: '🔒',
  LOGIN_BLOCKED_LOCKOUT: '⛔',
  '2FA_ENABLED': '🛡️',
  '2FA_DISABLED': '⚠️',
  SIGNUP: '👤',
  DEFAULT: '📋',
};

const ACTION_COLORS = {
  LOGIN_ACCOUNT_LOCKED: 'text-red-400',
  LOGIN_BLOCKED_LOCKOUT: 'text-red-400',
  '2FA_DISABLED': 'text-yellow-400',
  LOGIN: 'text-green-400',
  DEFAULT: 'text-cyber-muted',
};

function timeAgo(date) {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [seen, setSeen] = useState(() => parseInt(localStorage.getItem('notif_seen') || '0'));
  const ref = useRef();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchLogs = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await api.get('/auth/activity?page=1&limit=15');
      setLogs(res.data.logs || []);
      setTotal(res.data.pagination?.total || 0);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    const newState = !open;
    setOpen(newState);
    if (newState) {
      fetchLogs();
      setSeen(total);
      localStorage.setItem('notif_seen', String(total));
    }
  };

  const unread = Math.max(0, total - seen);

  return (
    <div className="relative" ref={ref}>
      {/* Bell Button */}
      <button
        id="notification-bell"
        onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
        aria-label="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className="text-cyber-muted hover:text-white transition-colors">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center font-mono text-[9px] text-white font-bold"
          >
            {unread > 9 ? '9+' : unread}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 w-80 bg-[#0a0f1a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <span className="font-mono text-xs font-bold text-white uppercase tracking-widest">Activity Log</span>
              <span className="font-mono text-[10px] text-cyber-muted">{total} total</span>
            </div>

            {/* Log List */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-cyber-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : logs.length === 0 ? (
                <div className="py-8 text-center font-mono text-xs text-cyber-muted">No activity yet</div>
              ) : (
                logs.map((log, i) => {
                  const icon = ACTION_ICONS[log.action] || ACTION_ICONS.DEFAULT;
                  const color = ACTION_COLORS[log.action] || ACTION_COLORS.DEFAULT;
                  return (
                    <div key={log._id || i} className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                      <span className="text-base mt-0.5">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-mono text-[11px] font-bold uppercase tracking-wide ${color}`}>
                          {log.action?.replace(/_/g, ' ')}
                        </p>
                        {log.metadata?.ip && (
                          <p className="font-mono text-[10px] text-cyber-muted truncate">
                            {log.metadata.ip}
                            {log.metadata.location?.city ? ` · ${log.metadata.location.city}` : ''}
                          </p>
                        )}
                      </div>
                      <span className="font-mono text-[9px] text-white/30 whitespace-nowrap">
                        {timeAgo(log.timestamp || log.createdAt)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-white/5">
              <a href="/history" className="font-mono text-[10px] text-cyber-accent hover:underline uppercase tracking-widest">
                View All Scan History →
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
