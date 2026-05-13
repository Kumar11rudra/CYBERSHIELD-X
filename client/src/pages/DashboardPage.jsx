import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { resolveRealtimeServerUrl } from '../services/api';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import RiskBadge from '../components/common/RiskBadge';
import ScannerInput from '../components/scan/ScannerInput';
import SecurityFortressGauge from '../components/dashboard/SecurityFortressGauge';
import NeuralHeatmap from '../components/dashboard/NeuralHeatmap';
import CorrelationGraph from '../components/dashboard/CorrelationGraph';
import GlobalThreatMap from '../components/dashboard/GlobalThreatMap';
import { motion, AnimatePresence } from 'framer-motion';
import { BentoSkeleton } from '../components/common/Skeleton';
import LiveFeedTicker from '../components/common/LiveFeedTicker';

const ICONS = {
  shield: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  pulse: "M13 10V3L4 14h7v7l9-11h-7z",
  hive: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  security: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
};

const Icon = ({ d, size = 16, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

// ─── Tool Card — unique face per feature ─────────────────────────────────────
const ToolCard = React.memo(({ icon, label, tag, color, rgb, path, delay }) => {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000, duration: 0.35 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(path)}
      role="button"
      aria-label={`Launch ${label} Module`}
      className="relative cursor-pointer rounded-2xl p-6 flex flex-col gap-4 overflow-hidden transition-all duration-500 bg-white/[0.02] border border-white/5 hover:border-white/20 hover:bg-white/[0.04] group shadow-xl"
      style={{
        transform: hovered ? 'translateY(-10px) scale(1.02)' : 'none',
      }}
    >
      {/* Glow spot behind icon */}
      <div
        className="absolute top-0 left-0 w-24 h-24 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle, rgba(${rgb},0.15), transparent 70%)` }}
      />

      <div className="flex items-start justify-between relative z-10">
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-500 shadow-inner">
          {icon}
        </div>
        <span
          className="font-mono text-[8px] font-bold uppercase tracking-[0.3em] px-2 py-1 rounded bg-black/40 border border-white/10"
          style={{ color }}
        >
          {tag}
        </span>
      </div>

      <div className="relative z-10">
        <p className="font-mono text-[11px] font-black uppercase tracking-widest text-white/80 group-hover:text-white transition-colors duration-300">
          {label}
        </p>
        <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color }}>{t('dashboard.launch')}</span>
          <span className="font-mono text-[10px]" style={{ color }}>→</span>
        </div>
      </div>
    </motion.div>
  );
});

const SentinelPulse = React.memo(() => {
  const { t } = useTranslation();
  return (
    <div className="p-8 bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[2rem] overflow-hidden relative group">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="font-display text-sm font-bold text-white uppercase tracking-widest">{t('dashboard.sentinelPulse')}</h3>
          <p className="text-[10px] font-mono text-cyber-muted mt-1 uppercase tracking-widest">{t('dashboard.sentinelPulseDesc')}</p>
        </div>
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 rounded-2xl bg-cyber-accent/10 flex items-center justify-center text-cyber-accent border border-cyber-accent/20 shadow-[0_0_20px_rgba(0,212,255,0.2)]"
        >
          <Icon d={ICONS.pulse} size={24} />
        </motion.div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{t('dashboard.threatHunting')}</span>
          <span className="text-sm font-display font-bold text-cyber-green animate-pulse">{t('common.online').toUpperCase()}</span>
        </div>
        <div className="relative h-14 flex items-center justify-center border border-white/5 bg-black/40 rounded-2xl overflow-hidden">
          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-cyber-accent/10 to-transparent"
          />
          <div className="font-mono text-[10px] text-cyber-muted tracking-[0.5em] z-10 animate-pulse uppercase">{t('scanner.input.analyzing')}</div>
        </div>
        <p className="text-[10px] font-mono text-white/30 uppercase leading-relaxed tracking-wider">
          {t('dashboard.nexusAiDescription')}
        </p>
      </div>
    </div>
  );
});

const AutomatedWatchlist = React.memo(() => {
  const [target, setTarget] = useState('');
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const fetchWatchlist = useCallback(async () => {
    try {
      const res = await api.get('/watchlist');
      setWatchlist(res.data.watchlist);
    } catch (err) {
      console.error('Failed to fetch watchlist', err);
    }
  }, []);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!target) return;
    try {
      setLoading(true);
      await api.post('/watchlist', {
        target,
        targetType: target.includes('.') ? 'domain' : 'ip'
      });
      toast.success('Target added to watchlist');
      setTarget('');
      fetchWatchlist();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add target');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      await api.delete(`/watchlist/${id}`);
      toast.success('Removed from watchlist');
      fetchWatchlist();
    } catch (err) {
      toast.error('Failed to remove target');
    }
  };

  return (
    <div className="p-8 bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[2rem]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="font-display text-sm font-bold text-white uppercase tracking-widest flex items-center gap-3">
            <span className="text-cyber-accent text-xl">👁</span> {t('dashboard.automatedWatchlist')}
          </h3>
          <p className="text-[10px] font-mono text-cyber-muted mt-1 uppercase tracking-widest">{t('dashboard.cronScanning')}</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="flex gap-3 mb-8">
        <input
          type="text"
          placeholder="Enter IP or Domain..."
          aria-label="New Watchlist Target"
          value={target}
          onChange={e => setTarget(e.target.value)}
          disabled={loading}
          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 font-mono text-[11px] text-white focus:border-cyber-accent outline-none transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading}
          aria-label="Add to Watchlist"
          className="bg-cyber-accent text-black px-6 py-3 rounded-xl font-mono text-[11px] uppercase font-black tracking-widest hover:scale-105 transition-all disabled:opacity-50"
        >
          {loading ? '...' : 'Track'}
        </button>
      </form>

      <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
        {watchlist.length === 0 ? (
          <p className="text-[10px] font-mono text-cyber-muted text-center py-10 uppercase tracking-widest opacity-30">{t('dashboard.noData')}</p>
        ) : (
          watchlist.map(item => (
            <div key={item._id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 group hover:border-cyber-accent/30 transition-all">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-black text-white truncate">{item.target}</span>
                  <span className="text-[9px] font-mono text-cyber-accent uppercase px-2 py-0.5 border border-cyber-accent/20 rounded-full">{item.targetType}</span>
                </div>
                <p className="text-[9px] font-mono text-cyber-muted uppercase mt-1 tracking-widest">
                  Next sync: {new Date(item.nextRunAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`w-2.5 h-2.5 rounded-full ${item.lastScanResult?.riskLevel === 'dangerous' ? 'bg-cyber-red animate-pulse shadow-[0_0_10px_#ff2244]' : 'bg-cyber-green shadow-[0_0_10px_#00ff88]'}`} />
                <button
                  onClick={() => handleRemove(item._id)}
                  aria-label="Remove Target"
                  className="opacity-0 group-hover:opacity-100 text-cyber-muted hover:text-cyber-red transition-all text-sm p-1"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

const ApiCreditsWidget = () => {
  const { t } = useTranslation();
  return (
    <div className="p-8 bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[2rem]">
      <h3 className="font-display text-[11px] font-bold text-white uppercase tracking-widest mb-8 flex items-center gap-3">
        <Icon d={ICONS.pulse} size={16} className="text-cyber-accent" />
        {t('dashboard.apiCredits')}
      </h3>
      <div className="space-y-6">
        <div>
          <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.2em] mb-2">
            <span className="text-cyber-muted">VirusTotal</span>
            <span className="text-cyber-accent font-black">60/100</span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden p-[1px] border border-white/5">
            <motion.div initial={{ width: 0 }} animate={{ width: '60%' }} className="h-full bg-cyber-accent rounded-full shadow-[0_0_10px_rgba(0,212,255,0.5)]" />
          </div>
        </div>
        <div>
          <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.2em] mb-2">
            <span className="text-cyber-muted">AbuseIPDB</span>
            <span className="text-cyber-green font-black">88/100</span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden p-[1px] border border-white/5">
            <motion.div initial={{ width: 0 }} animate={{ width: '88%' }} className="h-full bg-cyber-green rounded-full shadow-[0_0_10px_rgba(0,255,136,0.5)]" />
          </div>
        </div>
      </div>
    </div>
  );
};

const HiveFeed = React.memo(() => {
  const { t } = useTranslation();
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const SERVER_URL = resolveRealtimeServerUrl();
    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
    });

    socket.on('threat:new', (threat) => {
      setReports(prev => {
        const newReports = [{
          id: threat.id,
          action: threat.message,
          location: threat.region || "Global",
          time: new Date(threat.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          color: threat.color || '#00d4ff'
        }, ...prev];
        return newReports.slice(0, 5);
      });
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div className="p-8 bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[2rem] h-full flex flex-col">
      <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-6">
        <Icon d={ICONS.hive} size={18} className="text-cyber-accent" />
        <h3 className="font-display text-sm font-black text-white uppercase tracking-[0.2em]">{t('dashboard.hiveFeed')}</h3>
        <span className="ml-auto w-2.5 h-2.5 rounded-full bg-cyber-accent animate-pulse shadow-[0_0_10px_rgba(0,212,255,0.8)]" />
      </div>
      <div className="space-y-4 flex-1 overflow-hidden">
        <AnimatePresence mode="popLayout">
          {reports.map((report, i) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.9 }}
              className="p-4 bg-white/[0.03] border-l-2 rounded-2xl group hover:bg-white/[0.06] transition-all cursor-crosshair overflow-hidden border-white/5"
              style={{ borderLeftColor: report.color }}
            >
              <p className="text-[11px] font-display font-black text-white uppercase leading-tight line-clamp-2">{report.action}</p>
              <div className="flex justify-between mt-3 pt-3 border-t border-white/5">
                <span className="text-[9px] font-mono text-cyber-muted uppercase tracking-widest">{report.location}</span>
                <span className="text-[9px] font-mono font-bold uppercase" style={{ color: report.color }}>{report.time}</span>
              </div>
            </motion.div>
          ))}
          {reports.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-4 opacity-20">
              <div className="w-12 h-12 border-2 border-dashed border-white/30 rounded-full animate-spin-slow" />
              <span className="text-[10px] font-mono text-white uppercase tracking-[0.5em]">{t('dashboard.awaitingSignals')}</span>
            </div>
          )}
        </AnimatePresence>
      </div>
      <button 
        aria-label="View Full Hive Intel"
        className="mt-8 w-full py-4 bg-white/5 rounded-2xl text-[10px] font-black font-mono text-cyber-muted uppercase tracking-[0.4em] hover:text-white hover:bg-white/10 hover:border-white/20 border border-transparent transition-all"
      >
        {t('dashboard.viewHiveIntel')}
      </button>
    </div>
  );
});

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/dashboard');
      setStats(res.data);
    } catch (err) {
      toast.error(t('dashboard.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const fortressScore = useMemo(() => {
    if (!stats) return 100;
    const { totalScans, safeCount } = stats.overview;
    if (totalScans === 0) return 100;
    return Math.min(Math.round((safeCount / totalScans) * 100), 100);
  }, [stats]);

  useEffect(() => {
    document.title = `NEXUS Dashboard | ${user?.username || 'Operator'}`;
  }, [user]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-cyber-bg h-full min-h-[80vh]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="w-20 h-20 border-4 border-cyber-accent/20 border-t-cyber-accent rounded-full mb-6" />
        <p className="font-mono text-xs text-cyber-accent uppercase tracking-[0.6em] animate-pulse">Initializing Nexus Hub...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020817] text-white overflow-x-hidden relative selection:bg-cyber-accent/30">
      {/* Background Blooms */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(0,212,255,0.1),_transparent_50%)] pointer-events-none" />
      <div className="absolute top-1/4 -right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -left-1/4 w-[500px] h-[500px] bg-cyber-green/5 rounded-full blur-[150px] pointer-events-none animate-pulse" />

      <div className="max-w-[1700px] mx-auto px-4 sm:px-8 py-6 sm:py-12 relative z-10">
        
        {/* TOP HEADER SECTION */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-16">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-3 h-3 rounded-full bg-cyber-green animate-pulse shadow-[0_0_15px_#00ff88]" />
              <span className="font-mono text-xs text-cyber-green uppercase tracking-[0.5em] font-black">{t('dashboard.commanderPortal')}</span>
            </div>
            <h1 className="font-display text-6xl md:text-7xl font-black tracking-tighter uppercase leading-[0.85] select-none">
              Nexus <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-accent via-white to-cyber-accent bg-[length:200%_auto] animate-shimmer">Dashboard</span>
            </h1>
            <div className="mt-10 flex items-center gap-8">
              <div className="flex -space-x-4">
                {[1,2,3,4].map(i => <div key={i} className="w-10 h-10 rounded-2xl border-2 border-[#020817] bg-white/5 flex items-center justify-center text-xs font-black shadow-xl group hover:z-50 transition-all cursor-help">U{i}</div>)}
              </div>
              <p className="font-mono text-xs text-cyber-muted uppercase tracking-[0.3em] border-l border-white/10 pl-8 leading-none">
                Active Node: <span className="text-white font-black">{user?.username}</span>
              </p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="flex flex-wrap items-center gap-4">
            <div className="flex items-center bg-white/[0.03] border border-white/5 rounded-[2rem] p-1.5 backdrop-blur-3xl shadow-2xl">
              <button onClick={fetchStats} className="px-8 py-4 rounded-2xl hover:bg-white/5 text-xs font-black uppercase tracking-[0.3em] text-cyber-muted hover:text-white transition-all flex items-center gap-3 group">
                <span className="group-hover:rotate-180 transition-transform duration-700">⟳</span> {t('dashboard.sync')}
              </button>
              <button onClick={() => navigate('/history')} className="px-8 py-4 rounded-2xl bg-cyber-accent text-black text-xs font-black uppercase tracking-[0.3em] shadow-[0_10px_30px_rgba(0,212,255,0.3)] hover:scale-105 transition-all active:scale-95">
                {t('dashboard.archive')}
              </button>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* LEFT CONTENT COLUMN */}
          <div className="lg:col-span-3 space-y-12">
            
            {/* STATS OVERVIEW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: t('dashboard.totalScans'), value: stats?.overview?.totalScans ?? 0, sub: 'Network Coverage', icon: '🔍', color: '#00d4ff', rgb: '0,212,255' },
                { label: t('dashboard.threatsFound'), value: stats?.overview?.dangerousCount ?? 0, sub: 'Attacks Blocked', icon: '⚠️', color: '#ff2244', rgb: '255,34,68' },
                { label: t('dashboard.safeScans'), value: stats?.overview?.safeCount ?? 0, sub: 'Clean Assets', icon: '✅', color: '#00ff88', rgb: '0,255,136' },
                { label: t('dashboard.maliciousRate'), value: `${stats?.overview?.maliciousRate ?? 0}%`, sub: 'Risk Index', icon: '📊', color: '#ff8c00', rgb: '255,140,0' }
              ].map((card, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="group relative p-8 bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-white/20 transition-all duration-500 shadow-xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity blur-3xl pointer-events-none" style={{ background: card.color }} />
                  <div className="flex justify-between items-start mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-500">{card.icon}</div>
                    <span className="font-mono text-[9px] text-cyber-muted uppercase tracking-[0.4em] font-black">{card.sub}</span>
                  </div>
                  <div>
                    <h3 className="font-display text-5xl font-black mb-2" style={{ color: card.color }}>{card.value}</h3>
                    <p className="font-mono text-[11px] text-white/40 uppercase tracking-[0.3em] font-black">{card.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* RAPID SCANNER */}
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="p-10 bg-white/[0.02] backdrop-blur-[100px] border border-white/5 rounded-[3rem] relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-accent to-transparent opacity-40" />
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-cyber-accent/10 flex items-center justify-center text-3xl text-cyber-accent border border-cyber-accent/20 shadow-[0_0_30px_rgba(0,212,255,0.2)]">⚡</div>
                  <div>
                    <h2 className="font-display text-3xl font-black uppercase tracking-tighter leading-none">{t('dashboard.rapidScanner')}</h2>
                    <p className="font-mono text-[11px] text-cyber-muted uppercase tracking-[0.4em] mt-2">{t('dashboard.rapidScannerDesc')}</p>
                  </div>
                </div>
              </div>
              <ScannerInput onResult={fetchStats} />
            </motion.div>

            {/* QUICK TOOLS GRID */}
            <div>
              <div className="flex items-center justify-between mb-8 px-4">
                <h3 className="font-mono text-xs font-black uppercase tracking-[0.6em] text-white/40">{t('dashboard.intelligenceModules')}</h3>
                <div className="h-px flex-1 bg-white/5 mx-10" />
                <span className="font-mono text-xs text-cyber-accent/60 uppercase font-black tracking-widest">{t('dashboard.modulesActive', { count: 12 })}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {[
                  { icon: '📡', label: 'Port Sentinel', tag: 'RECON', color: '#00bfff', rgb: '0,191,255', path: '/toolkit/nmap' },
                  { icon: '🧪', label: 'Config Auditor', tag: 'VULN', color: '#ff8c00', rgb: '255,140,0', path: '/toolkit/nikto' },
                  { icon: '💉', label: 'Injection Lab', tag: 'WEB', color: '#ff2244', rgb: '255,34,68', path: '/toolkit/sqlmap' },
                  { icon: '🔨', label: 'Pass Hardener', tag: 'AUTH', color: '#b400ff', rgb: '180,0,255', path: '/toolkit/john' },
                  { icon: '🔍', label: 'Forensics Lab', tag: 'DIGITAL', color: '#00bfff', rgb: '0,191,255', path: '/toolkit/autopsy' },
                  { icon: '📊', label: 'Enterprise SOC', tag: 'SIEM', color: '#ff8c00', rgb: '255,140,0', path: '/toolkit/splunk' },
                  { icon: '🧙', label: 'Cloud Guard', tag: 'CLOUD', color: '#00bfff', rgb: '0,191,255', path: '/toolkit/wiz' },
                  { icon: '☣️', label: 'Threat Engine', tag: 'INTEL', color: '#ff2244', rgb: '255,34,68', path: '/toolkit/virustotal' },
                  { icon: '🛑', label: 'Breach Monitor', tag: 'LEAKS', color: '#ff2244', rgb: '255,34,68', path: '/breach-checker' },
                  { icon: '🗄️', label: 'Quantum Vault', tag: 'SECURE', color: '#b400ff', rgb: '180,0,255', path: '/vault' },
                  { icon: '🤖', label: 'AI Pentest', tag: 'AGENTIC', color: '#00ff88', rgb: '0,255,136', path: '/toolkit/zerothreat' },
                  { icon: '📱', label: 'Mobile Hub', tag: 'MOBILE', color: '#ff2244', rgb: '255,34,68', path: '/toolkit/mobsf' },
                ].map((tool, i) => (
                  <ToolCard key={i} {...tool} delay={i * 60} />
                ))}
              </div>
            </div>

            {/* CHARTS SECTION */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
              <div className="space-y-10">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] shadow-xl">
                  <SecurityFortressGauge score={fortressScore} label={t('dashboard.defensivePosture')} />
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] h-[450px] shadow-xl overflow-hidden">
                  <NeuralHeatmap />
                </motion.div>
              </div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] flex flex-col shadow-xl">
                <h3 className="font-display text-lg font-black uppercase tracking-[0.2em] mb-10 border-b border-white/5 pb-6">{t('dashboard.correlationMatrix')}</h3>
                <div className="flex-1 min-h-[500px]">
                  <CorrelationGraph />
                </div>
              </motion.div>
            </div>

            {/* RECENT LOGS */}
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
              className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
              <div className="p-10 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-2xl font-black uppercase tracking-tighter">{t('dashboard.intrusionLogs')}</h3>
                  <p className="font-mono text-xs text-cyber-muted uppercase tracking-[0.5em] mt-2">Real-time signal analysis</p>
                </div>
                <button onClick={() => navigate('/history')} className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-mono text-xs uppercase font-black tracking-widest hover:text-cyber-accent hover:border-cyber-accent/30 transition-all">
                  {t('dashboard.viewFullHistory')}
                </button>
              </div>
              <div className="p-10 overflow-x-auto">
                <table className="w-full text-left font-mono">
                  <thead>
                    <tr className="text-cyber-muted text-[10px] uppercase tracking-[0.5em] border-b border-white/5">
                      <th className="pb-8 px-6">{t('history.target')}</th>
                      <th className="pb-8 px-6 text-center">{t('history.type')}</th>
                      <th className="pb-8 px-6 text-center">{t('history.riskScore')}</th>
                      <th className="pb-8 px-6 text-right">{t('history.date')}</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px]">
                    {stats?.recentScans?.length === 0 ? (
                      <tr><td colSpan={4} className="py-24 text-center text-white/10 uppercase tracking-[1em] font-black">{t('dashboard.noScansYet')}</td></tr>
                    ) : (
                      stats?.recentScans?.slice(0, 8).map((scan, i) => (
                        <tr key={scan._id} onClick={() => navigate(`/history/${scan._id}`)}
                          className="group border-b border-white/[0.03] last:border-0 hover:bg-white/[0.03] transition-colors cursor-pointer">
                          <td className="py-8 px-6">
                            <p className="font-black text-white group-hover:text-cyber-accent transition-colors">{scan.target}</p>
                            <p className="text-[10px] text-cyber-muted uppercase mt-2 font-black tracking-widest">Scanner ID: #AX-{i+1024}</p>
                          </td>
                          <td className="py-8 px-6 text-center">
                            <span className="px-4 py-1.5 bg-cyber-accent/10 border border-cyber-accent/20 rounded-full text-[10px] text-cyber-accent font-black uppercase tracking-widest shadow-lg shadow-cyber-accent/5">{scan.targetType}</span>
                          </td>
                          <td className="py-8 px-6 text-center">
                            <RiskBadge level={scan.riskLevel} size="md" />
                          </td>
                          <td className="py-8 px-6 text-right">
                            <p className="text-white font-black">{new Date(scan.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            <p className="text-[10px] text-cyber-muted uppercase mt-2 font-bold tracking-tighter">{new Date(scan.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>

          {/* RIGHT SIDEBAR COLUMN */}
          <div className="space-y-10">
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
              <SentinelPulse />
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="h-[600px]">
              <HiveFeed />
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
              <AutomatedWatchlist />
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}
              className="p-10 bg-gradient-to-br from-cyber-accent/10 to-transparent border border-cyber-accent/20 rounded-[2.5rem] relative overflow-hidden group shadow-xl">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiMwMGZmODgiLz48L3N2Zz4=')] opacity-5" />
              <h3 className="font-display text-base font-black uppercase tracking-widest mb-8 flex items-center gap-4 relative z-10">
                <span className="w-3 h-3 rounded-full bg-cyber-accent animate-ping shadow-[0_0_15px_rgba(0,212,255,0.8)]" />
                {t('dashboard.quickActions')}
              </h3>
              <div className="space-y-4 relative z-10">
                {[
                  { label: t('navigation.liveScanner'), path: '/scan', icon: '📡' },
                  { label: t('navigation.bulkScanner'), path: '/bulk-scan', icon: '📦' },
                  { label: t('navigation.webForensics'), path: '/web-forensics', icon: '🔍' },
                  { label: t('navigation.quantumVault'), path: '/vault', icon: '🔒' }
                ].map((item, i) => (
                  <button key={i} onClick={() => navigate(item.path)}
                    className="w-full flex items-center justify-between p-5 bg-black/40 border border-white/5 rounded-2xl hover:border-cyber-accent/50 hover:bg-black/60 transition-all group shadow-inner">
                    <div className="flex items-center gap-5">
                      <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
                      <span className="font-mono text-xs font-black uppercase tracking-widest text-cyber-muted group-hover:text-white transition-colors">{item.label}</span>
                    </div>
                    <span className="text-cyber-accent opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 font-black">→</span>
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 }}>
              <ApiCreditsWidget />
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 }} className="p-10 bg-white/[0.02] border border-white/5 rounded-[2.5rem] shadow-xl overflow-hidden">
              <GlobalThreatMap />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}