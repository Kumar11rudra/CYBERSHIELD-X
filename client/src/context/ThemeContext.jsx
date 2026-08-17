import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

const hexToRgb = (hex) => {
  let c = hex.substring(1).split('');
  if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
  c = parseInt(c.join(''), 16);
  return [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(' ');
};

const applyAppearance = (settings) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  
  // PERMANENTLY DARK — Day mode removed
  root.dataset.theme = 'dark';
  root.classList.add('dark');
  root.classList.remove('light');
  root.style.colorScheme = 'dark';

  // Accent Color
  const targetColor = settings.globalThreatLevel === 'high' 
    ? '#ff2244' // Cyber Red for High Threat
    : (settings.customAccentHex && settings.customAccentHex !== settings.accentColor && settings.customAccentHex.startsWith('#')) 
      ? settings.customAccentHex 
      : settings.accentColor;

  if (targetColor && targetColor.startsWith('#')) {
    root.style.setProperty('--cyber-accent-rgb', hexToRgb(targetColor));
  }

  // Font Size
  if (settings.fontSize === 'small') root.style.fontSize = '14px';
  else if (settings.fontSize === 'large') root.style.fontSize = '18px';
  else root.style.fontSize = '16px';
};

const safeStorage = {
  getItem: (key, fallback = null) => {
    try {
      return localStorage.getItem(key) || fallback;
    } catch {
      return fallback;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {}
  }
};

export function ThemeProvider({ children }) {
  const [settings, setSettings] = useState(() => ({
    theme: 'night', // Always dark
    accentColor: safeStorage.getItem('csx_accentColor', '#00d4ff'),
    customAccentHex: safeStorage.getItem('csx_customAccentHex', '#00d4ff'),
    fontSize: safeStorage.getItem('csx_fontSize', 'default'),
    globalThreatLevel: 'low', // 'low' | 'high'
  }));

  useEffect(() => {
    // Clear any saved light theme preference
    safeStorage.setItem('csx_theme', 'night');
    applyAppearance(settings);
  }, [settings]);

  const updateSettings = (key, value) => {
    // Don't allow theme changes
    if (key === 'theme') return;
    setSettings(prev => ({ ...prev, [key]: value }));
    safeStorage.setItem(`csx_${key}`, value);
  };

  const value = useMemo(() => ({
    settings,
    isDark: true, // Always dark
    setTheme: () => {}, // No-op
    updateSettings,
    toggleTheme: () => {}, // No-op
  }), [settings]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
