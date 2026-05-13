import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { getLanguageList } from '../../i18n/provider';
import { useLanguage } from '../../context/LanguageContext';

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  globe: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9",
  chevDown: "M19 9l-7 7-7-7",
  check: "M5 13l4 4L19 7",
};

/**
 * LanguageSwitcher Component
 * 
 * Features:
 * - Dropdown menu showing all supported languages
 * - Flags and translated language names
 * - Smooth animations on open/close
 * - Automatic RTL support indicator
 * - Click outside to close
 */
export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const languages = getLanguageList();
  const current = languages.find(l => l.code === language || l.code === i18n.language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    setLanguage(langCode);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-cyber-border/50
          bg-cyber-bg hover:border-cyber-accent/40 transition-all font-mono text-xs text-cyber-text
          hover:text-cyber-accent"
        title="Switch language"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="uppercase tracking-wider hidden sm:inline">{current.code}</span>
        <Icon d={ICONS.chevDown} size={10} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-50 bg-cyber-surface border border-cyber-border
              rounded shadow-xl min-w-[220px] max-h-80 overflow-y-auto"
          >
            <div className="py-2">
              {/* Header */}
              <div className="px-3 py-2 border-b border-cyber-border/40">
                <p className="font-mono text-[10px] uppercase tracking-wider text-cyber-muted">
                  Select Language
                </p>
              </div>

              {/* Language List */}
              <div className="py-1">
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full flex items-center gap-3 px-3 py-2 font-mono text-xs transition-colors
                      ${lang.code === i18n.language
                        ? 'bg-cyber-accent/10 text-cyber-accent'
                        : 'text-cyber-muted hover:text-cyber-text hover:bg-white/5'
                      }`}
                  >
                    <span className="text-lg leading-none flex-shrink-0">{lang.flag}</span>
                    <span className="flex-grow text-left">{lang.label}</span>
                    {lang.code === i18n.language && (
                      <Icon d={ICONS.check} size={14} className="flex-shrink-0" />
                    )}
                    {lang.dir === 'rtl' && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-cyber-accent/20 text-cyber-accent rounded border border-cyber-accent/30">
                        RTL
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Footer Info */}
              <div className="border-t border-cyber-border/40 px-3 py-2 mt-1">
                <p className="font-mono text-[9px] text-cyber-muted leading-relaxed">
                  Language changes apply instantly. Your choice is saved locally.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
