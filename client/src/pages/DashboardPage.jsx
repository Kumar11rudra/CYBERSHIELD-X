import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllTools, getAllCategories } from '../components/toolkit/toolConfig';
import { getCategoryTheme, CATEGORY_ARCHETYPE_MAP } from '../components/toolkit/cards/toolThemes';
import ToolGrid from '../components/toolkit/cards/ToolGrid';
import ExternalAlternativesModal from '../components/toolkit/cards/ExternalAlternativesModal';
import { Search, X, Shield, Info } from 'lucide-react';

/**
 * 🛡️ DashboardPage
 * Clean, modern Security Tool Discovery Hub for CyberShield X.
 * Single source of truth for the 111-tool catalog.
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [alternativeToolModal, setAlternativeToolModal] = useState(null);

  const searchInputRef = useRef(null);

  // 150ms Search Debounce (zero external dependencies)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Keyboard Navigation Shortcuts: '/' to focus search, 'Escape' to clear/blur
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) &&
        !document.activeElement?.isContentEditable
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (document.activeElement === searchInputRef.current) {
          if (searchQuery) {
            setSearchQuery('');
          } else {
            searchInputRef.current?.blur();
          }
        } else if (alternativeToolModal) {
          setAlternativeToolModal(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, alternativeToolModal]);

  // Authoritative 111-tool catalog with persona archetypes
  const canonicalTools = useMemo(() => {
    const rawTools = getAllTools();
    return rawTools.map((tool) => ({
      ...tool,
      avatarArchetype:
        tool.avatarArchetype || CATEGORY_ARCHETYPE_MAP[tool.category] || 'Cyber Scout',
    }));
  }, []);

  // 25 Category Filter Options (ALL + 24 canonical categories)
  const categories = useMemo(() => {
    return ['ALL', ...getAllCategories()];
  }, []);

  // Filtered Tools Pipeline (Category Filter -> Search Filter)
  const filteredTools = useMemo(() => {
    const query = debouncedQuery.trim().toLowerCase();

    return canonicalTools.filter((tool) => {
      // 1. Category check
      if (selectedCategory !== 'ALL' && tool.category !== selectedCategory) {
        return false;
      }

      // 2. Search query check
      if (!query) return true;

      const nameMatch = tool.name?.toLowerCase().includes(query);
      const idMatch = tool.id?.toLowerCase().includes(query);
      const catMatch = tool.category?.toLowerCase().includes(query);
      const descMatch =
        tool.description?.toLowerCase().includes(query) ||
        tool.tagline?.toLowerCase().includes(query);
      const keywordsMatch = Array.isArray(tool.keywords)
        ? tool.keywords.some(
            (kw) => typeof kw === 'string' && kw.toLowerCase().includes(query)
          )
        : false;

      return nameMatch || idMatch || catMatch || descMatch || keywordsMatch;
    });
  }, [canonicalTools, selectedCategory, debouncedQuery]);

  // Tool Navigation Handler: Routes to existing /toolkit/:toolId flow
  const handleOpenTool = (tool) => {
    if (tool?.id) {
      navigate(`/toolkit/${tool.id}`);
    }
  };

  // Alternatives Interaction Hook: Safe verification modal without external URLs
  const handleViewAlternatives = (tool) => {
    setAlternativeToolModal(tool);
  };

  return (
    <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* ── Header: Discovery Hub Greeting & Census ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00d4ff]" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-cyan-400">
              CyberShield X Security Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Security Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse and discover {canonicalTools.length} security tools across {categories.length - 1} operational categories.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 flex items-center gap-2">
            <span className="text-slate-400">Operator:</span>
            <span className="text-cyan-300 font-bold uppercase">
              {user?.username || 'Operator'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Search Bar (Full-Width, Prominent, Keyboard-Accessible) ───────── */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <Search size={18} className="text-cyan-400/80" />
        </div>
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search security tools, capabilities, categories, or IDs... (Press '/' to focus)"
          aria-label="Search security tools"
          className="w-full pl-11 pr-24 py-3.5 rounded-2xl bg-[#0c162d]/90 hover:bg-[#0c162d] focus:bg-[#0c162d] border border-slate-800 hover:border-slate-700 focus:border-cyan-400/80 text-sm text-slate-100 placeholder-slate-500 shadow-lg backdrop-blur-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
        />
        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center gap-1.5">
          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              aria-label="Clear search query"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
            >
              <X size={16} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium text-slate-400 bg-slate-800/80 border border-slate-700/60 shadow-sm">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* ── Category Filter Pills (25 Pills: All + 24 Categories) ─────────── */}
      <div className="w-full overflow-x-auto pb-1 custom-scrollbar">
        <div className="flex items-center gap-2 min-w-max">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const theme = cat === 'ALL' ? null : getCategoryTheme(cat);

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 border shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  isSelected
                    ? cat === 'ALL'
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_12px_rgba(0,212,255,0.35)]'
                      : 'border-transparent shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/90 border-slate-800/80'
                }`}
                style={
                  isSelected && cat !== 'ALL' && theme
                    ? {
                        backgroundColor: theme.badgeBg,
                        borderColor: theme.accent,
                        color: theme.accent,
                        boxShadow: `0 0 12px ${theme.accent}30`,
                      }
                    : undefined
                }
              >
                {cat === 'ALL' ? 'All Tools' : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Result Counter & Filter Reset ─────────────────────────────────── */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">
            {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'} found
          </span>
          {selectedCategory !== 'ALL' && (
            <span className="text-slate-500">
              in <span className="text-slate-300 font-medium">{selectedCategory}</span>
            </span>
          )}
          {debouncedQuery && (
            <span className="text-slate-500">
              matching <span className="text-cyan-400 font-medium">"{debouncedQuery}"</span>
            </span>
          )}
        </div>

        {(selectedCategory !== 'ALL' || searchQuery) && (
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('ALL');
              setSearchQuery('');
            }}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors underline underline-offset-4"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* ── Tool Grid Integration (Step 4B: External-Only Card Flow) ──────── */}
      <ToolGrid
        tools={filteredTools}
        onExternalDiscovery={handleViewAlternatives}
        emptyMessage={
          searchQuery || selectedCategory !== 'ALL'
            ? 'No security tools match your current search or category filter.'
            : 'No security tools found in the catalog.'
        }
      />

      {/* ── Verified External Alternatives Modal ──────────────────────────── */}
      <ExternalAlternativesModal
        tool={alternativeToolModal}
        isOpen={Boolean(alternativeToolModal)}
        onClose={() => setAlternativeToolModal(null)}
        onOpenNativeTool={handleOpenTool}
      />
    </main>
  );
}