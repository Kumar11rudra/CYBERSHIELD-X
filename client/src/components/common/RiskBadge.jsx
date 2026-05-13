import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function RiskBadge({ level, size = 'md' }) {
  const { language } = useLanguage();
  const classes = {
    safe: 'bg-green-900/30 text-green-400 border-green-700/40',
    low: 'bg-yellow-900/30 border-yellow-700/40',
    medium: 'bg-orange-900/30 text-orange-400 border-orange-700/40',
    dangerous: 'bg-red-900/30 text-red-400 border-red-700/40',
  };
  const lowStyle = level === 'low' ? { color: '#ffdd00' } : {};
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs';
  const labels = { safe: 'safe', low: 'low', medium: 'medium', dangerous: 'dangerous' };

  return (
    <span
      className={`${sizeClasses} border rounded font-mono uppercase tracking-wider ${classes[level] || classes.safe}`}
      style={lowStyle}
    >
      {level === 'dangerous' ? '⚠ ' : ''}{labels[level] || labels.safe}
    </span>
  );
}
