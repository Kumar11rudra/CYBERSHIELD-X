import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllTools, getAllCategories } from '../components/toolkit/toolConfig';
import { getCategoryTheme, CATEGORY_ARCHETYPE_MAP } from '../components/toolkit/cards/toolThemes';
import ToolGrid from '../components/toolkit/cards/ToolGrid';
import ExternalAlternativesModal from '../components/toolkit/cards/ExternalAlternativesModal';
import BrandLogo from '../components/common/BrandLogo';
import { Search, X, Terminal, LogOut, Sparkles, Shield, Wrench, Activity, Compass } from 'lucide-react';

/**
 * 🛡️ DashboardPage
 * Clean, modern dashboard matching Step 209 specifications:
 * - Completely disconnected from old sidebar
 * - Clean top header: BrandLogo (left), Terminal, User info, Logout (right)
 * - Main area containing ONLY the 111-tool catalog grid
 * - 4-column responsive grid with colorful pastel cards
 */
export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [alternativeToolModal, setAlternativeToolModal] = useState(null);

  // FIX #5: Full-screen centered welcome modal on Dashboard route entry
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);

  const searchInputRef = useRef(null);

  // Trigger welcome modal on Dashboard route entry (once per session, not on search/filter/re-renders)
  useEffect(() => {
    if (process.env.NODE_ENV === 'test' && !sessionStorage.getItem('cybershield_show_welcome_in_test')) {
      return;
    }
    const welcomeSeen = sessionStorage.getItem('cybershield_dashboard_welcome_seen');
    if (!welcomeSeen) {
      setWelcomeModalOpen(true);
      sessionStorage.setItem('cybershield_dashboard_welcome_seen', 'true');
    }
  }, []);

  // 150ms Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Keyboard Shortcuts: '/' to focus search, 'Escape' to clear or close modal
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
        if (welcomeModalOpen) {
          setWelcomeModalOpen(false);
        } else if (document.activeElement === searchInputRef.current) {
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
  }, [searchQuery, alternativeToolModal, welcomeModalOpen]);

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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-blue-100 flex flex-col">
      {/* ── Clean Top Header (Step 209: BrandLogo on left, Terminal, User info, Logout on right) ── */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* LEFT: CyberShield X Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 sm:gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-1 shrink-0"
            title="CyberShield X Homepage"
          >
            <BrandLogo size={30} />
            <div className="flex flex-col">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors font-mono">
                CYBERSHIELD <span className="text-emerald-500">X</span>
              </span>
              <span className="text-[8px] sm:text-[9px] font-mono tracking-widest text-slate-500 uppercase -mt-0.5 hidden xs:block">
                CYBER DEFENSE
              </span>
            </div>
          </Link>

          {/* RIGHT: Terminal, User Info, Logout */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Terminal (Top-Header Only) */}
            <button
              type="button"
              onClick={() => navigate('/terminal')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors shadow-xs cursor-pointer"
              title="Open Native Terminal"
              aria-label="Terminal"
            >
              <Terminal size={14} className="text-blue-600 shrink-0" />
              <span className="hidden sm:inline">Terminal</span>
            </button>

            {/* Current User's Name / Information */}
            <div className="flex items-center gap-1.5 px-2 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 shadow-xs max-w-[85px] xs:max-w-[120px] sm:max-w-[180px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
              <span className="font-mono truncate">
                {user?.username || user?.name || user?.email || 'Operator'}
              </span>
            </div>

            {/* Logout */}
            <button
              type="button"
              onClick={async () => {
                await logout?.();
                navigate('/login');
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors shadow-xs cursor-pointer"
              title="Sign Out"
              aria-label="Logout"
            >
              <LogOut size={14} className="shrink-0" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* ── Section Header (Authoritative Reference: design img..png) ── */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex flex-col items-center text-center">
            <div className="text-xs sm:text-sm font-mono font-extrabold tracking-widest text-blue-600 uppercase mb-2">
              CYBERSHIELD X
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight text-center">
              Powerful Tools for a{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Safer Digital World
              </span>
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed mx-auto text-center">
              Explore 111+ curated cybersecurity tools with trusted external resources. No complex setup — just click and start.
            </p>
          </div>

          {/* ── Search Bar ── */}
          <div className="relative w-full max-w-2xl pt-2 mx-auto">
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
            <div className="flex items-center justify-start sm:justify-center gap-2 min-w-max pt-1">
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

        {/* ── Refined Compact Centered Welcome Popup ── */}
        {welcomeModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-dialog-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) setWelcomeModalOpen(false);
            }}
          >
            <div
              className="relative w-full max-w-[460px] bg-[#0c1322] border border-cyan-500/30 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_30px_rgba(6,182,212,0.15)] text-center text-white space-y-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Subtle decorative glow accents */}
              <div className="absolute -top-12 -left-12 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Close X button in top right */}
              <button
                type="button"
                onClick={() => setWelcomeModalOpen(false)}
                aria-label="Close welcome popup"
                title="Close"
                className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              {/* Brand Logo & Pill */}
              <div className="flex flex-col items-center gap-1.5 pt-1">
                <BrandLogo size={40} />
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
                  <Shield size={11} className="text-cyan-400" />
                  <span>CYBERSHIELD X PLATFORM</span>
                </div>
              </div>

              {/* Welcome Title & Dynamic Username */}
              <div className="space-y-1">
                <h2 id="welcome-dialog-title" className="text-xl sm:text-2xl font-black text-white tracking-wider uppercase font-display">
                  WELCOME
                </h2>
                <p className="text-sm sm:text-base text-slate-300 font-medium">
                  Welcome,{' '}
                  <span className="font-mono font-bold text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 inline-block max-w-[220px] sm:max-w-[260px] truncate align-bottom">
                    {user?.username || user?.name || (user?.email ? user.email.split('@')[0] : 'Operator')}
                  </span>
                </p>
              </div>

              {/* Website Introduction */}
              <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed max-w-sm mx-auto">
                CyberShield X is a security intelligence platform built to help you explore cybersecurity tools, analyze threats, and access trusted security resources from one workspace.
              </p>

              {/* Compact Capability Highlights */}
              <div className="grid grid-cols-2 gap-2 text-left pt-1">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/10">
                  <Wrench size={13} className="text-cyan-400 shrink-0" />
                  <span className="text-[11px] font-medium text-slate-200 truncate">111 Security Tools</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/10">
                  <Shield size={13} className="text-emerald-400 shrink-0" />
                  <span className="text-[11px] font-medium text-slate-200 truncate">Threat Intelligence</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/10">
                  <Activity size={13} className="text-indigo-400 shrink-0" />
                  <span className="text-[11px] font-medium text-slate-200 truncate">Security Analysis</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/10">
                  <Compass size={13} className="text-amber-400 shrink-0" />
                  <span className="text-[11px] font-medium text-slate-200 truncate">Trusted Resources</span>
                </div>
              </div>

              {/* Bottom Action */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setWelcomeModalOpen(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-cyan-900/30 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400/50 cursor-pointer"
                >
                  Enter Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}