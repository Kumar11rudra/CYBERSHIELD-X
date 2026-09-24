/**

 * 🛠️ ToolkitPage — CyberShield X

 * Modernized Security Tool Discovery & Execution Catalog

 *

 * Features:

 * - Direct visual alignment with the approved dark navy cyber-glass design language (#020814 / #0c162d)

 * - Single source of truth: Consumes canonical 111 tools from toolConfig.js

 * - Search bar with 150ms debounce and keyboard shortcut '/'

 * - Category filter tabs across all 24 canonical security domains with live counts

 * - Responsive 4-column ToolGrid with CyberToolCards

 * - Deep-link support (?category=... query parameter)

 * - Redundant in-modal terminal launcher removed (direct execution routes via /toolkit/:toolId)

 */



import React, { useState, useMemo, useEffect, useRef } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { motion, useReducedMotion } from 'framer-motion';

import { Search, X, Shield, Zap, Filter, Cpu, CheckCircle2, Terminal } from 'lucide-react';

import { getAllTools, getAllCategories } from '../components/toolkit/toolConfig';

import { getCategoryTheme, CATEGORY_ARCHETYPE_MAP } from '../components/toolkit/cards/toolThemes';

import ToolGrid from '../components/toolkit/cards/ToolGrid';

import ExternalAlternativesModal from '../components/toolkit/cards/ExternalAlternativesModal';



export default function ToolkitPage() {

  const location = useLocation();

  const navigate = useNavigate();

  const shouldReduceMotion = useReducedMotion();



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



  // Extract ?category= query parameter if present

  useEffect(() => {

    const params = new URLSearchParams(location.search);

    const cat = params.get('category');

    if (cat) {

      const allCats = getAllCategories();

      const matched = allCats.find(c => c.toLowerCase() === cat.toLowerCase());

      if (matched) {

        setSelectedCategory(matched);

      } else {

        setSelectedCategory('ALL');

      }

    }

  }, [location.search]);



  // Keyboard navigation shortcuts: '/' to focus search, 'Escape' to clear/blur

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

        if (alternativeToolModal) {

          setAlternativeToolModal(null);

        } else if (document.activeElement === searchInputRef.current) {

          if (searchQuery) {

            setSearchQuery('');

          } else {

            searchInputRef.current?.blur();

          }

        }

      }

    };



    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);

  }, [searchQuery, alternativeToolModal]);



  // Canonical 111 tools with avatar archetype

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



  // Category counts

  const categoryCounts = useMemo(() => {

    const counts = { ALL: canonicalTools.length };

    canonicalTools.forEach((tool) => {

      if (tool.category) {

        counts[tool.category] = (counts[tool.category] || 0) + 1;

      }

    });

    return counts;

  }, [canonicalTools]);



  // Filtered Tools Pipeline (Category Filter -> Search Filter)

  const filteredTools = useMemo(() => {

    const query = debouncedQuery.trim().toLowerCase();



    return canonicalTools.filter((tool) => {

      // Category match

      const matchesCategory =

        selectedCategory === 'ALL' ||

        (tool.category &&

          tool.category.toLowerCase() === selectedCategory.toLowerCase());



      if (!matchesCategory) return false;



      // Search match

      if (!query) return true;



      const nameMatch = (tool.name || '').toLowerCase().includes(query);

      const descMatch = (tool.description || '').toLowerCase().includes(query);

      const taglineMatch = (tool.tagline || '').toLowerCase().includes(query);

      const idMatch = (tool.id || '').toLowerCase().includes(query);

      const tagsMatch = Array.isArray(tool.tags)

        ? tool.tags.some((t) => (t || '').toLowerCase().includes(query))

        : false;

      const categoryMatch = (tool.category || '').toLowerCase().includes(query);



      return (

        nameMatch ||

        descMatch ||

        taglineMatch ||

        idMatch ||

        tagsMatch ||

        categoryMatch

      );

    });

  }, [canonicalTools, selectedCategory, debouncedQuery]);



  const handleOpenTool = (tool) => {

    navigate(`/toolkit/${tool.id}`, {

      state: { fromCategory: selectedCategory !== 'ALL' ? selectedCategory : undefined }

    });

  };



  const handleViewAlternatives = (tool) => {

    setAlternativeToolModal(tool);

  };



  return (

    <div className="min-h-screen bg-[#020814] text-slate-100 relative pb-20 overflow-x-hidden font-sans">

      {/* Tactical Glow Backdrops */}

      <div

        aria-hidden="true"

        className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"

      />

      <div

        aria-hidden="true"

        className="pointer-events-none absolute top-1/3 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"

      />



      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 relative z-10 space-y-6">



        {/* Header Banner */}

        <div className="p-6 sm:p-8 rounded-2xl bg-[#0c162d]/80 border border-slate-800/80 backdrop-blur-md shadow-2xl relative overflow-hidden">

          <div

            aria-hidden="true"

            className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-cyan-500/10 via-transparent to-transparent pointer-events-none"

          />



          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">

            <div className="space-y-2 max-w-3xl">

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-medium tracking-wide">

                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />

                <span>CYBER DIAGNOSTIC GRID :: CANONICAL SUITE</span>

              </div>



              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-mono">

                Security Toolkit & Diagnostic Engines

              </h1>



              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">

                Deploy passive recon engines, real-time threat telemetry analyzers, and deep vulnerability audit modules across {categories.length - 1} operational defense categories.

              </p>

            </div>



            {/* Quick Metrics Badges */}

            <div className="flex items-center gap-3 flex-wrap">

              <div className="px-4 py-2.5 rounded-xl bg-[#071126]/90 border border-slate-800 flex items-center gap-3">

                <Shield className="w-5 h-5 text-cyan-400" />

                <div>

                  <div className="text-xs text-slate-400 font-mono uppercase">Total Engines</div>

                  <div className="text-lg font-bold text-white font-mono">{canonicalTools.length}</div>

                </div>

              </div>



              <div className="px-4 py-2.5 rounded-xl bg-[#071126]/90 border border-slate-800 flex items-center gap-3">

                <Cpu className="w-5 h-5 text-emerald-400" />

                <div>

                  <div className="text-xs text-slate-400 font-mono uppercase">Sectors</div>

                  <div className="text-lg font-bold text-white font-mono">{categories.length - 1}</div>

                </div>

              </div>



              <div className="px-4 py-2.5 rounded-xl bg-[#071126]/90 border border-slate-800 flex items-center gap-3">

                <Zap className="w-5 h-5 text-amber-400" />

                <div>

                  <div className="text-xs text-slate-400 font-mono uppercase">Execution</div>

                  <div className="text-lg font-bold text-white font-mono">100% Live</div>

                </div>

              </div>

            </div>

          </div>

        </div>



        {/* Search & Category Filter Section */}

        <section aria-label="Tool Filtering Controls" className="space-y-4">

          {/* Universal Search Bar */}

          <div className="relative">

            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">

              <Search className="w-5 h-5" aria-hidden="true" />

            </div>



            <input

              ref={searchInputRef}

              type="text"

              value={searchQuery}

              onChange={(e) => setSearchQuery(e.target.value)}

              placeholder="Search by tool name, identifier, category, or capability tag (e.g., 'nmap', 'dns', 'whois')..."

              className="w-full pl-11 pr-24 py-3.5 bg-[#0c162d]/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"

              aria-label="Search security tools"

            />



            <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">

              {searchQuery ? (

                <button

                  type="button"

                  onClick={() => {

                    setSearchQuery('');

                    searchInputRef.current?.focus();

                  }}

                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"

                  aria-label="Clear search"

                >

                  <X className="w-4 h-4" />

                </button>

              ) : (

                <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700/80 rounded">

                  /

                </kbd>

              )}

            </div>

          </div>



          {/* Category Tabs Scrollbar */}

          <div

            role="tablist"

            aria-label="Security Tool Categories"

            className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"

          >

            {categories.map((cat) => {

              const isSelected = selectedCategory === cat;

              const count = categoryCounts[cat] || 0;

              const catTheme = cat === 'ALL' ? null : getCategoryTheme(cat);



              return (

                <button

                  key={cat}

                  role="tab"

                  aria-selected={isSelected}

                  onClick={() => setSelectedCategory(cat)}

                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition-all duration-150 flex items-center gap-2 border ${

                    isSelected

                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.25)]'

                      : 'bg-[#0c162d]/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'

                  }`}

                  style={

                    isSelected && catTheme

                      ? {

                          backgroundColor: catTheme.badgeBg,

                          borderColor: catTheme.badgeBorder,

                          color: catTheme.badgeText,

                          boxShadow: `0 0 15px ${catTheme.badgeBorder}`,

                        }

                      : {}

                  }

                >

                  <span>{cat}</span>

                  <span

                    className={`px-1.5 py-0.2 rounded text-[10px] ${

                      isSelected

                        ? 'bg-white/20 text-white font-bold'

                        : 'bg-slate-800 text-slate-400'

                    }`}

                  >

                    {count}

                  </span>

                </button>

              );

            })}

          </div>

        </section>



        {/* Results Metadata Bar */}

        <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800/60 pb-3">

          <div className="flex items-center gap-2">

            <Filter className="w-3.5 h-3.5 text-cyan-400" />

            <span>

              Showing <strong className="text-white font-bold">{filteredTools.length}</strong> of {canonicalTools.length} diagnostic engines

            </span>

            {selectedCategory !== 'ALL' && (

              <span className="hidden sm:inline text-slate-500">

                (filtered by {selectedCategory})

              </span>

            )}

          </div>



          {(searchQuery || selectedCategory !== 'ALL') && (

            <button

              onClick={() => {

                setSearchQuery('');

                setSelectedCategory('ALL');

              }}

              className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"

            >

              Reset Filters

            </button>

          )}

        </div>



        {/* ToolGrid Rendering (Step 4B: External-Only Card Flow) */}

        <ToolGrid

          tools={filteredTools}

          onExternalDiscovery={handleViewAlternatives}

          emptyMessage={

            searchQuery || selectedCategory !== 'ALL'

              ? `No tools match "${searchQuery || selectedCategory}". Try adjusting your search query or selecting "ALL".`

              : 'No security tools registered in the catalog.'

          }

        />



        {/* External Alternatives Modal */}

        <ExternalAlternativesModal

          tool={alternativeToolModal}

          isOpen={Boolean(alternativeToolModal)}

          onClose={() => setAlternativeToolModal(null)}

          onOpenNativeTool={handleOpenTool}

        />

      </div>

    </div>

  );

}
