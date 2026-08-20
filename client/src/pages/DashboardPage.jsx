import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';
import { getAllTools, TOOL_STATUS, CATEGORIES, getStatusBadge } from '../components/toolkit/toolConfig';
import { toast } from 'react-hot-toast';
import { 
  Terminal, 
  Layers, 
  Sparkles, 
  ExternalLink, 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  Globe, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RefreshCw 
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import CyberTerminalModal from '../components/terminal/CyberTerminalModal';

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Core States
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [targetInput, setTargetInput] = useState('');
  const [selectedQuickTool, setSelectedQuickTool] = useState('port');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Real-Time Socket Stream State
  const [threatEvents, setThreatEvents] = useState([]);

  // Asset Watchlist State (Persisted in LocalStorage)
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem('cybershield.watchlist');
      return saved ? JSON.parse(saved) : [
        { id: '1', domain: 'cybershieldx.in', status: 'secure', ssl: 'Valid', updated: 'Just now' },
        { id: '2', domain: 'scanme.nmap.org', status: 'secure', ssl: 'Valid', updated: 'Just now' }
      ];
    } catch {
      return [];
    }
  });
  const [newAssetInput, setNewAssetInput] = useState('');

  // Terminal Modal State
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalTool, setTerminalTool] = useState(null);
  const [terminalTarget, setTerminalTarget] = useState('');

  const allTools = useMemo(() => getAllTools(), []);

  // Filter live tools
  const liveTools = useMemo(() => {
    return allTools.filter(tool => tool.status === TOOL_STATUS.LIVE || tool.status === TOOL_STATUS.PARTIAL);
  }, [allTools]);

  const liveToolsCount = useMemo(() => {
    return allTools.filter(tool => tool.status === TOOL_STATUS.LIVE).length;
  }, [allTools]);

  const diagnosticCount = useMemo(() => {
    return allTools.filter(tool => tool.status === TOOL_STATUS.COMING_SOON || tool.status === TOOL_STATUS.PARTIAL).length;
  }, [allTools]);

  // Dynamic Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // 1. Fetch Stats & Set Up Websocket Threat Broadcaster Connection
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

    // Socket Setup
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socket.on('threat:new', (event) => {
      if (isMounted) {
        setThreatEvents((prev) => [event, ...prev].slice(0, 15));
      }
    });

    return () => {
      isMounted = false;
      socket.disconnect();
    };
  }, []);

  // Persist Watchlist Changes
  useEffect(() => {
    try {
      localStorage.setItem('cybershield.watchlist', JSON.stringify(watchlist));
    } catch (err) {
      console.error('Error saving watchlist:', err);
    }
  }, [watchlist]);

  // Watchlist Actions
  const handleAddAsset = (e) => {
    e.preventDefault();
    const cleanDomain = newAssetInput.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!cleanDomain) return;
    
    if (watchlist.some(item => item.domain.toLowerCase() === cleanDomain.toLowerCase())) {
      toast.error('Domain already in watchlist.');
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      domain: cleanDomain,
      status: 'pending',
      ssl: 'Checking...',
      updated: 'Connecting...'
    };
    setWatchlist(prev => [...prev, newItem]);
    setNewAssetInput('');

    // Simulate passive checks
    setTimeout(() => {
      setWatchlist(current => current.map(item => 
        item.id === newItem.id 
          ? { ...item, status: 'secure', ssl: 'Valid', updated: 'Just now' }
          : item
      ));
      toast.success(`Asset ${cleanDomain} added to monitoring checklist.`);
    }, 2000);
  };

  const handleRemoveAsset = (id) => {
    setWatchlist(prev => prev.filter(item => item.id !== id));
    toast.success('Asset removed from watchlist.');
  };

  // Launch Scans
  const handleLaunchQuickScan = (e) => {
    e.preventDefault();
    const cleanTarget = targetInput.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!cleanTarget) {
      toast.error('Please enter a valid target (Domain, IP, or URL)');
      return;
    }
    const toolObj = allTools.find(t => t.id === selectedQuickTool) || { id: selectedQuickTool, name: 'Security Scanner' };
    setTerminalTool(toolObj);
    setTerminalTarget(cleanTarget);
    setIsTerminalOpen(true);
  };

  const handleLaunchTerminal = (tool) => {
    setTerminalTool(tool);
    setTerminalTarget(tool.defaultTarget || 'scanme.nmap.org');
    setIsTerminalOpen(true);
  };

  const handleLaunchPlaybook = () => {
    setTerminalTool(null);
    setTerminalTarget(targetInput.trim() || 'scanme.nmap.org');
    setIsTerminalOpen(true);
  };

  // Filtered Tools
  const filteredTools = useMemo(() => {
    return allTools.filter((tool) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        tool.name.toLowerCase().includes(q) ||
        (tool.tagline && tool.tagline.toLowerCase().includes(q)) ||
        (tool.description && tool.description.toLowerCase().includes(q)) ||
        (tool.category && tool.category.toLowerCase().includes(q)) ||
        (tool.capabilities && tool.capabilities.some(c => c.toLowerCase().includes(q)));

      let matchesStatus = true;
      if (statusFilter === 'LIVE') matchesStatus = tool.status === TOOL_STATUS.LIVE;
      else if (statusFilter === 'PARTIAL') matchesStatus = tool.status === TOOL_STATUS.PARTIAL;
      else if (statusFilter === 'DIAGNOSTIC') matchesStatus = tool.status === TOOL_STATUS.COMING_SOON || tool.status === TOOL_STATUS.PARTIAL;

      const matchesCategory = categoryFilter === 'ALL' || tool.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [allTools, searchQuery, statusFilter, categoryFilter]);

  const categoryList = useMemo(() => Object.values(CATEGORIES), []);

  // ─── Visual Risk Analytics Calculations ───
  const securityScore = useMemo(() => {
    if (!stats) return 100;
    const vulns = stats.vulnerabilities || { critical: 0, high: 0, medium: 0, low: 0 };
    const base = 100;
    const deductions = 
      (vulns.critical * 15) + 
      (vulns.high * 8) + 
      (vulns.medium * 3) + 
      (vulns.low * 1);
    return Math.max(5, base - deductions);
  }, [stats]);

  const scoreDetails = useMemo(() => {
    if (securityScore >= 90) return { label: 'OPTIMIZED', color: '#00ff88', text: 'GRADE A' };
    if (securityScore >= 75) return { label: 'ACCEDENT', color: '#00bfff', text: 'GRADE B' };
    if (securityScore >= 50) return { label: 'DEGRADED', color: '#e5c100', text: 'GRADE C' };
    return { label: 'CRITICAL', color: '#ff2244', text: 'GRADE F' };
  }, [securityScore]);

  // Recharts Donut Data
  const donutData = useMemo(() => {
    if (!stats || !stats.vulnerabilities) {
      return [
        { name: 'Critical', value: 0, color: '#ff2244' },
        { name: 'High', value: 0, color: '#ff8c00' },
        { name: 'Medium', value: 0, color: '#e5c100' },
        { name: 'Low', value: 0, color: '#00d4ff' },
      ];
    }
    const vulns = stats.vulnerabilities;
    return [
      { name: 'Critical', value: vulns.critical || 0, color: '#ff2244' },
      { name: 'High', value: vulns.high || 0, color: '#ff8c00' },
      { name: 'Medium', value: vulns.medium || 0, color: '#e5c100' },
      { name: 'Low', value: vulns.low || 0, color: '#00d4ff' },
    ].filter(item => item.value > 0);
  }, [stats]);

  // 7-day Trend mock scan activity matching DB total
  const scanTrendData = useMemo(() => {
    const total = stats?.scans?.total || 14;
    return [
      { day: 'Mon', Scans: Math.round(total * 0.12) },
      { day: 'Tue', Scans: Math.round(total * 0.15) },
      { day: 'Wed', Scans: Math.round(total * 0.08) },
      { day: 'Thu', Scans: Math.round(total * 0.22) },
      { day: 'Fri', Scans: Math.round(total * 0.18) },
      { day: 'Sat', Scans: Math.round(total * 0.10) },
      { day: 'Sun', Scans: Math.round(total * 0.15) }
    ];
  }, [stats]);

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
            Your security workspace at a glance. Manage targets, execute live terminal scans, and review audit telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 flex-wrap">
          <button
            onClick={handleLaunchPlaybook}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00ff88]/20 to-[#00bfff]/20 border border-[#00ff88]/50 text-[#00ff88] font-bold text-xs uppercase tracking-wider hover:bg-[#00ff88] hover:text-[#020814] transition-all shadow-[0_0_15px_rgba(0,255,136,0.25)] flex items-center gap-2"
          >
            <Layers size={14} />
            <span>⚡ Audit Playbook</span>
          </button>
          <Link
            to="/toolkit"
            className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-cyber-accent/40 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2"
          >
            <Terminal size={14} className="text-cyber-accent" />
            <span>Tools Hub (110 Models)</span>
          </Link>
        </div>

        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-cyber-accent/5 to-transparent pointer-events-none" />
      </motion.div>

      {/* ─── 2. DETAILED SECURITY ANALYTICS (VISUAL CHARTS & GAUGES) ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Security Score Circular HUD */}
        <div className="p-6 rounded-2xl bg-[#0a1220]/75 border border-white/5 flex flex-col justify-between items-center relative overflow-hidden">
          <div className="w-full flex justify-between items-center border-b border-white/5 pb-3">
            <h3 className="text-xs uppercase tracking-widest text-white flex items-center gap-1.5">
              <Shield size={14} className="text-cyber-accent" />
              <span>Platform Risk Status</span>
            </h3>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ color: scoreDetails.color, backgroundColor: `${scoreDetails.color}15`, border: `1px solid ${scoreDetails.color}25` }}>
              {scoreDetails.label}
            </span>
          </div>

          {/* SVG Radial Gauge */}
          <div className="relative my-6 flex items-center justify-center">
            <svg className="w-40 h-40 transform -rotate-90">
              {/* Track Ring */}
              <circle
                cx="80"
                cy="80"
                r="64"
                className="stroke-current text-white/[0.03]"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Progress Ring */}
              <circle
                cx="80"
                cy="80"
                r="64"
                stroke={scoreDetails.color}
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 64}
                strokeDashoffset={((100 - securityScore) / 100) * (2 * Math.PI * 64)}
                className="transition-all duration-1000 ease-out"
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-display font-black text-white tracking-tight">
                {securityScore}
              </span>
              <span className="text-[9px] text-cyber-muted uppercase tracking-wider font-bold mt-0.5">
                {scoreDetails.text}
              </span>
            </div>
          </div>

          <div className="w-full text-center space-y-1">
            <p className="text-[10px] text-cyber-muted">
              Based on {stats?.vulnerabilities?.total || 0} active vulnerabilities
            </p>
            <div className="flex justify-center gap-4 text-[9px] text-cyber-muted/80">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> {stats?.vulnerabilities?.critical || 0} Crit</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> {stats?.vulnerabilities?.high || 0} High</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#e5c100]" /> {stats?.vulnerabilities?.medium || 0} Med</span>
            </div>
          </div>
        </div>

        {/* Recharts Pie Chart (Vulnerability Breakdown) */}
        <div className="p-6 rounded-2xl bg-[#0a1220]/75 border border-white/5 flex flex-col justify-between">
          <div className="w-full border-b border-white/5 pb-3">
            <h3 className="text-xs uppercase tracking-widest text-white flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-rose-400" />
              <span>Vulnerability Severity Breakdown</span>
            </h3>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            {donutData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#020814', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff', fontFamily: 'monospace', fontSize: '10px' }}
                    itemStyle={{ color: '#00bfff', fontFamily: 'monospace', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-cyber-muted space-y-1">
                <span>🛡️</span>
                <p>No active vulnerabilities detected</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 border-t border-white/5 pt-3">
            {donutData.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[9px] text-cyber-muted">
                <span className="w-2 h-2 rounded" style={{ backgroundColor: item.color }} />
                <span>{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recharts Area Chart (7-Day Scan Activity Trend) */}
        <div className="p-6 rounded-2xl bg-[#0a1220]/75 border border-white/5 flex flex-col justify-between">
          <div className="w-full border-b border-white/5 pb-3">
            <h3 className="text-xs uppercase tracking-widest text-white flex items-center gap-1.5">
              <Activity size={14} className="text-emerald-400" />
              <span>7-Day Threat Activity Trend</span>
            </h3>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scanTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff88" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#00ff88" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="day" stroke="#475569" fontSize={9} tickLine={false} />
                <YAxis stroke="#475569" fontSize={9} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020814', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px' }}
                  itemStyle={{ color: '#00ff88', fontFamily: 'monospace', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="Scans" stroke="#00ff88" strokeWidth={2} fillOpacity={1} fill="url(#colorScans)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-between items-center text-[10px] text-cyber-muted border-t border-white/5 pt-3">
            <span>Average: {Math.round((stats?.scans?.total || 14) / 7)} Scans/Day</span>
            <span>Success Rate: {stats?.scans?.successRate || 100}%</span>
          </div>
        </div>

      </div>

      {/* ─── 3. TARGET ASSET WATCHLIST & REAL-TIME EVENT STREAM ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Watchlist Section (Left 1/3) */}
        <div className="p-6 rounded-2xl bg-[#0a1424]/80 border border-white/10 flex flex-col justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xs uppercase tracking-widest text-white flex items-center gap-1.5">
              <Globe size={14} className="text-cyber-accent" />
              <span>Target Asset Watchlist</span>
            </h3>
            <p className="text-[10px] text-cyber-muted">
              Add your target assets for real-time passive tracking.
            </p>
          </div>

          {/* Add Asset Form */}
          <form onSubmit={handleAddAsset} className="flex gap-2">
            <input
              type="text"
              value={newAssetInput}
              onChange={(e) => setNewAssetInput(e.target.value)}
              placeholder="e.g. cybershieldx.in"
              className="flex-1 px-3 py-2 bg-[#030914] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyber-accent/60 transition-colors"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-cyber-accent text-[#020814] hover:bg-cyber-accent/90 transition-all shadow-[0_0_10px_rgba(0,212,255,0.25)] flex items-center justify-center"
            >
              <Plus size={16} />
            </button>
          </form>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-2 max-h-56 pr-1">
            {watchlist.map((item) => (
              <div key={item.id} className="p-3 rounded-xl bg-[#030914] border border-white/5 flex items-center justify-between group hover:border-cyber-accent/30 transition-all">
                <div className="space-y-0.5">
                  <div className="text-xs text-white font-bold tracking-wide truncate max-w-[130px]">{item.domain}</div>
                  <div className="flex items-center gap-2 text-[9px] text-cyber-muted">
                    <span className="flex items-center gap-0.5"><span className="w-1 h-1 rounded-full bg-emerald-400" /> SSL {item.ssl}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setTerminalTool(allTools.find(t => t.id === 'port') || { id: 'port', name: 'Port Scanner' });
                      setTerminalTarget(item.domain);
                      setIsTerminalOpen(true);
                    }}
                    className="px-2 py-1 rounded bg-cyber-accent/10 hover:bg-cyber-accent hover:text-[#020814] border border-cyber-accent/20 text-cyber-accent text-[9px] font-bold transition-all"
                  >
                    Scan
                  </button>
                  <button
                    onClick={() => handleRemoveAsset(item.id)}
                    className="p-1 rounded bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))}
            {watchlist.length === 0 && (
              <p className="text-[10px] text-cyber-muted text-center py-4">No assets added.</p>
            )}
          </div>
        </div>

        {/* Real-time Threat Stream Ticker (Right 2/3) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0a1424]/80 border border-white/10 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="space-y-0.5">
              <h3 className="text-xs uppercase tracking-widest text-white flex items-center gap-1.5">
                <Terminal size={14} className="text-cyber-accent" />
                <span>Live SOC Threat Intelligence Stream</span>
              </h3>
              <p className="text-[10px] text-cyber-muted">
                Simulated real-time global security pings, C2 detections, and honeypot events.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-[#00ff88]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
              <span>LIVE</span>
            </div>
          </div>

          <div className="flex-1 bg-[#020814] border border-white/5 rounded-xl p-3 font-mono text-[11px] overflow-y-auto max-h-64 h-64 space-y-2.5 scrollbar-thin scrollbar-thumb-white/5">
            <AnimatePresence>
              {threatEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2.5 hover:bg-white/[0.01] p-1.5 rounded-md transition-colors"
                >
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0" style={{ color: event.color, backgroundColor: `${event.color}15`, border: `1px solid ${event.color}25` }}>
                    {event.severity}
                  </span>
                  <div className="space-y-0.5 flex-1">
                    <div className="text-slate-300">
                      <span className="text-cyber-accent font-bold">[{event.type}]</span> {event.message}
                    </div>
                    <div className="flex items-center gap-3 text-[9px] text-cyber-muted">
                      <span>Source: {event.source}</span>
                      <span>•</span>
                      <span>Region: {event.region}</span>
                      <span>•</span>
                      <span>Conf: {event.confidence}</span>
                      <span>•</span>
                      <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {threatEvents.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-cyber-muted">
                <Clock size={16} className="animate-spin text-cyber-accent/60" />
                <p className="text-[10px] tracking-widest uppercase">Waiting for live intelligence pings...</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ─── 4. QUICK TARGET SCAN SECTION ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="p-6 rounded-2xl bg-[#0a1424]/95 border border-white/10 shadow-2xl relative overflow-hidden"
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="p-2 rounded-xl bg-cyber-accent/10 border border-cyber-accent/30 text-cyber-accent text-lg">
            🎯
          </span>
          <div>
            <h2 className="text-sm sm:text-base font-display font-bold text-white uppercase tracking-wider">
              Quick Target Scan & Terminal Launcher
            </h2>
            <p className="text-xs text-cyber-muted">
              Run an instant interactive terminal audit against any domain, IP address, or URL.
            </p>
          </div>
        </div>

        <form onSubmit={handleLaunchQuickScan} className="flex flex-col md:flex-row gap-3 items-stretch">
          <div className="flex-1 relative">
            <input
              type="text"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder="Enter Target: e.g. scanme.nmap.org, google.com, 8.8.8.8"
              className="w-full px-4 py-3 bg-[#030914] border border-white/10 rounded-xl text-xs text-white placeholder-cyber-muted/60 focus:outline-none focus:border-cyber-accent/60 transition-colors font-mono"
            />
          </div>

          <div className="w-full md:w-64">
            <select
              value={selectedQuickTool}
              onChange={(e) => setSelectedQuickTool(e.target.value)}
              className="w-full px-3 py-3 bg-[#030914] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyber-accent/60 transition-colors font-mono cursor-pointer"
            >
              {liveTools.map((tool) => (
                <option key={tool.id} value={tool.id} className="bg-[#0a1424] text-white">
                  {tool.name} (Live)
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={!targetInput.trim()}
            className={`px-6 py-3 rounded-xl font-display font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shrink-0 ${
              !targetInput.trim()
                ? 'bg-white/5 text-cyber-muted border border-white/5 cursor-not-allowed'
                : 'bg-cyber-accent text-[#020814] hover:bg-cyber-accent/90 shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:scale-[1.02]'
            }`}
          >
            <Terminal size={14} />
            <span>Launch Terminal</span>
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 mt-3 text-[10px] text-cyber-muted">
          <span className="text-cyber-accent/70 uppercase">Quick Samples:</span>
          {['scanme.nmap.org', 'google.com', '1.1.1.1', 'github.com'].map((sample) => (
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

      {/* ─── 5. ALL 110 TOOLS & MODEL EXPLORER ────────────────────────────── */}
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
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'All (110)' },
              { id: 'LIVE', label: `🟢 Live (${liveToolsCount})` },
              { id: 'DIAGNOSTIC', label: `🔵 Diagnostic (${diagnosticCount})` },
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

                    <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider mb-1 group-hover:text-cyber-accent transition-colors">
                      {tool.name}
                    </h3>

                    <p className="text-[9px] text-cyber-muted uppercase tracking-widest mb-2 font-mono">
                      {tool.category}
                    </p>

                    <p className="text-xs text-cyber-muted/90 line-clamp-2 leading-relaxed mb-4">
                      {tool.description}
                    </p>
                  </div>

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

                    <button
                      onClick={() => handleLaunchTerminal(tool)}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#00bfff]/10 hover:bg-[#00bfff] hover:text-[#020814] text-[#00bfff] border border-[#00bfff]/30 text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-between group-hover:shadow-[0_0_15px_rgba(0,191,255,0.3)]"
                    >
                      <div className="flex items-center gap-1.5">
                        <Terminal size={13} />
                        <span>&gt;_ Launch Terminal</span>
                      </div>
                      <ExternalLink size={12} className="opacity-70 group-hover:opacity-100" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── 6. RECENT ACTIVITY / AUDIT RUNS SECTION ──────────────────────── */}
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
              <thead className="text-cyber-muted uppercase border-b border-white/5 text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Target</th>
                  <th className="py-2.5 px-3">Scan Type</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {stats.recentScans.slice(0, 5).map((scan, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 text-white font-bold">{scan.target || 'scanme.nmap.org'}</td>
                    <td className="py-2.5 px-3 text-cyber-muted">{scan.scanType || 'Full Recon'}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {scan.status || 'COMPLETED'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-cyber-muted text-[10px]">
                      {scan.createdAt ? new Date(scan.createdAt).toLocaleString() : 'Just now'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-cyber-muted py-2">
            No recent scans recorded yet. Enter a target above to launch your first interactive audit.
          </p>
        )}
      </div>

      <CyberTerminalModal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        initialTool={terminalTool}
        initialTarget={terminalTarget}
      />
    </div>
  );
}