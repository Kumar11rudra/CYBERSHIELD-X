import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllTools, getAllCategories } from '../components/toolkit/toolConfig';
import { getCategoryTheme, CATEGORY_ARCHETYPE_MAP } from '../components/toolkit/cards/toolThemes';
import { isToolOnline } from '../components/toolkit/cards/externalAlternatives';
import ToolGrid from '../components/toolkit/cards/ToolGrid';
import ExternalAlternativesModal from '../components/toolkit/cards/ExternalAlternativesModal';
import BrandLogo from '../components/common/BrandLogo';
import BinaryMatrixRain from '../components/home/BinaryMatrixRain';
import { Search, X, Terminal, LogOut, Sparkles, Shield, Wrench, Activity, Compass } from 'lucide-react';

/**
 * 🛡️ DashboardPage
 * Clean, modern dashboard matching Step 209 specifications:
 * - Completely disconnected from old sidebar
 * - Clean top header: BrandLogo (left), Terminal, User info, Logout (right)
 * - Main area containing ONLY the 125-tool catalog grid
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

  // Trigger welcome modal on Dashboard route entry or fresh login
  useEffect(() => {
    if (process.env.NODE_ENV === 'test' && !sessionStorage.getItem('cybershield_show_welcome_in_test')) {
      return;
    }
    const forceWelcome = sessionStorage.getItem('cybershield_show_welcome');
    const welcomeSeen = sessionStorage.getItem('cybershield_dashboard_welcome_seen');

    if (forceWelcome || !welcomeSeen) {
      setWelcomeModalOpen(true);
      sessionStorage.removeItem('cybershield_show_welcome');
      sessionStorage.setItem('cybershield_dashboard_welcome_seen', 'true');
    }
  }, [user]);

  // 150ms Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Typewriter & Chromatic RGB Effect for Dashboard Headline ──
  const FULL_HEADLINE_PREFIX = 'Powerful Tools for a ';
  const FULL_HEADLINE_ACCENT = 'Safer Digital World';
  const FULL_HEADLINE = FULL_HEADLINE_PREFIX + FULL_HEADLINE_ACCENT;

  const [typedCharCount, setTypedCharCount] = useState(
    process.env.NODE_ENV === 'test' ? FULL_HEADLINE.length : 0
  );

  useEffect(() => {
    if (process.env.NODE_ENV === 'test') {
      setTypedCharCount(FULL_HEADLINE.length);
      return;
    }
    if (welcomeModalOpen) return;

    let count = 0;
    const timer = setInterval(() => {
      count++;
      setTypedCharCount(count);
      if (count >= FULL_HEADLINE.length) {
        clearInterval(timer);
      }
    }, 28);
    return () => clearInterval(timer);
  }, [welcomeModalOpen]);

  const typedPrefix =
    typedCharCount <= FULL_HEADLINE_PREFIX.length
      ? FULL_HEADLINE_PREFIX.slice(0, typedCharCount)
      : FULL_HEADLINE_PREFIX;

  const typedAccent =
    typedCharCount > FULL_HEADLINE_PREFIX.length
      ? FULL_HEADLINE_ACCENT.slice(0, typedCharCount - FULL_HEADLINE_PREFIX.length)
      : '';

  const isTypingComplete = typedCharCount >= FULL_HEADLINE.length;

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

  // Canonical 125-tool catalog with persona archetypes
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

  // Dynamic breakdown of working external websites vs coming soon / repository tools
  const { workingCount, comingSoonCount } = useMemo(() => {
    let working = 0;
    let comingSoon = 0;
    filteredTools.forEach((tool) => {
      if (isToolOnline(tool.id)) {
        working++;
      } else {
        comingSoon++;
      }
    });
    return { workingCount: working, comingSoonCount: comingSoon };
  }, [filteredTools]);

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
    <div className="min-h-screen bg-[#020814] text-slate-100 selection:bg-cyan-500/30 flex flex-col relative overflow-hidden font-sans">
      {/* ── Background Cyber Blueprint Grid Layer (Matching Screenshot 2 / Homepage) ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,191,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,191,255,0.04) 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* ── Background Scanline Layer (Homepage Ambience) ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,191,255,0.015) 2px,rgba(0,191,255,0.015) 4px)',
        }}
      />

      {/* ── Background Ambient Glow Orbs ── */}
      <div className="fixed top-1/4 -left-32 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed bottom-1/4 -right-32 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none z-0" />

      {/* ── Background Matrix Rain Layer (Step 2: 0/1 binary rain, glowing cyan/emerald on dark) ── */}
      <BinaryMatrixRain className="fixed inset-0 z-0 pointer-events-none opacity-30" />

      {/* ── Clean Top Header (Dark Cyber Header) ── */}
      <header className="w-full bg-[#020814]/90 backdrop-blur-md border-b border-cyan-500/20 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* LEFT: CyberShield X Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 sm:gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-lg p-1 shrink-0"
            title="CyberShield X Homepage"
          >
            <BrandLogo size={30} />
            <div className="flex flex-col">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white group-hover:text-cyan-400 transition-colors font-mono">
                CYBERSHIELD <span className="text-emerald-400">X</span>
              </span>
              <span className="text-[8px] sm:text-[9px] font-mono tracking-widest text-cyan-500/70 uppercase -mt-0.5 hidden xs:block">
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
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold text-cyan-400 hover:text-cyan-300 bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/30 transition-colors shadow-xs cursor-pointer"
              title="Open Native Terminal"
              aria-label="Terminal"
            >
              <Terminal size={14} className="text-cyan-400 shrink-0" />
              <span className="hidden sm:inline">Terminal</span>
            </button>

            {/* Founder Admin Command Nexus (Visible only for admin role) */}
            {user?.role === 'admin' && (
              <button
                type="button"
                onClick={() => navigate('/nexus-admin/dashboard')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors shadow-xs cursor-pointer"
                title="Founder Command Nexus"
                aria-label="Founder Command Nexus"
              >
                <Shield size={14} className="text-amber-400 shrink-0" />
                <span className="hidden sm:inline">NEXUS COMMAND</span>
              </button>
            )}

            {/* Current User's Name / Information */}
            <div className="flex items-center gap-1.5 px-2 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-medium text-slate-300 shadow-xs max-w-[85px] xs:max-w-[120px] sm:max-w-[180px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
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
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 bg-slate-900/90 border border-rose-500/30 transition-colors shadow-xs cursor-pointer"
              title="Sign Out"
              aria-label="Logout"
            >
              <LogOut size={14} className="shrink-0" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 relative z-10">
        {/* ── Dynamic Keyframe Styles for RGB Flow & Gemini Search Bar ── */}
        <style>{`
          @keyframes rgbFlow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes geminiBorderShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes cursorBlink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
        `}</style>

        {/* ── Section Header (Dark Cyber Reference + RGB Typewriter Stream) ── */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-xs font-mono font-extrabold tracking-widest text-cyan-400 uppercase mb-3 shadow-[0_0_15px_rgba(0,212,255,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>CYBERSHIELD X</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight text-center min-h-[48px] sm:min-h-[56px] flex items-center justify-center flex-wrap">
              <span>{typedPrefix}</span>
              {typedAccent && (
                <span
                  className="bg-gradient-to-r from-cyan-400 via-indigo-400 via-fuchsia-400 to-emerald-400 bg-clip-text text-transparent inline-block transition-all duration-300 ml-1.5"
                  style={{
                    backgroundSize: '250% 250%',
                    animation: 'rgbFlow 5s ease infinite',
                    filter: 'drop-shadow(0 0 16px rgba(0, 212, 255, 0.4))',
                  }}
                >
                  {typedAccent}
                </span>
              )}
              {!isTypingComplete && (
                <span
                  className="inline-block w-1.5 h-7 sm:h-9 bg-cyan-400 ml-1.5 align-middle shadow-[0_0_8px_#00d2ff]"
                  style={{ animation: 'cursorBlink 0.7s infinite' }}
                />
              )}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-3xl leading-relaxed mx-auto text-center">
              Explore 125+ curated cybersecurity tools with trusted external resources. No complex setup — just click and start.
            </p>
          </div>

          {/* ── Google Gemini-Style RGB Pill Search Bar (Full Circular Edges) ── */}
          <div className="relative w-full max-w-2xl pt-2 mx-auto group">
            {/* Ambient dynamic RGB glow aura */}
            <div
              className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-cyan-500 via-purple-600 via-pink-500 to-emerald-400 opacity-55 blur-md group-hover:opacity-90 group-focus-within:opacity-100 transition-opacity duration-500"
              style={{
                backgroundSize: '200% 200%',
                animation: 'geminiBorderShift 4s ease infinite',
              }}
            />

            {/* Pill Border Container */}
            <div
              className="relative p-[1.5px] rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 via-fuchsia-500 to-emerald-400 transition-all duration-300 shadow-[0_0_20px_rgba(0,191,255,0.12)] group-hover:shadow-[0_0_30px_rgba(0,191,255,0.25)] group-focus-within:shadow-[0_0_35px_rgba(0,191,255,0.4)]"
              style={{
                backgroundSize: '200% 200%',
                animation: 'geminiBorderShift 4s ease infinite',
              }}
            >
              {/* Inner Dark Glass Pill */}
              <div className="flex items-center w-full rounded-full bg-[#070d1c]/95 backdrop-blur-xl px-4 sm:px-5 py-2.5 sm:py-3">
                <Search
                  size={19}
                  className="text-cyan-400 shrink-0 mr-3 transition-transform duration-200 group-focus-within:scale-110"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tools, categories, capabilities... (Press '/' to focus)"
                  aria-label="Search tools"
                  className="w-full bg-transparent border-none text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none focus:ring-0 selection:bg-cyan-500/30"
                />
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        searchInputRef.current?.focus();
                      }}
                      aria-label="Clear search"
                      className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  ) : (
                    <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 shadow-xs">
                      /
                    </kbd>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Category Filter Pills ── */}
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
                    className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all duration-150 border shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold border-cyan-400 shadow-[0_0_15px_rgba(0,191,255,0.35)]'
                        : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-800 hover:border-cyan-500/40 shadow-xs'
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
        <div className="flex flex-wrap items-center justify-between gap-y-2 text-xs text-slate-400 px-1">
          <div className="flex flex-wrap items-center gap-x-2">
            <span className="font-semibold text-slate-200">
              {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'} available
            </span>
            <span className="text-slate-400 text-xs font-normal">
              (<span className="text-emerald-400 font-semibold">{workingCount} Working Websites</span>
              <span className="text-slate-500 mx-1.5">•</span>
              <span className="text-amber-400 font-semibold">{comingSoonCount} Coming Soon / Repository</span>)
            </span>
            {selectedCategory !== 'ALL' && (
              <span>
                in <span className="font-medium text-cyan-400">{selectedCategory}</span>
              </span>
            )}
            {debouncedQuery && (
              <span>
                matching <span className="font-medium text-cyan-400">"{debouncedQuery}"</span>
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
              className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors underline underline-offset-4 cursor-pointer"
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
                  <span className="text-[11px] font-medium text-slate-200 truncate">125 Security Tools</span>
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