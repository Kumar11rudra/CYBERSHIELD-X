import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ToolkitStatusBadge from './ToolkitStatusBadge';

export default function ToolkitModelCard({ tool, activeCategory }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const rgb = tool.color.replace('#', '').match(/.{2}/g).map(h => parseInt(h, 16)).join(',');
  const isComingSoon = tool.status === 'coming_soon';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/toolkit/${tool.id}`, { state: { fromCategory: activeCategory } })}
      className="relative group cursor-pointer p-5 rounded-2xl border transition-all duration-300 bg-cyber-card/40 border-white/5 hover:border-cyber-accent/40"
      style={{
        boxShadow: hovered ? `0 8px 30px rgba(${rgb}, 0.15)` : 'none'
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="text-3xl">{tool.icon}</div>
        <ToolkitStatusBadge status={tool.status} />
      </div>

      <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider mb-1 group-hover:text-cyber-accent transition-colors">
        {tool.name}
      </h3>
      <p className="text-[9px] font-mono text-cyber-muted uppercase tracking-widest mb-3">
        {tool.tagline}
      </p>

      {isComingSoon ? (
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-[1px] bg-white/5" />
          <span className="text-[7px] font-mono text-cyber-accent/50 animate-pulse uppercase tracking-[0.2em]">Roadmap Details</span>
          <div className="flex-1 h-[1px] bg-white/5" />
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-cyber-accent opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[9px] font-mono uppercase tracking-widest">
            {tool.status === 'partial' ? 'Configure & Run' : 'Execute Module'}
          </span>
          <span className="text-xs">→</span>
        </div>
      )}
      
      {/* Decorative Corner */}
      <div className="absolute bottom-0 right-0 w-8 h-8 opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity"
           style={{ background: `linear-gradient(135deg, transparent 50%, ${tool.color} 50%)` }} />
    </motion.div>
  );
}
