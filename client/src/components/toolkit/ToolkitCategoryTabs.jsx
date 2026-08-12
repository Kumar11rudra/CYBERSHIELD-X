import React from 'react';
import { CATEGORIES } from './toolConfig';

export default function ToolkitCategoryTabs({ activeCategory, setActiveCategory }) {
  const categoriesList = [
    { id: 'all', label: 'All Modules' },
    ...Object.values(CATEGORIES).map(cat => ({ id: cat, label: cat }))
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-6 mb-8 custom-scrollbar no-scrollbar">
      {categoriesList.map(cat => (
        <button
          key={cat.id}
          onClick={() => setActiveCategory(cat.id)}
          className={`whitespace-nowrap px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest border transition-all duration-300 ${
            activeCategory === cat.id 
              ? 'bg-cyber-accent/10 border-cyber-accent text-cyber-accent shadow-[0_0_15px_rgba(0,212,255,0.1)]' 
              : 'bg-white/5 border-white/10 text-cyber-muted hover:border-white/20'
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
