import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllTools, getAllCategories } from '../components/toolkit/toolConfig';
import { getCategoryTheme, CATEGORY_ARCHETYPE_MAP } from '../components/toolkit/cards/toolThemes';
import ToolGrid from '../components/toolkit/cards/ToolGrid';
import ExternalAlternativesModal from '../components/toolkit/cards/ExternalAlternativesModal';
import { Search, X } from 'lucide-react';

/**
 * 🛡️ DashboardPage
 * Visual design matching design img..png authoritative reference.
 * 4-column responsive grid with colorful pastel cards, clean light aesthetic,
 * search & category filtering across the canonical 111-tool catalog.
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

  // 150ms Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Keyboard Shortcuts: '/' to focus search, 'Escape' to clear
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

  // Canonical 111-tool catalog with persona archetypes
  const canonicalTools = useMemo(() => {
    const rawTools = getAllTools();
    return rawTools.map((tool) => ({
      ...tool,
      avatarArchetype:
        tool.avatarArchetype || CATEGORY_ARCHETYPE_MAP[tool.category] || 'Cyber Scout',
    }));
  }, []);

  // Category filter list
  const categories = useMemo(() => {
    return ['ALL', ...getAllCategories()];
  }, []);

  // Filtered Tools Pipeline
  const filteredTools = useMemo(() => {
    const query = debouncedQuery.trim().toLowerCase();

    return canonicalTools.filter((tool) => {
      if (selectedCategory !== 'ALL' && tool.category !== selectedCategory) {
        return false;
      }
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

  // Navigation Handler for "Open Tool ↗"
  const handleOpenTool = (tool) => {
    if (tool?.id) {
      navigate(`/toolkit/${tool.id}`);
    }
  };

  // Safe external alternatives modal handler
  const handleViewAlternatives = (tool) => {
    setAlternativeToolModal(tool);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-blue-100">
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* ── Section Header (Authoritative Reference: design img..png) ── */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-mono font-extrabold tracking-widest text-slate-500 uppercase mb-2">
                111 CYBERSECURITY TOOLS
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
                Powerful Tools for a{' '}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Safer Digital World
                </span>
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
                Explore 111+ curated cybersecurity tools with trusted external resources. No complex setup — just click and start.
              </p>
            </div>

            {/* Operator Badge */}
            {user && (
              <div className="self-start sm:self-center shrink-0 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs flex items-center gap-2 text-xs font-medium text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{user.username || 'Operator'}</span>
              </div>
            )}
          </div>

          {/* ── Search Bar ── */}
          <div className="relative w-full max-w-2xl pt-2">
            <div className="absolute inset-y-0 left-0 pl-4 pt-2 flex items-center pointer-events-none text-slate-400">
              <Search size={18} />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools, categories, capabilities... (Press '/' to focus)"
              aria-label="Search tools"
              className="w-full pl-11 pr-20 py-3 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <div className="absolute inset-y-0 right-0 pr-3.5 pt-2 flex items-center gap-1.5">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  aria-label="Clear search"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={16} />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-200">
                  /
                </kbd>
              )}
            </div>
          </div>

          {/* ── Category Filter Pills (Authoritative Reference: design img..png) ── */}
          <div className="w-full overflow-x-auto pb-2 custom-scrollbar">
            <div className="flex items-center gap-2 min-w-max pt-1">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                const count =
                  cat === 'ALL'
                    ? canonicalTools.length
                    : canonicalTools.filter((t) => t.category === cat).length;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all duration-150 border shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border-slate-200 shadow-xs'
                    }`}
                  >
                    <span>{cat === 'ALL' ? `All Tools (${count})` : cat}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Results Info Bar ── */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <div>
            <span className="font-semibold text-slate-800">
              {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'} available
            </span>
            {selectedCategory !== 'ALL' && (
              <span>
                {' '}
                in <span className="font-medium text-slate-800">{selectedCategory}</span>
              </span>
            )}
            {debouncedQuery && (
              <span>
                {' '}
                matching <span className="font-medium text-blue-600">"{debouncedQuery}"</span>
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
              className="font-semibold text-blue-600 hover:text-blue-700 transition-colors underline underline-offset-4"
            >
              Reset filters
            </button>
          )}
        </div>

        {/* ── 4-Column Pastel Tool Grid (Authoritative Reference: design img..png) ── */}
        <ToolGrid
          tools={filteredTools}
          onExternalDiscovery={handleViewAlternatives}
          onOpenTool={handleOpenTool}
          emptyMessage={
            searchQuery || selectedCategory !== 'ALL'
              ? 'No tools match your current search or category filter.'
              : 'No security tools found in catalog.'
          }
        />

        {/* ── External Alternatives Modal ── */}
        <ExternalAlternativesModal
          tool={alternativeToolModal}
          isOpen={Boolean(alternativeToolModal)}
          onClose={() => setAlternativeToolModal(null)}
          onOpenNativeTool={handleOpenTool}
        />
      </main>
    </div>
  );
}