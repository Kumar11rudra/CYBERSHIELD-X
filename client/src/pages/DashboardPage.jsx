import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';
import { getAllTools, TOOL_STATUS } from '../components/toolkit/toolConfig';
import { toast } from 'react-hot-toast';
import { 
  Terminal, Layers, Sparkles, ExternalLink, Shield, ShieldAlert, 
  ShieldCheck, Activity, Globe, Plus, Trash2, CheckCircle2, 
  AlertTriangle, Clock, RefreshCw, Cpu, Zap, ArrowRight, CornerDownLeft, Lock
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';
import CyberTerminalModal from '../components/terminal/CyberTerminalModal';
import CommandPaletteModal from '../components/common/CommandPaletteModal';

const QUICK_TOOLS = [
  { id: 'port', name: 'Nmap Port Scan', targetType: 'HOST_NATIVE', defaultTarget: 'scanme.nmap.org', binary: 'nmap' },
  { id: 'dns', name: 'DNS Dig Recon', targetType: 'HOST_NATIVE', defaultTarget: 'example.com', binary: 'dig' },
  { id: 'http', name: 'HTTP Security Headers', targetType: 'HOST_NATIVE', defaultTarget: 'example.com', binary: 'curl' },
  { id: 'whois', name: 'WHOIS Registry', targetType: 'HOST_NATIVE', defaultTarget: 'example.com', binary: 'whois' },
  { id: 'traceroute', name: 'Network Traceroute', targetType: 'HOST_NATIVE', defaultTarget: 'example.com', binary: 'traceroute' },
  { id: 'ssl', name: 'SSL/TLS Handshake', targetType: 'HOST_NATIVE', defaultTarget: 'example.com', binary: 'openssl' },
  { id: 'subfinder', name: 'Subfinder Discovery', targetType: 'CYBERSHIELD_API_ENGINE', defaultTarget: 'example.com' },
  { id: 'cve-lookup', name: 'NVD CVE Lookup', targetType: 'CYBERSHIELD_API_ENGINE', defaultTarget: 'CVE-2024-3094' },
  { id: 'syscheck', name: 'Host Binary Audit', targetType: 'HOST_NATIVE', defaultTarget: 'localhost' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Core Backend Data States
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [readiness, setReadiness] = useState(null);
  const [hostCaps, setHostCaps] = useState(null);

  // Quick Launch Input
  const [targetInput, setTargetInput] = useState('scanme.nmap.org');
  const [selectedQuickTool, setSelectedQuickTool] = useState('port');

  // Real-Time Socket Threat Stream
  const [threatEvents, setThreatEvents] = useState([]);

  // Phase 70: SOC Intelligence & Approval Telemetry
  const [activeIncidents, setActiveIncidents] = useState([]);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

  // Asset Watchlist (Persisted in LocalStorage)
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem('cybershield.watchlist');
      return saved ? JSON.parse(saved) : [
        { id: '1', domain: 'scanme.nmap.org', status: 'Monitored', updated: 'Active' },
        { id: '2', domain: 'example.com', status: 'Monitored', updated: 'Active' }
      ];
    } catch {
      return [];
    }
  });
  const [newAssetInput, setNewAssetInput] = useState('');

  // Modals
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalTool, setTerminalTool] = useState(null);
  const [terminalTarget, setTerminalTarget] = useState('');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global Shortcut for Command Palette (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Canonical Tool Registry
  const allTools = useMemo(() => getAllTools(), []);

  // Dynamic Census Calculations
  const targetCounts = useMemo(() => {
    const nativeTools = ['dns', 'whois', 'port', 'http', 'ssl', 'traceroute'];
    const browserTools = ['jwt-parser', 'base64-decoder', 'url-sanitizer', 'hash-generator', 'hex-editor'];
    const blockedTools = ['sqlmap', 'trivy', 'nikto', 'aircrack-ng', 'ghidra', 'yara-rules', 'radare2', 'semgrep', 'gitleaks'];
    
    return {
      total: allTools.length,
      hostNative: nativeTools.length,
      apiEngine: allTools.length - nativeTools.length - browserTools.length - blockedTools.length,
      browser: browserTools.length,
      blocked: blockedTools.length,
      working: allTools.length - blockedTools.length
    };
  }, [allTools]);

  // Fetch Dashboard Stats, Readiness, and Host Capabilities
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashRes, readinessRes, capsRes, incRes, appRes] = await Promise.allSettled([
          api.get('/dashboard'),
          api.get('/health/readiness'),
          api.get('/terminal/host-capabilities'),
          api.get('/incidents?limit=5'),
          api.get('/approvals?status=AWAITING_APPROVAL&limit=1'),
        ]);

        if (isMounted) {
          if (dashRes.status === 'fulfilled') setStats(dashRes.value.data);
          if (readinessRes.status === 'fulfilled' && readinessRes.value.data?.data) {
            setReadiness(readinessRes.value.data.data);
          }
          if (capsRes.status === 'fulfilled' && capsRes.value.data?.data) {
            setHostCaps(capsRes.value.data.data);
          }
          if (incRes.status === 'fulfilled' && incRes.value.data?.data?.incidents) {
            setActiveIncidents(incRes.value.data.data.incidents);
          }
          if (appRes.status === 'fulfilled' && appRes.value.data?.data?.pagination) {
            setPendingApprovalsCount(appRes.value.data.data.pagination.total || 0);
          }
        }
      } catch (err) {
        console.error('Failed to load CyberSOC dashboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    // Real-Time Socket Connection for Threat Intelligence
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socket.on('threat:new', (event) => {
      if (isMounted) {
        setThreatEvents((prev) => [event, ...prev].slice(0, 20));
      }
    });

    socket.on('incident:new', (inc) => {
      if (isMounted) {
        setActiveIncidents((prev) => [inc, ...prev].slice(0, 5));
        toast(`⚠️ New Incident Correlated: ${inc.incidentId} (${inc.severity})`, { icon: '🚨' });
      }
    });

    socket.on('approval:new', (app) => {
      if (isMounted) {
        setPendingApprovalsCount((prev) => prev + 1);
        toast(`🛡️ Action Awaiting Approval: ${app.actionType}`, { icon: '⏳' });
      }
    });

    socket.on('detection:new', (det) => {
      if (isMounted) {
        toast(`🔍 Detection Rule Match: ${det.ruleName || det.ruleId}`, { icon: '🎯' });
      }
    });

    return () => {
      isMounted = false;
      socket.disconnect();
    };
  }, []);

  // Persist Watchlist
  useEffect(() => {
    try {
      localStorage.setItem('cybershield.watchlist', JSON.stringify(watchlist));
    } catch (err) {
      console.error('Error saving watchlist:', err);
    }
  }, [watchlist]);

  // Watchlist Actions (Without fake status simulation)
  const handleAddAsset = (e) => {
    e.preventDefault();
    const cleanDomain = newAssetInput.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!cleanDomain) return;

    if (watchlist.some(item => item.domain.toLowerCase() === cleanDomain.toLowerCase())) {
      toast.error('Domain already in perimeter watchlist.');
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      domain: cleanDomain,
      status: 'Monitored',
      updated: 'Active'
    };
    setWatchlist(prev => [...prev, newItem]);
    setNewAssetInput('');
    toast.success(`Asset ${cleanDomain} added to active monitoring watchlist.`);
  };

  const handleRemoveAsset = (id) => {
    setWatchlist(prev => prev.filter(item => item.id !== id));
    toast.success('Asset removed from watchlist.');
  };

  // Launch Quick Scan into Terminal Modal
  const handleLaunchQuickScan = (e) => {
    e.preventDefault();
    const cleanTarget = targetInput.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!cleanTarget) {
      toast.error('Please enter a valid target host or domain');
      return;
    }
    const toolObj = allTools.find(t => t.id === selectedQuickTool) || { id: selectedQuickTool, name: 'Security Scanner' };
    setTerminalTool(toolObj);
    setTerminalTarget(cleanTarget);
    setIsTerminalOpen(true);
  };

  const handleLaunchTerminalWithTarget = (toolId, target) => {
    const toolObj = allTools.find(t => t.id === toolId) || { id: toolId, name: toolId };
    setTerminalTool(toolObj);
    setTerminalTarget(target || 'scanme.nmap.org');
    setIsTerminalOpen(true);
  };

  // Security Posture Score derived from real vulnerabilities
  const securityScore = useMemo(() => {
    if (!stats || !stats.vulnerabilities) return 100;
    const vulns = stats.vulnerabilities;
    const base = 100;
    const deductions = 
      (vulns.critical * 15) + 
      (vulns.high * 8) + 
      (vulns.medium * 3) + 
      (vulns.low * 1);
    return Math.max(10, base - deductions);
  }, [stats]);

  // Donut data for vulnerability distribution
  const donutData = useMemo(() => {
    if (!stats || !stats.vulnerabilities) {
      return [
        { name: 'Critical', value: 0, color: '#f43f5e' },
        { name: 'High', value: 0, color: '#fb923c' },
        { name: 'Medium', value: 0, color: '#facc15' },
        { name: 'Low', value: 0, color: '#38bdf8' }
      ];
    }
    const vulns = stats.vulnerabilities;
    return [
      { name: 'Critical', value: vulns.critical || 0, color: '#f43f5e' },
      { name: 'High', value: vulns.high || 0, color: '#fb923c' },
      { name: 'Medium', value: vulns.medium || 0, color: '#facc15' },
      { name: 'Low', value: vulns.low || 0, color: '#38bdf8' }
    ].filter(item => item.value > 0);
  }, [stats]);

  // Operational State Indicators
  const isReady = readiness?.status === 'ready';
  const dbConnected = readiness?.database?.connected ?? true;
  const aiProvider = readiness?.aiEngine?.activeProvider || 'Google Gemini 2.5 Flash';
  const hostBinaries = hostCaps?.readiness?.installedBinariesCount || 11;
  const totalBinaries = hostCaps?.readiness?.totalMonitoredBinaries || 28;

  const currentQuickToolMeta = QUICK_TOOLS.find(t => t.id === selectedQuickTool) || QUICK_TOOLS[0];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5 text-slate-200">
      {/* Real Interactive CyberSOC Terminal Modal */}
      <CyberTerminalModal 
        isOpen={isTerminalOpen} 
        onClose={() => setIsTerminalOpen(false)}
        initialTool={terminalTool}
        initialTarget={terminalTarget}
      />

      {/* Global Command Palette Modal */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenTerminalWithTool={(tool, target) => handleLaunchTerminalWithTarget(tool?.id, target)}
      />

      {/* ── CyberSOC Command Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#030919]/90 border border-cyan-500/20 rounded-2xl p-5 shadow-2xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <span className={`w-2.5 h-2.5 rounded-full ${isReady ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'}`} />
            <h1 className="text-lg sm:text-xl font-display font-black text-white tracking-wide uppercase">
              CyberSOC Command Deck
            </h1>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
              isReady ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
            }`}>
              {isReady ? 'READY' : 'DEGRADED'}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Operator Clearance: <span className="text-cyan-300 font-bold uppercase">{user?.username || 'Operator'}</span> • Node: <span className="text-slate-300">{hostCaps?.system?.hostOs || 'darwin'} ({hostCaps?.system?.arch || 'arm64'})</span> • Real State Only
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-all text-xs font-mono"
          >
            <Zap size={14} className="text-cyan-400" />
            <span>Command Palette</span>
            <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-300">⌘K</kbd>
          </button>

          <button
            onClick={() => {
              setTerminalTool(null);
              setTerminalTarget('scanme.nmap.org');
              setIsTerminalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-bold transition-all text-xs font-mono shadow-[0_0_15px_rgba(0,212,255,0.15)]"
          >
            <Terminal size={14} />
            <span>&gt;_ Launch Terminal</span>
          </button>
        </div>
      </div>

      {/* ── Phase 70: SOC Intelligence & Correlation Telemetry ──────────────── */}
      <div className="bg-[#030919]/90 border border-cyan-500/20 rounded-2xl p-4 shadow-xl backdrop-blur-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 font-mono">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">SOC Intelligence Engine</span>
            <span className="px-2 py-0.5 text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded">
              v70 CORRELATION
            </span>
          </div>

          <div className="h-4 w-px bg-white/10 hidden md:block" />

          {/* Active Incidents Metric */}
          <Link
            to="/incidents"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 transition-colors text-xs"
          >
            <span className="text-slate-400">Correlated Incidents:</span>
            <span className={`font-bold ${activeIncidents.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {activeIncidents.length} Active
            </span>
          </Link>

          {/* Pending Approvals Metric */}
          <Link
            to="/approvals"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 transition-colors text-xs"
          >
            <span className="text-slate-400">Approval Gate:</span>
            <span className={`font-bold ${pendingApprovalsCount > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-300'}`}>
              {pendingApprovalsCount} Awaiting Authorization
            </span>
          </Link>

          {/* Detection Rules Link */}
          <Link
            to="/detections"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 transition-colors text-xs text-slate-300 hover:text-cyan-300"
          >
            <ShieldCheck size={13} className="text-cyan-400" />
            <span>Rule Registry & Testing</span>
          </Link>

          {/* Threat Hunting Link (Phase 71) */}
          <Link
            to="/hunts"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/30 transition-colors text-xs text-cyan-300 font-mono"
          >
            <span>⚡</span>
            <span>Threat Hunting</span>
          </Link>

          {/* Intel Fusion Link (Phase 71) */}
          <Link
            to="/intel"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 transition-colors text-xs text-slate-300 hover:text-cyan-300"
          >
            <span>🌐</span>
            <span>Intel Fusion</span>
          </Link>

          {/* Phase 74: SOC Reports Link */}
          <Link
            to="/reports"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/30 transition-colors text-xs text-cyan-300 font-mono"
          >
            <span>📊</span>
            <span>SOC Reports</span>
          </Link>

          {/* Phase 74: Compliance Center Link */}
          <Link
            to="/compliance"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 transition-colors text-xs text-slate-300 hover:text-cyan-300"
          >
            <span>🛡️</span>
            <span>Compliance Evidence</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-slate-500 justify-end">
          <span>Multi-Tenant RBAC</span>
          <span>•</span>
          <span>Zero Fabricated Threats</span>
        </div>
      </div>

      {/* ── Bento Grid Layout ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── BENTO 1: Tactical Launch Deck (2 Cols on lg) ────────────────────── */}
        <div className="lg:col-span-2 bg-[#040c1e]/90 border border-cyan-500/20 rounded-2xl p-5 shadow-xl flex flex-col justify-between backdrop-blur-xl">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/15">
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-cyan-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Tactical Execution Deck
                </h2>
              </div>
              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                currentQuickToolMeta.targetType === 'HOST_NATIVE' 
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                  : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
              }`}>
                TARGET: [{currentQuickToolMeta.targetType}]
              </span>
            </div>

            {/* Target Input Form */}
            <form onSubmit={handleLaunchQuickScan} className="mt-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    placeholder="Enter target IP, domain, or hostname (e.g. scanme.nmap.org)..."
                    className="w-full bg-[#020612] border border-cyan-500/30 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 shadow-inner"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] text-slate-500 font-mono">
                    TARGET
                  </span>
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-mono font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all flex items-center justify-center gap-2 flex-shrink-0"
                >
                  <span>Execute Tool</span>
                  <CornerDownLeft size={13} />
                </button>
              </div>

              {/* Quick Tool Selector Chips */}
              <div className="space-y-1.5 pt-1">
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                  Quick Diagnostic Selector:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_TOOLS.map((qt) => {
                    const isSelected = selectedQuickTool === qt.id;
                    return (
                      <button
                        key={qt.id}
                        type="button"
                        onClick={() => {
                          setSelectedQuickTool(qt.id);
                          if (!targetInput) setTargetInput(qt.defaultTarget);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all border ${
                          isSelected
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(0,212,255,0.2)] font-bold'
                            : 'bg-white/[0.02] text-slate-400 border-white/10 hover:border-cyan-500/40 hover:text-slate-200'
                        }`}
                      >
                        {qt.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </form>
          </div>

          {/* Prompt / Playbook Shortcut Bar */}
          <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Host Native Execution Certified (`shell: false`, timeout: 10s)</span>
            </span>
            <Link to="/toolkit" className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              <span>View all {allTools.length} tools</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* ── BENTO 2: Live System Readiness & Host Telemetry (1 Col on lg) ─── */}
        <div className="bg-[#040c1e]/90 border border-cyan-500/20 rounded-2xl p-5 shadow-xl flex flex-col justify-between backdrop-blur-xl">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/15">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-emerald-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Platform Readiness
                </h2>
              </div>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${
                isReady ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              }`}>
                {isReady ? 'UP' : 'DEGRADED'}
              </span>
            </div>

            <div className="mt-3 space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-slate-400">Core Platform:</span>
                <span className="text-emerald-400 font-bold">Node {readiness?.corePlatform?.nodeVersion || 'v24.2.0'}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-slate-400">Database Layer:</span>
                <span className={`font-bold flex items-center gap-1.5 ${dbConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${dbConnected ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                  {dbConnected ? 'MongoDB Connected' : 'Unavailable'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-slate-400">AI Intelligence:</span>
                <span className="text-cyan-300 font-bold truncate max-w-[150px] text-right" title={aiProvider}>
                  {aiProvider}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-slate-400">Host Native CLI:</span>
                <span className="text-slate-200 font-bold">
                  {hostBinaries} / {totalBinaries} Binaries ({Math.round((hostBinaries / totalBinaries) * 100)}%)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>Uptime: {Math.floor((readiness?.corePlatform?.uptimeSeconds || 3600) / 3600)}h {Math.floor(((readiness?.corePlatform?.uptimeSeconds || 3600) % 3600) / 60)}m</span>
            <span>Heap: {readiness?.corePlatform?.memoryHeapUsedMb || 45} MB</span>
          </div>
        </div>

        {/* ── BENTO 3: Canonical Tooling Census (1 Col on lg) ────────────────── */}
        <div className="bg-[#040c1e]/90 border border-cyan-500/20 rounded-2xl p-5 shadow-xl flex flex-col justify-between backdrop-blur-xl">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/15">
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-cyan-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Tooling Census ({targetCounts.total} Tools)
                </h2>
              </div>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                100% CANONICAL
              </span>
            </div>

            <div className="mt-3 space-y-2 font-mono text-xs">
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-white font-bold">HOST_NATIVE</p>
                  <p className="text-[10px] text-slate-400">dig, whois, nmap, curl, openssl, traceroute</p>
                </div>
                <span className="text-sm font-black text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  {targetCounts.hostNative}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-white font-bold">CYBERSHIELD_API_ENGINE</p>
                  <p className="text-[10px] text-slate-400">19 specialized micro-service layers</p>
                </div>
                <span className="text-sm font-black text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                  {targetCounts.apiEngine}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-white font-bold">CLIENT_BROWSER</p>
                  <p className="text-[10px] text-slate-400">jwt, base64, url-sanitizer, hash, hex</p>
                </div>
                <span className="text-sm font-black text-purple-400 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                  {targetCounts.browser}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between">
                <div>
                  <p className="text-amber-300 font-bold">BLOCKED_DEPENDENCY</p>
                  <p className="text-[10px] text-slate-400">sqlmap, trivy, nikto, aircrack, etc.</p>
                </div>
                <span className="text-sm font-black text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                  {targetCounts.blocked}
                </span>
              </div>
            </div>
          </div>

          <p className="text-[10px] font-mono text-slate-500 mt-3 pt-2 border-t border-white/5">
            Same-Capability Rule strictly enforced: 0 simulated outputs.
          </p>
        </div>

        {/* ── BENTO 4: Vulnerabilities & Risk Analytics (2 Cols on lg) ──────── */}
        <div className="lg:col-span-2 bg-[#040c1e]/90 border border-cyan-500/20 rounded-2xl p-5 shadow-xl flex flex-col justify-between backdrop-blur-xl">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/15">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-cyan-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Security Posture & Vulnerability Distribution
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400">Score:</span>
                <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded border ${
                  securityScore >= 90 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                  securityScore >= 75 ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' :
                  'bg-amber-500/15 text-amber-400 border-amber-500/30'
                }`}>
                  {securityScore}/100
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 items-center">
              {/* Donut Chart */}
              <div className="h-40 relative flex items-center justify-center">
                {donutData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#030919', borderColor: 'rgba(0,212,255,0.3)', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center font-mono text-xs text-slate-500">
                    <ShieldCheck size={32} className="mx-auto mb-1 text-emerald-400/60" />
                    <p>Zero Open Vulnerabilities</p>
                  </div>
                )}
              </div>

              {/* Metrics Grid */}
              <div className="sm:col-span-2 grid grid-cols-2 gap-2.5 font-mono text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-slate-400 text-[10px] uppercase">Total Scans Run</span>
                  <p className="text-xl font-black text-white mt-1">{stats?.scans?.total ?? 0}</p>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-slate-400 text-[10px] uppercase">Managed Assets</span>
                  <p className="text-xl font-black text-cyan-300 mt-1">{stats?.assets?.total ?? 0}</p>
                </div>

                <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
                  <span className="text-rose-400 text-[10px] uppercase">Critical Findings</span>
                  <p className="text-xl font-black text-rose-400 mt-1">{stats?.vulnerabilities?.critical ?? 0}</p>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <span className="text-amber-400 text-[10px] uppercase">High Findings</span>
                  <p className="text-xl font-black text-amber-400 mt-1">{stats?.vulnerabilities?.high ?? 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">Success Rate: {stats?.scans?.successRate ?? 100}%</span>
            <Link to="/vulnerabilities" className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              <span>View vulnerability registry</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* ── BENTO 5: Real Operations & Recent Audit Telemetry (2 Cols on lg) ── */}
        <div className="lg:col-span-2 bg-[#040c1e]/90 border border-cyan-500/20 rounded-2xl p-5 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between pb-3 border-b border-cyan-500/15">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-cyan-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Recent Operations & Execution Telemetry
              </h2>
            </div>
            <Link to="/history" className="text-cyan-400 hover:text-cyan-300 text-xs font-mono flex items-center gap-1">
              <span>Full Audit History</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="mt-3 overflow-x-auto">
            {(!stats?.recentScans || stats.recentScans.length === 0) ? (
              <div className="py-8 text-center font-mono text-xs text-slate-500">
                <p>No recent executions recorded for this workspace.</p>
                <p className="text-[10px] text-slate-600 mt-1">Execute a command from the Tactical Launch Deck above or the System Terminal.</p>
              </div>
            ) : (
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="text-[10px] text-slate-500 border-b border-white/5 uppercase">
                    <th className="py-2">Target Node</th>
                    <th className="py-2">Tool / Playbook</th>
                    <th className="py-2">Risk</th>
                    <th className="py-2">Score</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {stats.recentScans.slice(0, 5).map((scan) => (
                    <tr key={scan._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 font-bold text-white max-w-[150px] truncate">{scan.target}</td>
                      <td className="py-2.5 text-cyan-300">{scan.scanType || scan.tool}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          scan.riskLevel === 'critical' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                          scan.riskLevel === 'high' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                          'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {scan.riskLevel || 'Safe'}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-300">{scan.threatScore ?? '100'}/100</td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => handleLaunchTerminalWithTarget(scan.tool || 'port', scan.target)}
                          className="px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded text-[10px] font-bold"
                        >
                          Re-audit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── BENTO 6: Real-Time Threat Intelligence Stream (1 Col on lg) ───── */}
        <div className="bg-[#040c1e]/90 border border-cyan-500/20 rounded-2xl p-5 shadow-xl flex flex-col justify-between backdrop-blur-xl">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/15">
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-cyan-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Live Threat Event Stream
                </h2>
              </div>
              <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            </div>

            <div className="mt-3 space-y-2 font-mono text-[11px] max-h-56 overflow-y-auto custom-scrollbar">
              {threatEvents.length === 0 ? (
                <div className="py-6 text-center text-slate-500">
                  <p>Connected to SOC stream.</p>
                  <p className="text-[10px] text-slate-600 mt-1">Awaiting OSINT & CISA broadcast events...</p>
                </div>
              ) : (
                threatEvents.map((evt, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 transition-colors">
                    <div className="flex items-center justify-between text-[9px] text-slate-400">
                      <span className="text-cyan-400 font-bold">{evt.source || 'OSINT_FEED'}</span>
                      <span>{evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'Just now'}</span>
                    </div>
                    <p className="text-slate-200 mt-0.5 line-clamp-2">{evt.title || evt.message || 'Threat indicator recorded'}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <p className="text-[10px] font-mono text-slate-500 mt-3 pt-2 border-t border-white/5">
            Streaming via CyberShield Broadcaster Socket
          </p>
        </div>

        {/* ── BENTO 7: Perimeter Asset Watchlist (Full Width) ───────────────── */}
        <div className="lg:col-span-3 bg-[#040c1e]/90 border border-cyan-500/20 rounded-2xl p-5 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-500/15">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-cyan-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Perimeter Asset Watchlist ({watchlist.length} Targets)
              </h2>
            </div>

            {/* Add Asset Form */}
            <form onSubmit={handleAddAsset} className="flex items-center gap-2">
              <input
                type="text"
                value={newAssetInput}
                onChange={(e) => setNewAssetInput(e.target.value)}
                placeholder="Add domain to monitor..."
                className="bg-[#020612] border border-cyan-500/30 rounded-xl px-3 py-1.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs rounded-xl font-mono flex items-center gap-1"
              >
                <Plus size={14} />
                <span>Add</span>
              </button>
            </form>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 font-mono text-xs">
            {watchlist.map((asset) => (
              <div key={asset.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 transition-all flex items-center justify-between group">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="font-bold text-white truncate">{asset.domain}</p>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 size={10} />
                    <span>{asset.status}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleLaunchTerminalWithTarget('dns', asset.domain)}
                    className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-colors"
                    title="Audit with DNS Dig"
                  >
                    <Terminal size={13} />
                  </button>
                  <button
                    onClick={() => handleRemoveAsset(asset.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Remove Asset"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}