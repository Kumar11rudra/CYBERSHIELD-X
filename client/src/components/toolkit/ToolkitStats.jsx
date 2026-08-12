import React from 'react';
import { getAllTools, TOOL_STATUS } from './toolConfig';

export default function ToolkitStats() {
  const tools = getAllTools();
  const liveCount = tools.filter(t => t.status === TOOL_STATUS.LIVE).length;
  const partialCount = tools.filter(t => t.status === TOOL_STATUS.PARTIAL).length;
  const upcomingCount = tools.filter(t => t.status === TOOL_STATUS.COMING_SOON).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {[
        { label: 'Live Models', count: liveCount, color: 'text-[#00ff88]', bg: 'bg-[#00ff88]/5', border: 'border-[#00ff88]/20' },
        { label: 'Partial Models', count: partialCount, color: 'text-amber-500', bg: 'bg-amber-500/5', border: 'border-amber-500/20' },
        { label: 'Upcoming Models', count: upcomingCount, color: 'text-white/40', bg: 'bg-white/5', border: 'border-white/10' },
        { label: 'Total Catalog', count: tools.length, color: 'text-cyber-accent', bg: 'bg-cyber-accent/5', border: 'border-cyber-accent/20' }
      ].map((stat, i) => (
        <div key={i} className={`p-4 rounded-xl border ${stat.bg} ${stat.border}`}>
          <div className="text-[9px] font-mono text-cyber-muted uppercase tracking-widest">{stat.label}</div>
          <div className={`text-2xl font-display font-black mt-1 ${stat.color}`}>{stat.count}</div>
        </div>
      ))}
    </div>
  );
}
