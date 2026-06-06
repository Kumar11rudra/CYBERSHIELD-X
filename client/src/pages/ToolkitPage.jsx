import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// ─── Constants & Data ────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all', label: 'toolkit.categories.all' },
  { id: 'recon', label: 'toolkit.categories.recon' },
  { id: 'vulnerability', label: 'toolkit.categories.vulnerability' },
  { id: 'web', label: 'toolkit.categories.web' },
  { id: 'password', label: 'toolkit.categories.password' },
  { id: 'wireless', label: 'toolkit.categories.wireless' },
  { id: 'packet', label: 'toolkit.categories.packet' },
  { id: 'exploitation', label: 'toolkit.categories.exploitation' },
  { id: 'forensics', label: 'toolkit.categories.forensics' },
  { id: 'malware', label: 'toolkit.categories.malware' },
  { id: 'soc', label: 'toolkit.categories.soc' },
  { id: 'endpoint', label: 'toolkit.categories.endpoint' },
  { id: 'cloud', label: 'toolkit.categories.cloud' },
  { id: 'devsecops', label: 'toolkit.categories.devsecops' },
  { id: 'mobile', label: 'toolkit.categories.mobile' },
  { id: 'intelligence', label: 'toolkit.categories.intelligence' },
  { id: 'utility', label: 'toolkit.categories.utility' },
];

import { getAllTools } from '../components/toolkit/toolConfig';

const TOOLS = getAllTools().map(t => ({
  id: t.id,
  category: t.category.toLowerCase(),
  icon: t.icon,
  name: t.name,
  original: t.tagline || t.name,
  status: t.status,
  color: t.color || '#00d4ff',
}));

// ─── Component ───────────────────────────────────────────────────────────────

const ToolCard = ({ tool, t }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = React.useState(false);

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
      onClick={() => navigate(`/toolkit/${tool.id}`)}
      className="relative group cursor-pointer p-5 rounded-2xl border transition-all duration-300 bg-cyber-card/40 border-white/5 hover:border-cyber-accent/40"
      style={{
        boxShadow: hovered ? `0 8px 30px rgba(${rgb}, 0.15)` : 'none'
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="text-3xl">{tool.icon}</div>
        <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border ${
          tool.status === 'live' ? 'bg-cyber-accent/10 border-cyber-accent/30 text-cyber-accent' :
          tool.status === 'beta' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
          tool.category === 'utility' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
          'bg-white/5 border-white/10 text-white/40'
        }`}>
          {tool.status === 'live' ? 'LIVE' :
           tool.status === 'beta' ? 'BETA' :
           tool.category === 'utility' ? 'UTILITY' : 'COMING SOON'}
        </span>
      </div>

      <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider mb-1 group-hover:text-cyber-accent transition-colors">
        {tool.name}
      </h3>
      <p className="text-[9px] font-mono text-cyber-muted uppercase tracking-widest mb-3">
        {tool.original}
      </p>

      {isComingSoon ? (
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-[1px] bg-white/5" />
          <span className="text-[7px] font-mono text-cyber-accent/50 animate-pulse uppercase tracking-[0.2em]">Roadmap Details</span>
          <div className="flex-1 h-[1px] bg-white/5" />
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-cyber-accent opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[9px] font-mono uppercase tracking-widest">Execute Module</span>
          <span className="text-xs">→</span>
        </div>
      )}
      
      {/* Decorative Corner */}
      <div className="absolute bottom-0 right-0 w-8 h-8 opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity"
           style={{ background: `linear-gradient(135deg, transparent 50%, ${tool.color} 50%)` }} />
    </motion.div>
  );
};

export default function ToolkitPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredTools = useMemo(() => {
    return TOOLS.filter(tool => {
      const matchesSearch = tool.name.toLowerCase().includes(search.toLowerCase()) || 
                          tool.original.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'all' || tool.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  return (
    <div className="min-h-screen pt-4 pb-20 px-4 sm:px-6 relative">
      {/* Background Decor */}
      <div className="bloom-bg top-[-10%] left-[-10%] bg-cyber-accent/5" />
      <div className="bloom-bg bottom-[-10%] right-[-10%] bg-purple-500/5" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header Section */}
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
              Explore the ultimate A-Z security encyclopedia. 15+ specialized modules for reconnaissance, auditing, and defensive operations.
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

        {/* Categories Bar */}
        <div className="flex gap-2 overflow-x-auto pb-6 mb-8 custom-scrollbar no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest border transition-all duration-300 ${
                activeCategory === cat.id 
                  ? 'bg-cyber-accent/10 border-cyber-accent text-cyber-accent shadow-[0_0_15px_rgba(0,212,255,0.1)]' 
                  : 'bg-white/5 border-white/10 text-cyber-muted hover:border-white/20'
              }`}
            >
              {cat.id === 'all' ? 'All Modules' : (t(cat.label) || cat.id.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Tools Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        >
          <AnimatePresence mode='popLayout'>
            {filteredTools.map(tool => (
              <ToolCard key={tool.id} tool={tool} t={t} />
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredTools.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-4xl mb-4 opacity-40">🛸</span>
            <p className="font-mono text-xs text-cyber-muted uppercase tracking-[0.4em] animate-pulse">
              No matching signals in the Nexus database
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
