/**
 * CookieConsentBanner — GDPR-Compliant Cookie Consent
 *
 * Features:
 * - Remembers consent in localStorage (persists across sessions)
 * - Accept All / Reject Non-Essential options
 * - Links to Privacy Policy and Cookie Policy
 * - Smooth slide-up animation
 * - i18n ready
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const CONSENT_KEY = 'cybershield_cookie_consent';
const CONSENT_VERSION = '1.0'; // Bump this to re-ask users after policy changes

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Check if user already consented to this version
    try {
      const stored = JSON.parse(localStorage.getItem(CONSENT_KEY));
      if (!stored || stored.version !== CONSENT_VERSION) {
        // New user or policy changed — show banner after short delay
        const timer = setTimeout(() => setVisible(true), 1500);
        return () => clearTimeout(timer);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const saveConsent = (type) => {
    const consent = {
      version: CONSENT_VERSION,
      type, // 'all' | 'essential'
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    setVisible(false);
  };

  const handleAcceptAll = () => saveConsent('all');
  const handleEssentialOnly = () => saveConsent('essential');

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-[500] p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Cookie Consent"
        >
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#0a0e1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
              {/* Main Banner */}
              <div className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Cookie Icon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyber-accent/10 border border-cyber-accent/20 flex items-center justify-center text-xl">
                    🍪
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white mb-1">
                      We use cookies to protect your experience
                    </p>
                    <p className="text-xs text-cyber-muted leading-relaxed">
                      CyberShield X uses{' '}
                      <span className="text-cyber-accent font-mono">HttpOnly security cookies</span>{' '}
                      for authentication and{' '}
                      <span className="text-white">localStorage</span>{' '}
                      for your preferences. No advertising or tracking cookies.{' '}
                      <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-cyber-accent hover:underline font-mono text-[11px]"
                      >
                        {expanded ? 'Show less ↑' : 'Learn more ↓'}
                      </button>
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0 w-full sm:w-auto">
                    <button
                      onClick={handleEssentialOnly}
                      className="px-4 py-2 rounded-xl border border-white/10 text-[11px] font-mono font-bold text-cyber-muted hover:text-white hover:border-white/30 transition-all uppercase tracking-wider whitespace-nowrap"
                    >
                      Essential Only
                    </button>
                    <button
                      onClick={handleAcceptAll}
                      className="px-4 py-2 rounded-xl bg-cyber-accent text-cyber-bg text-[11px] font-mono font-black uppercase tracking-wider hover:shadow-[0_0_15px_rgba(0,212,255,0.4)] transition-all whitespace-nowrap"
                    >
                      Accept All ✓
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                          {
                            name: 'Authentication',
                            type: 'Essential',
                            color: 'text-cyber-green border-cyber-green/30 bg-cyber-green/5',
                            description: 'Session tokens (HttpOnly cookies). Required for login. Cannot be disabled.',
                          },
                          {
                            name: 'Preferences',
                            type: 'Essential',
                            color: 'text-cyber-green border-cyber-green/30 bg-cyber-green/5',
                            description: 'Language and theme settings (localStorage). No server transmission.',
                          },
                          {
                            name: 'Analytics',
                            type: 'None',
                            color: 'text-cyber-muted border-white/10 bg-white/5',
                            description: 'We do not use Google Analytics or any tracking analytics.',
                          },
                          {
                            name: 'Advertising',
                            type: 'None',
                            color: 'text-cyber-muted border-white/10 bg-white/5',
                            description: 'We have zero advertising cookies. Your data is never sold.',
                          },
                        ].map((cookie) => (
                          <div key={cookie.name} className={`rounded-xl p-3 border ${cookie.color}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-bold text-white">{cookie.name}</span>
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider ${cookie.color}`}>
                                {cookie.type}
                              </span>
                            </div>
                            <p className="text-[10px] text-cyber-muted leading-relaxed">{cookie.description}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer Links */}
              <div className="px-5 pb-4 sm:px-6 flex items-center gap-4 border-t border-white/5 pt-3">
                <Link to="/privacy" className="text-[10px] font-mono text-cyber-muted hover:text-cyber-accent transition-colors uppercase tracking-wider">
                  Privacy Policy
                </Link>
                <span className="text-white/10 text-xs">|</span>
                <Link to="/terms" className="text-[10px] font-mono text-cyber-muted hover:text-cyber-accent transition-colors uppercase tracking-wider">
                  Terms of Service
                </Link>
                <span className="text-white/10 text-xs">|</span>
                <span className="text-[10px] font-mono text-white/20">
                  GDPR · Indian DPDP Act 2023
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
