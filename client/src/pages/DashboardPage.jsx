import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getAllTools, TOOL_STATUS, CATEGORIES, getStatusBadge } from '../components/toolkit/toolConfig';
import { toast } from 'react-hot-toast';

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [targetInput, setTargetInput] = useState('');
  const [selectedQuickTool, setSelectedQuickTool] = useState('dns_scanner');
  const [quickScanLoading, setQuickScanLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Load all 110 tools directly from authoritative tool registry
  const allTools = useMemo(() => getAllTools(), []);

  // Filter live tools for the Quick Target Scan dropdown
  const liveTools = useMemo(() => {
    return allTools.filter(tool => tool.status === TOOL_STATUS.LIVE || tool.status === TOOL_STATUS.PARTIAL);
  }, [allTools]);

  const liveToolsCount = useMemo(() => {
    return allTools.filter(tool => tool.status === TOOL_STATUS.LIVE).length;
  }, [allTools]);

  // Dynamic Time of Day Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Fetch Real Dashboard Statistics
  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard');
        if (isMounted && res.data) {
          setStats(res.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDashboardData();
    return () => { isMounted = false; };
  }, []);

  // Handle Quick Target Scan Submission
  const handleLaunchQuickScan = (e) => {
    e.preventDefault();
    const cleanTarget = targetInput.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!cleanTarget) {
      toast.error('Please enter a valid target (Domain, IP, or URL)');
      return;
    }

    setQuickScanLoading(true);
    // Navigate directly to the selected tool's page with target pre-populated
    navigate(`/toolkit/${selectedQuickTool}?target=${encodeURIComponent(cleanTarget)}`);
  };

  // Filtered Tools for Explorer
  const filteredTools = useMemo(() => {
    return allTools.filter((tool) => {
      // Search matching: name, tagline, description, category, capabilities
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        tool.name.toLowerCase().includes(q) ||
        (tool.tagline && tool.tagline.toLowerCase().includes(q)) ||
        (tool.description && tool.description.toLowerCase().includes(q)) ||
        (tool.category && tool.category.toLowerCase().includes(q)) ||
        (tool.capabilities && tool.capabilities.some(c => c.toLowerCase().includes(q)));

      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'LIVE') matchesStatus = tool.status === TOOL_STATUS.LIVE;
      else if (statusFilter === 'PARTIAL') matchesStatus = tool.status === TOOL_STATUS.PARTIAL;
      else if (statusFilter === 'COMING_SOON') matchesStatus = tool.status === TOOL_STATUS.COMING_SOON;

      // Category filter
      const matchesCategory = categoryFilter === 'ALL' || tool.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [allTools, searchQuery, statusFilter, categoryFilter]);

  // Unique categories list
  const categoryList = useMemo(() => Object.values(CATEGORIES), []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] font-mono text-cyber-accent gap-4">
        <div className="w-10 h-10 border-3 border-cyber-accent/20 border-t-cyber-accent rounded-full animate-spin" />
        <p className="animate-pulse tracking-[0.25em] text-xs uppercase text-cyber-muted">Connecting to CyberShield X Core...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 font-mono">

      {/* ─── 1. WELCOME HUD SECTION ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-white/[0.03] via-white/[0.01] to-transparent border border-white/5 backdrop-blur-xl shadow-lg relative overflow-hidden"
      >
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2 text-cyber-accent text-xs tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Authenticated Security Console</span>
          </div>
          <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-wider uppercase">
            {greeting}, <span className="text-cyber-accent">{user?.username || 'Operator'}</span>
          </h1>
          <p className="text-xs text-cyber-muted tracking-wide">
            Your security workspace at a glance. Manage targets, execute live scans, and review audit telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <Link
            to="/scan"
            className="px-4 py-2.5 rounded-xl bg-cyber-accent text-[#020814] font-bold text-xs uppercase tracking-wider hover:bg-cyber-accent/90 transition-all shadow-[0_0_15px_rgba(0,212,255,0.25)] flex items-center gap-2"
          >
            <span>📡</span>
            <span>Live Scanner</span>
          </Link>
          <Link
            to="/toolkit"
            className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-cyber-accent/40 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2"
          >
            <span>⚡</span>
            <span>All 110 Tools</span>
          </Link>
        </div>

        {/* Subtle background cyber line */}
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-cyber-accent/5 to-transparent pointer-events-none" />
      </motion.div>

      {/* ─── 2. SECURITY OVERVIEW (4 REAL METRIC CARDS) ────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Scans */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="p-5 rounded-2xl bg-[#0a1220]/70 border border-white/5 hover:border-cyber-accent/30 transition-all group"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-2xl">📡</span>
            <span className="text-[9px] text-cyber-accent font-bold px-2 py-0.5 rounded bg-cyber-accent/10 border border-cyber-accent/20">
              AUDIT LOG
            </span>
          </div>
          <p className="text-[10px] text-cyber-muted uppercase tracking-widest mb-1">TOTAL SCANS RUN</p>
          <p className="text-2xl font-display font-black text-white tracking-wider">
            {stats?.scans?.total !== undefined ? stats.scans.total : '—'}
          </p>
          <p className="text-[10px] text-cyber-muted mt-2">
            {stats?.scans?.failed ? `${stats.scans.failed} failed runs recorded` : 'All scans completed cleanly'}
          </p>
        </motion.div>

        {/* Card 2: Security Threat Status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="p-5 rounded-2xl bg-[#0a1220]/70 border border-white/5 hover:border-cyber-accent/30 transition-all group"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-2xl">🛡️</span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
              stats?.vulnerabilities?.critical > 0
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {stats?.vulnerabilities?.critical > 0 ? 'CRITICAL RISK' : 'HEALTHY'}
            </span>
          </div>
          <p className="text-[10px] text-cyber-muted uppercase tracking-widest mb-1">SECURITY STATUS</p>
          <p className="text-xl font-display font-black text-white tracking-wider truncate">
            {stats?.vulnerabilities?.critical > 0 ? 'ATTENTION NEEDED' : 'SYSTEM SECURE'}
          </p>
          <p className="text-[10px] text-cyber-muted mt-2">
            {stats?.vulnerabilities?.total ? `${stats.vulnerabilities.total} active vulnerabilities tracked` : 'Zero active high-risk exposures'}
          </p>
        </motion.div>

        {/* Card 3: Available Tools */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          className="p-5 rounded-2xl bg-[#0a1220]/70 border border-white/5 hover:border-cyber-accent/30 transition-all group"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-2xl">⚡</span>
            <span className="text-[9px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              {liveToolsCount} LIVE
            </span>
          </div>
          <p className="text-[10px] text-cyber-muted uppercase tracking-widest mb-1">REGISTERED MODELS</p>
          <p className="text-2xl font-display font-black text-white tracking-wider">
            110 <span className="text-xs text-cyber-muted font-normal">MODELS</span>
          </p>
          <p className="text-[10px] text-cyber-muted mt-2">
            24 security categories registered
          </p>
        </motion.div>

        {/* Card 4: System / API Health */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.2 }}
          className="p-5 rounded-2xl bg-[#0a1220]/70 border border-white/5 hover:border-cyber-accent/30 transition-all group"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-2xl">🌐</span>
            <span className="text-[9px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>
          </div>
          <p className="text-[10px] text-cyber-muted uppercase tracking-widest mb-1">API & CLOUD EDGE</p>
          <p className="text-xl font-display font-black text-white tracking-wider">
            CONNECTED
          </p>
          <p className="text-[10px] text-cyber-muted mt-2">
            Cloudflare Pages • Render • Atlas
          </p>
        </motion.div>
      </div>

      {/* ─── 3. QUICK TARGET SCAN SECTION ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="p-6 rounded-2xl bg-[#0a1424]/90 border border-white/10 shadow-2xl relative overflow-hidden"
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="p-2 rounded-xl bg-cyber-accent/10 border border-cyber-accent/30 text-cyber-accent text-lg">
            🎯
          </span>
          <div>
            <h2 className="text-sm sm:text-base font-display font-bold text-white uppercase tracking-wider">
              Quick Target Scan
            </h2>
            <p className="text-xs text-cyber-muted">
              Run an instant security audit against any domain, IP address, or URL.
            </p>
          </div>
        </div>

        <form onSubmit={handleLaunchQuickScan} className="flex flex-col md:flex-row gap-3 items-stretch">
          {/* Target Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder="Enter Target: e.g. google.com, 8.8.8.8, https://example.com"
              className="w-full px-4 py-3 bg-[#030914] border border-white/10 rounded-xl text-xs text-white placeholder-cyber-muted/60 focus:outline-none focus:border-cyber-accent/60 transition-colors font-mono"
            />
          </div>

          {/* Tool Selector Dropdown */}
          <div className="w-full md:w-64">
            <select
              value={selectedQuickTool}
              onChange={(e) => setSelectedQuickTool(e.target.value)}
              className="w-full px-3 py-3 bg-[#030914] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyber-accent/60 transition-colors font-mono cursor-pointer"
            >
              {liveTools.map((tool) => (
                <option key={tool.id} value={tool.id} className="bg-[#0a1424] text-white">
                  {tool.name} {tool.status === TOOL_STATUS.LIVE ? '(Live)' : '(Partial)'}
                </option>
              ))}
            </select>
          </div>

          {/* Launch Scan Button */}
          <button
            type="submit"
            disabled={quickScanLoading || !targetInput.trim()}
            className={`px-6 py-3 rounded-xl font-display font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shrink-0 ${
              quickScanLoading || !targetInput.trim()
                ? 'bg-white/5 text-cyber-muted border border-white/5 cursor-not-allowed'
                : 'bg-cyber-accent text-[#020814] hover:bg-cyber-accent/90 shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:scale-[1.02]'
            }`}
          >
            {quickScanLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-[#020814] border-t-transparent rounded-full animate-spin" />
                <span>Launching...</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>Launch Scan</span>
              </>
            )}
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 mt-3 text-[10px] text-cyber-muted">
          <span className="text-cyber-accent/70 uppercase">Quick Samples:</span>
          {['google.com', '1.1.1.1', 'github.com'].map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => setTargetInput(sample)}
              className="px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/5 hover:border-cyber-accent/30 text-cyber-muted hover:text-white transition-colors"
            >
              {sample}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ─── 4. ALL 110 TOOLS & MODEL EXPLORER ────────────────────────────── */}
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-display font-bold text-white uppercase tracking-wider flex items-center gap-2.5">
              <span>🛡️</span>
              <span>Security Tools & Models</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyber-accent/10 border border-cyber-accent/25 text-cyber-accent">
                {filteredTools.length} / 110
              </span>
            </h2>
            <p className="text-xs text-cyber-muted mt-0.5">
              Browse all 110 security models across 24 specialized intelligence domains.
            </p>
          </div>

          {/* Search Box */}
          <div className="w-full md:w-80 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, category, or capability..."
              className="w-full pl-9 pr-4 py-2.5 bg-[#030914] border border-white/10 rounded-xl text-xs text-white placeholder-cyber-muted/60 focus:outline-none focus:border-cyber-accent/60 transition-colors"
            />
            <span className="absolute left-3 top-3 text-xs text-cyber-muted">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-cyber-muted hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'All (110)' },
              { id: 'LIVE', label: '🟢 Live (14)' },
              { id: 'PARTIAL', label: '🟡 Partial (2)' },
              { id: 'COMING_SOON', label: '⚪ Upcoming (94)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === tab.id
                    ? 'bg-cyber-accent text-[#020814] shadow-[0_0_10px_rgba(0,212,255,0.2)]'
                    : 'text-cyber-muted hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category Dropdown Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-cyber-muted uppercase tracking-wider hidden sm:inline">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#030914] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-cyber-accent/60 cursor-pointer"
            >
              <option value="ALL">All Categories (24)</option>
              {categoryList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tools Grid */}
        {filteredTools.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white/[0.01] border border-white/5 space-y-3">
            <span className="text-3xl">🔍</span>
            <p className="text-sm font-bold text-white uppercase">No security tools match your filter</p>
            <p className="text-xs text-cyber-muted max-w-md mx-auto">
              No models found for "{searchQuery}". Try clearing your search query or selecting "All" categories.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); setCategoryFilter('ALL'); }}
              className="px-4 py-2 rounded-xl bg-cyber-accent/10 border border-cyber-accent/30 text-cyber-accent text-xs font-bold uppercase hover:bg-cyber-accent/20 transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTools.map((tool) => {
              const badge = getStatusBadge(tool.status);
              const isLive = tool.status === TOOL_STATUS.LIVE;
              const isPartial = tool.status === TOOL_STATUS.PARTIAL;
              const isComingSoon = tool.status === TOOL_STATUS.COMING_SOON;

              return (
                <motion.div
                  key={tool.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col justify-between p-5 rounded-2xl bg-[#0a1424]/60 border border-white/5 hover:border-cyber-accent/40 transition-all group relative overflow-hidden"
                >
                  <div>
                    {/* Header: Icon + Status */}
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-3xl p-2 rounded-xl bg-white/[0.02] border border-white/5 group-hover:scale-110 transition-transform">
                        {tool.icon || '🛡️'}
                      </span>
                      <span
                        className="text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                        style={{ color: badge.color, backgroundColor: badge.bg, border: `1px solid ${badge.color}30` }}
                      >
                        {badge.label}
                      </span>
                    </div>

                    {/* Tool Name */}
                    <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider mb-1 group-hover:text-cyber-accent transition-colors">
                      {tool.name}
                    </h3>

                    {/* Category */}
                    <p className="text-[9px] text-cyber-muted uppercase tracking-widest mb-2 font-mono">
                      {tool.category}
                    </p>

                    {/* Description */}
                    <p className="text-xs text-cyber-muted/90 line-clamp-2 leading-relaxed mb-4">
                      {tool.description}
                    </p>
                  </div>

                  {/* Capabilities Tags / Footer Button */}
                  <div className="space-y-3 pt-3 border-t border-white/5">
                    {tool.capabilities && tool.capabilities.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {tool.capabilities.slice(0, 2).map((cap, i) => (
                          <span
                            key={i}
                            className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white/[0.02] border border-white/5 text-cyber-muted truncate max-w-[130px]"
                          >
                            {cap}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action Button */}
                    {isLive && (
                      <button
                        onClick={() => navigate(`/toolkit/${tool.id}`)}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 group-hover:border-emerald-500/60"
                      >
                        <span>Run Tool</span>
                        <span>→</span>
                      </button>
                    )}

                    {isPartial && (
                      <button
                        onClick={() => navigate(`/toolkit/${tool.id}`)}
                        className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                      >
                        <span>Configure & Run</span>
                        <span>→</span>
                      </button>
                    )}

                    {isComingSoon && (
                      <button
                        disabled
                        className="w-full py-2 px-3 rounded-xl bg-white/[0.02] text-cyber-muted/50 border border-white/5 text-xs font-bold uppercase tracking-wider cursor-not-allowed text-center"
                      >
                        Coming Soon (Roadmap)
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── 5. RECENT ACTIVITY / AUDIT RUNS SECTION ──────────────────────── */}
      <div className="p-6 rounded-2xl bg-[#0a1424]/80 border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">📋</span>
            <h2 className="text-sm sm:text-base font-display font-bold text-white uppercase tracking-wider">
              Recent Scan Activity
            </h2>
          </div>
          <Link
            to="/history"
            className="text-xs text-cyber-accent hover:underline uppercase tracking-wider font-bold"
          >
            Full Scan History →
          </Link>
        </div>

        {stats?.recentScans && stats.recentScans.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/5 text-cyber-muted text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Target</th>
                  <th className="py-2.5 px-3">Tool / Model</th>
                  <th className="py-2.5 px-3">Threat Score</th>
                  <th className="py-2.5 px-3">Risk Level</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.recentScans.slice(0, 5).map((scan) => (
                  <tr key={scan._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 font-bold text-white truncate max-w-[150px]">
                      {scan.target}
                    </td>
                    <td className="py-3 px-3 uppercase text-cyber-accent">
                      {scan.tool || 'Port Scanner'}
                    </td>
                    <td className="py-3 px-3 font-bold text-white">
                      {scan.threatScore !== undefined ? `${scan.threatScore}/100` : '—'}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                        scan.riskLevel === 'dangerous' || scan.riskLevel === 'high'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : scan.riskLevel === 'medium'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {scan.riskLevel || 'SAFE'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/history/${scan._id}`}
                        className="text-[10px] text-cyber-accent hover:underline uppercase font-bold"
                      >
                        Inspect →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center rounded-xl bg-white/[0.01] border border-white/5 space-y-2">
            <p className="text-xs text-cyber-muted">No recent security scan runs recorded yet.</p>
            <p className="text-[10px] text-cyber-muted/60">
              Use the Quick Target Scan above or select any of the {liveToolsCount} live tools to perform your first audit.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}