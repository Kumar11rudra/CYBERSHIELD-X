import React from 'react';
import { getAllTools, TOOL_STATUS } from './toolConfig';

export default function ToolkitStats() {
  const tools = getAllTools();
  const liveCount = tools.filter(t => t.status === TOOL_STATUS.LIVE).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {[
        { label: 'Active Live Engines', count: liveCount, color: 'text-[#00ff88]', bg: 'bg-[#00ff88]/5', border: 'border-[#00ff88]/20' },
        { label: 'Diagnostic Probes', count: tools.length - liveCount, color: 'text-[#00bfff]', bg: 'bg-[#00bfff]/5', border: 'border-[#00bfff]/20' },
        { label: 'Terminal Ready Suite', count: tools.length, color: 'text-cyber-accent', bg: 'bg-cyber-accent/5', border: 'border-cyber-accent/20' },
        { label: 'Intelligence Domains', count: 24, color: 'text-white', bg: 'bg-white/5', border: 'border-white/10' }
      ].map((stat, i) => (
        <div key={i} className={`p-4 rounded-xl border ${stat.bg} ${stat.border}`}>
          <div className="text-[9px] font-mono text-cyber-muted uppercase tracking-widest">{stat.label}</div>
          <div className={`text-2xl font-display font-black mt-1 ${stat.color}`}>{stat.count}</div>
        </div>
      ))}
    </div>
  );
}

