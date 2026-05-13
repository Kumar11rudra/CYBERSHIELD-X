import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

/**
 * SecurityFortressGauge — A premium, high-fidelity security score visual.
 * Displays a 0-100 score in an animated circular gauge with dynamic thresholds.
 */
const SecurityFortressGauge = ({ score = 85, label = "Security Posture" }) => {
  // Normalize score
  const safeScore = Math.min(Math.max(score, 0), 100);
  
  // Dynamic color logic
  const getColor = (s) => {
    if (s >= 80) return '#00ff88'; // Safe - Neon Green
    if (s >= 50) return '#ffcc00'; // Warning - Gold
    return '#ff2244'; // Danger - Cyber Red
  };

  const { t } = useTranslation();
  const activeColor = getColor(safeScore);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative p-6">
      <div className="relative w-48 h-48 drop-shadow-[0_0_15px_rgba(0,212,255,0.2)]">
        {/* Background Track */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke="currentColor"
            strokeWidth="10"
            fill="transparent"
            className="text-cyber-border/20"
          />
          
          {/* Animated Progress Ring */}
          <motion.circle
            cx="96"
            cy="96"
            r={radius}
            stroke={activeColor}
            strokeWidth="10"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            fill="transparent"
            strokeLinecap="round"
            style={{ 
              filter: `drop-shadow(0 0 8px ${activeColor})`
            }}
          />
        </svg>

        {/* Center Text Block */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.span 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-4xl font-black font-display tracking-tighter"
            style={{ color: activeColor }}
          >
            {safeScore}
          </motion.span>
          <span className="text-[10px] uppercase tracking-[0.25em] text-cyber-muted font-bold -mt-1">
            {safeScore >= 80 ? t('dashboard.status.fortified') : safeScore >= 50 ? t('dashboard.status.vulnerable') : t('dashboard.status.breached')}
          </span>
        </div>

        {/* Outer Glow Particles (Simulated with simple divs) */}
        <div className="absolute -inset-2 rounded-full border border-cyber-accent/5 pointer-events-none animate-pulse" />
      </div>

      {/* Label and Status */}
      <div className="mt-4 text-center">
        <h4 className="text-xs font-mono font-bold text-cyber-text uppercase tracking-widest">{label}</h4>
        <div className="flex items-center gap-2 mt-1 justify-center">
          <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: activeColor }} />
          <span className="text-[9px] font-mono text-cyber-muted uppercase">{t('dashboard.sentinelStatus')}</span>
        </div>
      </div>
    </div>
  );
};

export default SecurityFortressGauge;
