import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import RiskBadge from '../components/common/RiskBadge';
import { format } from 'date-fns';

const RISK_COLOR = { safe: '#00ff88', low: '#ffdd00', medium: '#ff8c00', dangerous: '#ff2244' };

function MiniSparkline({ scans }) {
  const max = Math.max(...scans.map((s) => s.threatScore), 1);
  const W = 120, H = 36;
  const pts = scans.map((s, i) => {
    const x = (i / Math.max(scans.length - 1, 1)) * W;
    const y = H - (s.threatScore / max) * (H - 4) - 2;
    return `${x},${y}`;
  });
  const color = scans.some((s) => s.riskLevel === 'dangerous') ? '#ff2244' : '#00bfff';
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      {scans.map((s, i) => {
        const [x, y] = pts[i].split(',').map(Number);
        return <circle key={i} cx={x} cy={y} r="2.5" fill={RISK_COLOR[s.riskLevel] || '#00bfff'} />;
      })}
    </svg>
  );
}

export default function IPReputationHistoryPage() {
  const [search, setSearch] = useState('');
  const [history, setHistory] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      // Get all IP and domain history, last 200 entries
      const res = await api.get('/history?page=1&limit=200&type=ip');
      const scans = res.data.history || [];
      setHistory(scans);
      groupByTarget(scans);
    } catch {
      toast.error('Failed to load IP history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const groupByTarget = (scans) => {
    const map = {};
    scans.forEach((scan) => {
      const key = scan.target;
      if (!map[key]) map[key] = [];
      map[key].push(scan);
    });
    // Sort each group by date desc
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });
    setGrouped(map);
  };

  const filtered = Object.entries(grouped).filter(([target]) =>
    !search || target.toLowerCase().includes(search.toLowerCase())
  );

  const getWorstRisk = (scans) => {
    if (scans.some((s) => s.riskLevel === 'dangerous')) return 'dangerous';
    if (scans.some((s) => s.riskLevel === 'medium')) return 'medium';
    if (scans.some((s) => s.riskLevel === 'low')) return 'low';
    return 'safe';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <p className="font-mono text-[10px] text-cyber-accent/60 uppercase tracking-[0.4em] mb-1">Intelligence Memory</p>
        <h1 className="font-display text-3xl font-black text-white uppercase tracking-tight">
          IP <span className="text-cyber-accent">Reputation History</span>
        </h1>
        <p className="font-mono text-xs text-cyber-muted mt-1">
          Track how an IP or domain's threat score changed over time
        </p>
      </div>

      {/* Search */}
      <div className="cyber-bento-card p-4 flex gap-3">
        <input
          type="text"
          placeholder="Filter by IP or domain..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 font-mono text-sm text-white placeholder-white/20 focus:border-cyber-accent outline-none transition-colors"
        />
        <button onClick={fetchHistory} className="px-4 py-2 bg-cyber-accent/10 border border-cyber-accent/20 text-cyber-accent font-mono text-xs rounded-lg hover:bg-cyber-accent/20 transition-all uppercase tracking-widest">
          ⟳ Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3">
          <div className="w-6 h-6 border-2 border-cyber-accent border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-xs text-cyber-muted uppercase animate-pulse">Loading IP history...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="cyber-bento-card p-12 text-center">
          <p className="text-4xl mb-4">🔍</p>
          <p className="font-mono text-sm text-cyber-muted">No IP scan history found</p>
          <button onClick={() => navigate('/scan')} className="mt-4 px-6 py-2 bg-cyber-accent/10 border border-cyber-accent/30 text-cyber-accent font-mono text-xs rounded-lg hover:bg-cyber-accent/20 transition-all uppercase tracking-widest">
            Start Scanning →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="font-mono text-[10px] text-cyber-muted uppercase tracking-widest">
            {filtered.length} unique target{filtered.length !== 1 ? 's' : ''} tracked
          </p>
          {filtered.map(([target, scans]) => {
            const worst = getWorstRisk(scans);
            const latest = scans[0];
            const isSelected = selected === target;
            return (
              <motion.div
                key={target}
                layout
                className={`cyber-bento-card overflow-hidden cursor-pointer transition-all ${
                  worst === 'dangerous' ? 'border-red-500/30' : ''
                }`}
                onClick={() => setSelected(isSelected ? null : target)}
              >
                {/* Summary Row */}
                <div className="flex items-center gap-4 p-4">
                  {/* Threat dot */}
                  <div className="w-3 h-3 rounded-full flex-shrink-0 animate-pulse"
                    style={{ backgroundColor: RISK_COLOR[worst], boxShadow: `0 0 8px ${RISK_COLOR[worst]}` }} />

                  {/* Target */}
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-bold text-white truncate">{target}</p>
                    <p className="font-mono text-[10px] text-cyber-muted mt-0.5">
                      {scans.length} scan{scans.length !== 1 ? 's' : ''} · Last: {format(new Date(latest.createdAt), 'MMM d, HH:mm')}
                    </p>
                  </div>

                  {/* Sparkline */}
                  <div className="hidden sm:block flex-shrink-0">
                    <MiniSparkline scans={[...scans].reverse().slice(-8)} />
                  </div>

                  {/* Latest score + badge */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-mono text-sm font-black" style={{ color: RISK_COLOR[latest.riskLevel] }}>
                      {latest.threatScore}
                    </span>
                    <RiskBadge level={worst} />
                  </div>

                  {/* Expand arrow */}
                  <motion.span
                    animate={{ rotate: isSelected ? 180 : 0 }}
                    className="font-mono text-cyber-muted text-xs flex-shrink-0"
                  >▼</motion.span>
                </div>

                {/* Expanded Timeline */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-white/5 overflow-hidden"
                    >
                      <div className="p-4 space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                        <p className="font-mono text-[10px] text-cyber-muted uppercase tracking-widest mb-3">Scan Timeline</p>
                        {scans.map((scan, idx) => (
                          <div
                            key={scan._id || idx}
                            className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
                          >
                            <span className="font-mono text-[10px] text-cyber-muted w-32 flex-shrink-0">
                              {format(new Date(scan.createdAt), 'MMM d, HH:mm:ss')}
                            </span>
                            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${scan.threatScore}%`, backgroundColor: RISK_COLOR[scan.riskLevel] }}
                              />
                            </div>
                            <span className="font-mono text-[11px] font-bold w-8 text-right flex-shrink-0"
                              style={{ color: RISK_COLOR[scan.riskLevel] }}>
                              {scan.threatScore}
                            </span>
                            <RiskBadge level={scan.riskLevel} />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
