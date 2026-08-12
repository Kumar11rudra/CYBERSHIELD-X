import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { getAllTools, CATEGORY_METADATA } from '../components/toolkit/toolConfig';
import ToolkitHeader from '../components/toolkit/ToolkitHeader';
import ToolkitCategoryTabs from '../components/toolkit/ToolkitCategoryTabs';
import ToolkitStats from '../components/toolkit/ToolkitStats';
import ToolkitModelCard from '../components/toolkit/ToolkitModelCard';

export default function ToolkitPage() {
  const location = useLocation();
  const [search, setSearch] = useState('');

  // Extract ?category= query parameter if present
  const getInitialCategory = () => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('category');
    return cat || 'all';
  };
  const [activeCategory, setActiveCategory] = useState(getInitialCategory());

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('category');
    if (cat) {
      setActiveCategory(cat);
    } else {
      setActiveCategory('all');
    }
  }, [location.search]);

  const categoryMeta = useMemo(() => {
    if (activeCategory === 'all') return null;
    const catMeta = CATEGORY_METADATA[activeCategory];
    if (!catMeta) return null;

    const catTools = getAllTools().filter(t => t.category === activeCategory);
    const liveCount = catTools.filter(t => t.status === 'live' || t.status === 'partial').length;
    const upcomingCount = catTools.filter(t => t.status === 'coming_soon').length;

    return {
      ...catMeta,
      liveCount,
      upcomingCount,
      totalCount: catTools.length
    };
  }, [activeCategory]);

  const filteredTools = useMemo(() => {
    return getAllTools().filter(tool => {
      const matchesSearch = tool.name.toLowerCase().includes(search.toLowerCase()) || 
                          tool.tagline.toLowerCase().includes(search.toLowerCase());
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
        <ToolkitHeader search={search} setSearch={setSearch} />

        {/* Dynamic Catalog Statistics */}
        <ToolkitStats />

        {/* Categories Bar */}
        <ToolkitCategoryTabs activeCategory={activeCategory} setActiveCategory={setActiveCategory} />

        {/* Category Description Banner */}
        {categoryMeta && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 rounded-2xl border border-cyber-accent/20 bg-cyber-accent/[0.02] backdrop-blur-md"
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-cyber-accent uppercase tracking-[0.2em]">Domain Purpose</span>
                <h2 className="text-lg font-display font-black text-white uppercase tracking-wide">
                  {activeCategory}
                </h2>
                <p className="text-xs text-cyber-accent/80 font-mono">
                  {categoryMeta.purpose}
                </p>
                <p className="text-[11px] text-cyber-muted font-mono leading-relaxed mt-2 max-w-4xl">
                  {categoryMeta.description}
                </p>
              </div>
              <div className="flex gap-3 font-mono text-[10px] self-start md:self-auto bg-black/40 border border-white/5 p-3 rounded-xl">
                <div>
                  <span className="text-cyber-muted uppercase block text-[8px] tracking-wider">Live Modules</span>
                  <span className="text-[#00ff88] font-bold text-sm">{categoryMeta.liveCount}</span>
                </div>
                <div className="border-l border-white/10 pl-3">
                  <span className="text-cyber-muted uppercase block text-[8px] tracking-wider">Upcoming</span>
                  <span className="text-white/45 font-bold text-sm">{categoryMeta.upcomingCount}</span>
                </div>
                <div className="border-l border-white/10 pl-3">
                  <span className="text-cyber-muted uppercase block text-[8px] tracking-wider">Total</span>
                  <span className="text-cyber-accent font-bold text-sm">{categoryMeta.totalCount}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tools Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        >
          <AnimatePresence mode='popLayout'>
            {filteredTools.map(tool => (
              <ToolkitModelCard key={tool.id} tool={tool} activeCategory={activeCategory} />
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
