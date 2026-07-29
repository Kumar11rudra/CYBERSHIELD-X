import React from 'react';

/**
 * GlassCard
 * Shared glassmorphism card with corner accents and optional glow.
 *
 * Props:
 *   children    — card content
 *   className   — additional classes
 *   glow        — boolean, shows inner radial glow blob (default false)
 *   padding     — 'sm' | 'md' | 'lg' (default 'lg')
 */
export default function GlassCard({ children, className = '', glow = false, padding = 'lg' }) {
  const paddingClass = {
    sm: 'p-4',
    md: 'p-6 md:p-8',
    lg: 'p-8 lg:p-12',
  }[padding] ?? 'p-8 lg:p-12';

  return (
    <div
      className={`bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] ${paddingClass} rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] relative overflow-hidden ${className}`}
    >
      {/* Top-left corner accent */}
      <div className="absolute top-0 left-0 w-12 h-12 border-t border-l border-cyber-green/50 rounded-tl-2xl opacity-60 pointer-events-none" />
      {/* Bottom-right corner accent */}
      <div className="absolute bottom-0 right-0 w-12 h-12 border-b border-r border-cyber-green/50 rounded-br-2xl opacity-60 pointer-events-none" />

      {glow && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyber-green/10 rounded-full blur-[80px] pointer-events-none" />
      )}

      {children}
    </div>
  );
}
