import React from 'react';

/**
 * SystemStatusCard Component
 * Displays system dependencies status and metrics overview.
 */
export default function SystemStatusCard() {
  const statusItems = [
    { label: 'Backend API', status: 'ONLINE', color: '#228b5e' },
    { label: 'MongoDB Database', status: 'CONNECTED', color: '#228b5e' },
    { label: 'Threat Feed Sync', status: 'ACTIVE', color: '#228b5e' },
    { label: 'AI Copilot Engine', status: 'STANDBY', color: '#b29400' },
    { label: 'WebSocket Layer', status: 'ONLINE', color: '#228b5e' },
    { label: 'Tool Execution Engine', status: 'READY', color: '#228b5e' },
  ];

  return (
    <div className="flex flex-col border border-cyber-border/10 bg-cyber-card rounded-xl p-4 shadow-sm h-[300px]">
      <div className="border-b border-cyber-border/10 pb-3 mb-3">
        <span className="text-xs font-bold text-cyber-text tracking-widest uppercase">
          SYSTEM STATUS
        </span>
      </div>

      <div className="flex-1 space-y-2.5">
        {statusItems.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-[10px]">
            <span className="text-cyber-text">{item.label}</span>
            <div className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: item.color }}
              />
              <span className="font-bold font-mono" style={{ color: item.color }}>
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Arsenal Stats */}
      <div className="border-t border-cyber-border/10 pt-3 mt-2">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-cyber-accent font-bold text-sm">20</div>
            <div className="text-[8px] text-cyber-muted uppercase">Modules</div>
          </div>
          <div>
            <div className="text-cyber-green font-bold text-sm">LIVE</div>
            <div className="text-[8px] text-cyber-muted uppercase">Status</div>
          </div>
          <div>
            <div className="text-cyber-orange font-bold text-sm">24+</div>
            <div className="text-[8px] text-cyber-muted uppercase">Intel</div>
          </div>
        </div>
      </div>
    </div>
  );
}
