import React from 'react';
import { motion } from 'framer-motion';

export default function ToolkitHeader({ search, setSearch }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-white/5 pb-10">
      <div className="flex-1">
        <motion.p 
          initial={{ opacity: 0, x: -10 }} 
          animate={{ opacity: 1, x: 0 }}
          className="text-[10px] font-mono tracking-[0.5em] text-cyber-accent uppercase mb-2"
        >
          System Operations Center
        </motion.p>
        <motion.h1 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-display font-black tracking-tight text-white"
        >
          NEXUS <span className="text-cyber-accent">TOOLKIT</span>
        </motion.h1>
        <p className="mt-3 text-xs text-cyber-muted font-mono max-w-xl uppercase tracking-wider leading-relaxed">
          Explore the ultimate A-Z security encyclopedia. 25+ specialized modules for reconnaissance, auditing, and defensive operations.
        </p>
      </div>

      <div className="w-full md:w-80">
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Search Nexus Database..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 font-mono text-[11px] text-white focus:border-cyber-accent outline-none transition-all"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-cyber-muted font-mono text-[10px]">🔎</span>
        </div>
      </div>
    </div>
  );
}
