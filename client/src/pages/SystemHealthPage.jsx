import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '../utils/motion';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function SystemHealthPage() {
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(10000); // 10s auto-refresh
  const [lastRefreshed, setLastRefreshed] = useState('');

  const fetchHealthDetails = async () => {
    try {
      const res = await api.get('/health/details');
      setHealthData(res.data);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      toast.error('Failed to load system diagnostics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthDetails();
    const timer = setInterval(() => {
      fetchHealthDetails();
    }, refreshInterval);
    return () => clearInterval(timer);
  }, [refreshInterval]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'healthy':
      case 'online':
      case 'Local AI Active':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      case 'degraded':
      case 'partial':
      case 'Template Engine Active':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      case 'unhealthy':
      case 'offline':
      case 'Local AI Offline':
      default:
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/30';
    }
  };

  // Helper to calculate hit rate
  const calculateHitRate = (cacheMetrics) => {
    if (!cacheMetrics) return 0;
    const { hits, misses } = cacheMetrics;
    const total = hits + misses;
    return total > 0 ? ((hits / total) * 100).toFixed(1) : 0;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header Panel */}
      <motion.div initial="hidden" animate="show" variants={fadeUp} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="font-display text-4xl text-cyber-text tracking-widest uppercase">
            SYSTEM <span className="text-cyber-accent">DIAGNOSTICS & TELEMETRY</span>
          </h1>
          <p className="font-mono text-cyber-muted text-xs mt-3 leading-relaxed">
            Real-time health verification, cache efficiency tracker, queue analytics, and scan metrics for CyberShield X Core.
          </p>
        </div>
        <div className="flex items-center gap-4 font-mono text-xs">
          <div className="text-right">
            <span className="text-cyber-muted">AUTO-REFRESH:</span>
            <select 
              value={refreshInterval} 
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="bg-black/40 border border-white/10 rounded px-2 py-1 ml-2 text-cyber-accent focus:outline-none"
            >
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
              <option value={0}>OFF</option>
            </select>
          </div>
          <div className="text-right">
            <p className="text-cyber-muted">LAST UPDATED</p>
            <p className="text-white font-bold">{lastRefreshed || 'Pending...'}</p>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-40">
          <div className="w-10 h-10 border-2 border-cyber-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Status & AI Engine Status Card */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* System Status */}
            <motion.div className="cyber-card p-6 border-t-2 border-t-cyber-accent" variants={fadeUp}>
              <h2 className="font-display text-lg text-white uppercase tracking-widest mb-4">Core System Liveness</h2>
              <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                <span className="font-mono text-sm text-cyber-muted">SYSTEM STATUS</span>
                <span className={`font-mono text-xs font-bold uppercase px-3 py-1 rounded-full ${getStatusBadgeClass(healthData?.status)}`}>
                  {healthData?.status || 'UNKNOWN'}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-black/35 p-3 rounded-lg border border-white/5 text-center">
                  <p className="font-mono text-[10px] text-cyber-muted uppercase">MongoDB</p>
                  <span className={`font-mono text-[10px] inline-block font-bold uppercase mt-2 px-2 py-0.5 rounded ${getStatusBadgeClass(healthData?.services?.database?.status)}`}>
                    {healthData?.services?.database?.status}
                  </span>
                </div>
                <div className="bg-black/35 p-3 rounded-lg border border-white/5 text-center">
                  <p className="font-mono text-[10px] text-cyber-muted uppercase">Diagnostics</p>
                  <span className="font-mono text-xs text-cyber-accent font-bold block mt-2">ACTIVE</span>
                </div>
              </div>
            </motion.div>

            {/* AI Engine Status */}
            <motion.div className="cyber-card p-6 border-t-2 border-t-purple-500" variants={fadeUp}>
              <h2 className="font-display text-lg text-white uppercase tracking-widest mb-4">AI Engine Health</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-black/25 rounded-lg border border-white/5">
                  <span className="font-mono text-xs text-cyber-muted">AI CONNECTION</span>
                  <span className={`font-mono text-[10px] font-bold px-2 py-1 rounded uppercase ${getStatusBadgeClass(healthData?.services?.aiEngine?.mode)}`}>
                    {healthData?.services?.aiEngine?.mode}
                  </span>
                </div>
                <div className="bg-black/25 p-4 rounded-lg border border-white/5">
                  <p className="font-mono text-[10px] text-cyber-muted uppercase mb-1">Engine Details</p>
                  <p className="font-mono text-xs text-white leading-relaxed">
                    {healthData?.services?.aiEngine?.detail}
                  </p>
                </div>
                <div className="flex justify-between text-xs font-mono border-t border-white/5 pt-3">
                  <span className="text-cyber-muted">OLLAMA STATUS:</span>
                  <span className={healthData?.services?.aiEngine?.online ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {healthData?.services?.aiEngine?.online ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
              </div>
            </motion.div>
            
          </div>

          {/* Telemetry Dashboard: Cache & Queues */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Caching Metrics */}
            <motion.div className="cyber-card p-6" variants={fadeUp}>
              <h2 className="font-display text-lg text-white uppercase tracking-widest mb-4">CacheProvider Telemetry</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                  <p className="font-mono text-[10px] text-cyber-muted uppercase mb-1">CACHE HITS</p>
                  <p className="font-display text-2xl text-emerald-400 font-black">{healthData?.services?.cache?.metrics?.hits || 0}</p>
                </div>
                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                  <p className="font-mono text-[10px] text-cyber-muted uppercase mb-1">CACHE MISSES</p>
                  <p className="font-display text-2xl text-rose-400 font-black">{healthData?.services?.cache?.metrics?.misses || 0}</p>
                </div>
                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                  <p className="font-mono text-[10px] text-cyber-muted uppercase mb-1">CACHE SETS</p>
                  <p className="font-display text-2xl text-cyber-accent font-black">{healthData?.services?.cache?.metrics?.sets || 0}</p>
                </div>
                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                  <p className="font-mono text-[10px] text-cyber-muted uppercase mb-1">HIT RATE</p>
                  <p className="font-display text-2xl text-purple-400 font-black">
                    {calculateHitRate(healthData?.services?.cache?.metrics)}%
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Background Workers & Queues */}
            <motion.div className="cyber-card p-6" variants={fadeUp}>
              <h2 className="font-display text-lg text-white uppercase tracking-widest mb-4">QueueProvider Background Workers</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-cyber-muted uppercase text-[10px] tracking-wider">
                      <th className="pb-3">Worker / Queue</th>
                      <th className="pb-3">Pending (Size)</th>
                      <th className="pb-3">Active Tasks</th>
                      <th className="pb-3">Completed</th>
                      <th className="pb-3">Failed (DLQ)</th>
                      <th className="pb-3 text-right">Avg Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {healthData?.services?.queues?.metrics && Object.entries(healthData.services.queues.metrics).map(([qName, metrics]) => (
                      <tr key={qName} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 font-bold text-white uppercase">{qName} worker</td>
                        <td className="py-3 text-cyber-accent">{metrics.size}</td>
                        <td className="py-3 text-amber-400">{metrics.active}</td>
                        <td className="py-3 text-emerald-400">{metrics.completed}</td>
                        <td className="py-3">
                          <span className={metrics.dlqSize > 0 ? 'text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded' : 'text-cyber-muted'}>
                            {metrics.dlqSize}
                          </span>
                        </td>
                        <td className="py-3 text-right text-purple-400 font-bold">{metrics.avgLatencyMs}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Scan Performance Analytics */}
            <motion.div className="cyber-card p-6" variants={fadeUp}>
              <h2 className="font-display text-lg text-white uppercase tracking-widest mb-4">Scan Performance Analytics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                
                {/* Duration Stats */}
                <div className="bg-black/20 p-5 rounded-xl border border-white/5 space-y-4">
                  <h3 className="font-display text-[10px] text-cyber-muted uppercase tracking-widest border-b border-white/5 pb-2">Execution Durations</h3>
                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-cyber-muted">Avg Scan Duration:</span>
                      <span className="text-white font-bold">{healthData?.services?.scanPerformance?.averageScanTime || 0}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyber-muted">Fastest Scan:</span>
                      <span className="text-emerald-400 font-bold">{healthData?.services?.scanPerformance?.fastestScan || 0}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyber-muted">Slowest Scan:</span>
                      <span className="text-rose-400 font-bold">{healthData?.services?.scanPerformance?.slowestScan || 0}s</span>
                    </div>
                  </div>
                </div>

                {/* Scan Throughput Stats */}
                <div className="bg-black/20 p-5 rounded-xl border border-white/5 space-y-4">
                  <h3 className="font-display text-[10px] text-cyber-muted uppercase tracking-widest border-b border-white/5 pb-2">Scan Throughput</h3>
                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-cyber-muted">Scans Per Hour:</span>
                      <span className="text-cyber-accent font-bold">{healthData?.services?.scanPerformance?.scansPerHour || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyber-muted">Total Run Scans:</span>
                      <span className="text-white font-bold">{healthData?.services?.scanPerformance?.totalScans || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyber-muted">Queue Scheduler:</span>
                      <span className="text-purple-400 font-bold">ONLINE</span>
                    </div>
                  </div>
                </div>

                {/* Run Rates Stats */}
                <div className="bg-black/20 p-5 rounded-xl border border-white/5 space-y-4">
                  <h3 className="font-display text-[10px] text-cyber-muted uppercase tracking-widest border-b border-white/5 pb-2">Scan Execution Rates</h3>
                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-cyber-muted">Success Rate:</span>
                      <span className="text-emerald-400 font-bold">{healthData?.services?.scanPerformance?.successRate || 100}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyber-muted">Failure Rate:</span>
                      <span className="text-rose-400 font-bold">{healthData?.services?.scanPerformance?.failureRate || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyber-muted">Active Queue Size:</span>
                      <span className="text-amber-400 font-bold">{healthData?.services?.scanPerformance?.activeQueueSize || 0}</span>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>

          </div>
        </div>
      )}
    </div>
  );
}
