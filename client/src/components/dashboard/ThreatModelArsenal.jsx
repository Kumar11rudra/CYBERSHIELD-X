import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { THREAT_MODELS, TAG_COLORS } from '../../data/threatModels';

/**
 * ThreatModelArsenal Component
 * Displays the grid of available security scanning engines/tools.
 */
export default function ThreatModelArsenal({
  toolSearch,
  setToolSearch,
  activeCategory,
  setActiveCategory,
}) {
  const navigate = useNavigate();

  // Filter tools
  const categories = ['ALL', ...new Set(THREAT_MODELS.map((m) => m.tag))];
  const filteredTools = THREAT_MODELS.filter((m) => {
    const matchSearch =
      toolSearch === '' ||
      m.name.toLowerCase().includes(toolSearch.toLowerCase()) ||
      m.tag.toLowerCase().includes(toolSearch.toLowerCase());
    const matchCat = activeCategory === 'ALL' || m.tag === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="border border-[#00bfff]/15 bg-[#0a1223]/80 rounded-xl p-5 shadow-lg mb-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 border-b border-[#224466]/30 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-bold text-white tracking-widest uppercase">
              ⚡ THREAT MODEL ARSENAL
            </span>
            <span className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded font-bold">
              {THREAT_MODELS.length} ACTIVE MODELS
            </span>
          </div>
          <p className="text-[10px] text-[#5a7fa8] mt-1">
            Click any model to open its dedicated security tool
          </p>
        </div>
        {/* Search */}
        <input
          type="text"
          value={toolSearch}
          onChange={(e) => setToolSearch(e.target.value)}
          placeholder="Search models..."
          className="bg-black/60 border border-[#224466]/30 rounded-lg px-3 py-1.5 text-[10px] text-white focus:outline-none focus:border-cyan-400 font-mono w-full md:w-52"
        />
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all border ${
              activeCategory === cat
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                : 'bg-black/30 border-[#224466]/30 text-[#5a7fa8] hover:text-white hover:border-[#224466]/60'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tool Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filteredTools.map((model, idx) => (
          <motion.button
            key={model.id}
            onClick={() => navigate(`/toolkit/${model.id}`)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03, duration: 0.25 }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="group relative flex flex-col items-start text-left p-3 bg-black/40 border border-[#224466]/25 rounded-xl hover:border-opacity-60 transition-all cursor-pointer overflow-hidden"
            style={{ '--tool-color': model.color }}
          >
            {/* Glow on hover */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
              style={{
                background: `radial-gradient(ellipse at top left, ${model.color}15 0%, transparent 70%)`,
              }}
            />

            {/* Icon + Tag */}
            <div className="flex items-center justify-between w-full mb-2 relative z-10">
              <span className="text-xl leading-none">{model.icon}</span>
              <span
                className="text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border"
                style={{
                  color: TAG_COLORS[model.tag] || '#6b7280',
                  borderColor: `${TAG_COLORS[model.tag] || '#6b7280'}40`,
                  background: `${TAG_COLORS[model.tag] || '#6b7280'}10`,
                }}
              >
                {model.tag}
              </span>
            </div>

            {/* Name */}
            <span
              className="text-[10px] font-bold leading-tight mb-1 relative z-10 group-hover:text-white transition-colors line-clamp-2"
              style={{ color: '#cbd5e1' }}
            >
              {model.name}
            </span>

            {/* Desc */}
            <span className="text-[8.5px] text-[#476585] relative z-10 group-hover:text-[#5a7fa8] transition-colors line-clamp-1">
              {model.desc}
            </span>

            {/* Active indicator line at bottom */}
            <div
              className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-300 rounded-full"
              style={{ background: model.color }}
            />
          </motion.button>
        ))}

        {filteredTools.length === 0 && (
          <div className="col-span-full text-center py-8 text-[#5a7fa8] text-xs italic">
            No models match your search. Try a different keyword or category.
          </div>
        )}
      </div>
    </div>
  );
}
