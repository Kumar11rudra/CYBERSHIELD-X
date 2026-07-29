import React from 'react';
import useClock from '../../hooks/useClock';

/**
 * HUDHeader Component
 * Renders the top HUD panel including system status and live clock.
 */
export default function HUDHeader() {
  const time = useClock();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between border border-cyber-border/10 bg-cyber-card rounded-xl p-4 md:p-5 mb-5 gap-4 shadow-sm">
      <div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyber-accent animate-pulse" />
          <h1 className="text-xl md:text-2xl font-black tracking-widest text-cyber-text uppercase font-display">
            NEXUS COMMAND CENTER <span className="text-cyber-accent">V2.0</span>
          </h1>
        </div>
        <p className="text-[10px] md:text-xs text-cyber-muted mt-1 uppercase tracking-wider">
          Active Threat Perception Node: India-East | Secure Protocol Active
        </p>
      </div>
      <div className="flex flex-col items-start md:items-end font-mono">
        <div className="text-sm md:text-base text-cyber-accent font-bold tracking-widest">
          {time.toLocaleTimeString()}
        </div>
        <div className="text-[9px] text-cyber-muted uppercase tracking-wider mt-0.5">
          {time.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>
    </div>
  );
}
