import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';

const STATUS_CONFIG = {
  HEALTHY: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400'
  },
  STABLE: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400'
  },
  LIVE: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400'
  },
  PASSING: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400'
  },
  PASSED: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400'
  },
  DEGRADED: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400'
  },
  CORRELATED_DEGRADATION: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    dot: 'bg-rose-400'
  },
  POST_DEPLOY_LATENCY_SPIKE: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400'
  },
  NO_RECENT_DEPLOYMENTS: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    dot: 'bg-cyan-400'
  },
  BUILDING: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    dot: 'bg-blue-400'
  },
  OFFLINE: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    dot: 'bg-rose-400'
  },
  FAILED: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    dot: 'bg-rose-400'
  },
  NOT_CONFIGURED: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    dot: 'bg-cyan-400'
  },
  'NOT CONFIGURED': {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    dot: 'bg-cyan-400'
  },
  UNKNOWN: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    dot: 'bg-slate-400'
  }
};

const formatUptime = (seconds) => {
  if (!seconds || seconds <= 0) return '0s';
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(' ');
};

const formatDuration = (ms) => {
  if (!ms || ms <= 0) return 'NOT AVAILABLE';
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const remSec = sec % 60;
  return `${min}m ${remSec}s`;
};

export default function NexusDeploymentHealth() {
  const [healthData, setHealthData] = useState(null);
  const [deploymentData, setDeploymentData] = useState(null);
  const [correlationData, setCorrelationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pollInterval, setPollInterval] = useState(30000); // 30s default
  const [lastUpdated, setLastUpdated] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const isFetchingRef = useRef(false);

  const fetchObservability = async (isManual = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (isManual) setRefreshing(true);

    try {
      const [hRes, dRes, cRes] = await Promise.allSettled([
        api.get('/admin/system-health'),
        api.get('/api/admin/deployments').catch(() => api.get('/admin/deployments')),
        api.get('/api/admin/deployments/correlation').catch(() => api.get('/admin/deployments/correlation'))
      ]);

      if (hRes.status === 'fulfilled') setHealthData(hRes.value.data);
      if (dRes.status === 'fulfilled') setDeploymentData(dRes.value.data);
      if (cRes.status === 'fulfilled') setCorrelationData(cRes.value.data);

      setLastUpdated(new Date().toLocaleTimeString());
      if (isManual) toast.success('Deployment observability telemetry synced');
    } catch (err) {
      toast.error('Failed to sync deployment observability telemetry');
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchObservability();
    if (pollInterval <= 0) return;
    const timer = setInterval(() => {
      fetchObservability();
    }, pollInterval);
    return () => clearInterval(timer);
  }, [pollInterval]);

  const overallStatus = healthData?.overallStatus || 'UNKNOWN';
  const overallConfig = STATUS_CONFIG[overallStatus] || STATUS_CONFIG.UNKNOWN;

  const applications = deploymentData?.applications || [
    {
      id: 'frontend',
      name: 'Frontend Client',
      provider: 'Vercel',
      deploymentStatus: 'NOT_CONFIGURED',
      runtimeStatus: 'HEALTHY',
      commitSha: null,
      branch: null,
      deployedAt: null
    },
    {
      id: 'backend',
      name: 'Backend API Engine',
      provider: 'Render',
      deploymentStatus: 'NOT_CONFIGURED',
      runtimeStatus: 'HEALTHY',
      commitSha: null,
      branch: null,
      deployedAt: null
    },
    {
      id: 'cicd',
      name: 'GitHub Actions Pipeline',
      provider: 'GitHub Actions',
      deploymentStatus: 'NOT_CONFIGURED',
      runtimeStatus: 'HEALTHY',
      commitSha: null,
      branch: null,
      deployedAt: null
    }
  ];

  const pipeline = deploymentData?.pipeline || {
    build: 'NOT_CONFIGURED',
    test: 'NOT_CONFIGURED',
    deploy: 'NOT_CONFIGURED',
    healthCheck: 'HEALTHY'
  };

  const providers = deploymentData?.providers || [
    {
      id: 'github',
      name: 'GitHub Actions',
      configured: false,
      status: 'NOT_CONFIGURED',
      detail: 'GITHUB_TOKEN not configured in environment',
      latest: null,
      history: []
    },
    {
      id: 'vercel',
      name: 'Vercel',
      configured: false,
      status: 'NOT_CONFIGURED',
      detail: 'VERCEL_TOKEN not configured in environment',
      latest: null,
      history: []
    },
    {
      id: 'render',
      name: 'Render',
      configured: false,
      status: 'NOT_CONFIGURED',
      detail: 'RENDER_API_KEY not configured in environment',
      latest: null,
      history: []
    }
  ];

  const history = deploymentData?.history || [];

  const correlation = correlationData?.correlation || {
    status: 'NO_RECENT_DEPLOYMENTS',
    correlationWindowMinutes: 30,
    recentDeployment: null,
    anomalies: [],
    impactedMetrics: [],
    evidence: 'No deployment completed within the 30-minute observation window.'
  };

  const configReadiness = correlationData?.configReadiness || {
    readinessScore: '0/3',
    providers: [
      { id: 'github', name: 'GitHub Actions', configured: false, status: 'NOT_CONFIGURED', formattingStatus: 'UNCONFIGURED', missingVariables: ['GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO'] },
      { id: 'vercel', name: 'Vercel', configured: false, status: 'NOT_CONFIGURED', formattingStatus: 'UNCONFIGURED', missingVariables: ['VERCEL_TOKEN'] },
      { id: 'render', name: 'Render', configured: false, status: 'NOT_CONFIGURED', formattingStatus: 'UNCONFIGURED', missingVariables: ['RENDER_API_KEY', 'RENDER_SERVICE_ID'] }
    ]
  };

  const corrSt = STATUS_CONFIG[correlation.status] || STATUS_CONFIG.UNKNOWN;

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-cyber-accent/20 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${overallConfig.dot} animate-pulse`} />
            <h2 className="font-display text-xl text-white tracking-widest uppercase">
              NEXUS REAL DEPLOYMENT & SYSTEM OBSERVABILITY
            </h2>
          </div>
          <p className="font-mono text-cyber-muted text-xs mt-1">
            Authoritative Server-Side Deployment Lifecycles & SOC Telemetry Aggregator
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-mono text-xs text-cyber-muted">
            <span>POLLING:</span>
            <select
              value={pollInterval}
              onChange={(e) => setPollInterval(Number(e.target.value))}
              className="bg-black/60 border border-cyber-accent/30 rounded px-2.5 py-1 text-cyber-accent focus:outline-none text-xs"
            >
              <option value={30000}>30s</option>
              <option value={60000}>60s</option>
              <option value={0}>OFF</option>
            </select>
          </div>

          <div className="text-right font-mono text-xs hidden sm:block">
            <span className="text-cyber-muted">LAST SYNC: </span>
            <span className="text-white font-bold">{lastUpdated || 'Pending...'}</span>
          </div>

          <button
            onClick={() => fetchObservability(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-1.5 rounded bg-cyber-accent/10 border border-cyber-accent/40 text-cyber-accent hover:bg-cyber-accent/20 transition font-mono text-xs disabled:opacity-50"
          >
            <svg
              className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{refreshing ? 'SYNCING...' : 'REFRESH'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-cyber-accent border-t-transparent rounded-full animate-spin mb-4" />
          <p className="font-mono text-xs text-cyber-muted uppercase tracking-widest">
            Aggregating platform deployment telemetry...
          </p>
        </div>
      ) : (
        <>
          {/* SYSTEM OVERVIEW CARDS */}
          <div>
            <h3 className="font-display text-xs text-cyber-muted uppercase tracking-widest mb-4">
              SYSTEM OVERVIEW
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className={`cyber-card p-4 border ${overallConfig.border} ${overallConfig.bg}`}>
                <p className="font-mono text-cyber-muted text-[10px] uppercase tracking-wider mb-1">
                  OVERALL STATUS
                </p>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${overallConfig.dot} animate-pulse`} />
                  <span className={`font-display text-lg font-black uppercase ${overallConfig.text}`}>
                    {overallStatus}
                  </span>
                </div>
              </div>

              <div className="cyber-card p-4 border border-white/5 bg-black/40">
                <p className="font-mono text-cyber-muted text-[10px] uppercase tracking-wider mb-1">
                  UPTIME
                </p>
                <p className="font-display text-lg font-bold text-white">
                  {formatUptime(healthData?.summary?.uptimeSeconds)}
                </p>
              </div>

              <div className="cyber-card p-4 border border-white/5 bg-black/40">
                <p className="font-mono text-cyber-muted text-[10px] uppercase tracking-wider mb-1">
                  API LATENCY
                </p>
                <p className="font-display text-lg font-bold text-cyber-accent">
                  {healthData?.summary?.apiLatencyMs !== undefined ? `${healthData.summary.apiLatencyMs} ms` : 'N/A'}
                </p>
              </div>

              <div className="cyber-card p-4 border border-white/5 bg-black/40">
                <p className="font-mono text-cyber-muted text-[10px] uppercase tracking-wider mb-1">
                  ERROR RATE
                </p>
                <p
                  className={`font-display text-lg font-bold ${
                    (healthData?.summary?.errorRate || 0) > 5 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {healthData?.summary?.errorRate !== undefined ? `${healthData.summary.errorRate}%` : '0%'}
                </p>
              </div>

              <div className="cyber-card p-4 border border-white/5 bg-black/40 col-span-2 md:col-span-1">
                <p className="font-mono text-cyber-muted text-[10px] uppercase tracking-wider mb-1">
                  CONFIG READINESS
                </p>
                <p className="font-display text-lg font-bold text-cyan-400">
                  {configReadiness.readinessScore}
                </p>
              </div>
            </div>
          </div>

          {/* DEPLOYMENT IMPACT & HEALTH CORRELATION PANEL */}
          <div className="cyber-card p-6 border border-cyber-accent/20 bg-black/40 relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-4 mb-4">
              <div>
                <h3 className="font-display text-sm font-bold text-white uppercase tracking-widest">
                  DEPLOYMENT IMPACT & HEALTH CORRELATION
                </h3>
                <p className="font-mono text-[10px] text-cyber-muted mt-0.5">
                  Automated Correlation Engine (30-Minute Time-Window Analysis)
                </p>
              </div>
              <span className={`font-mono text-xs font-bold px-3 py-1 rounded border ${corrSt.bg} ${corrSt.text} ${corrSt.border}`}>
                CORRELATION STATE: {correlation.status}
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs text-cyber-text">
              <p className="text-white/80 leading-relaxed bg-black/60 p-3 rounded-lg border border-white/5">
                <span className="text-cyber-muted">EVIDENCE SUMMARY: </span>
                <span>{correlation.evidence}</span>
              </p>

              {correlation.anomalies.length > 0 && (
                <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 space-y-1">
                  <span className="text-amber-400 font-bold text-[11px] uppercase tracking-wider block mb-1">
                    DETECTED TELEMETRY ANOMALIES ({correlation.anomalies.length}):
                  </span>
                  {correlation.anomalies.map((anom, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-amber-300 text-xs">
                      <span>•</span>
                      <span>{anom}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* PROVIDER CONFIGURATION READINESS MATRIX */}
          <div>
            <h3 className="font-display text-xs text-cyber-muted uppercase tracking-widest mb-4">
              PROVIDER CONFIGURATION READINESS DIAGNOSTICS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {configReadiness.providers.map((p) => {
                const isReady = p.configured && p.formattingStatus === 'CONFIGURED_VALID_FORMAT';
                return (
                  <div key={p.id} className="cyber-card p-5 border border-white/10 bg-black/40 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
                        <h4 className="font-display text-sm font-bold text-white uppercase">{p.name}</h4>
                        <span className={`font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${isReady ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'}`}>
                          {isReady ? 'READY' : (p.status === 'MISSING_REQUIRED_ENV' ? 'MISSING CONFIG' : 'NOT CONFIGURED')}
                        </span>
                      </div>
                      <p className="font-mono text-xs text-cyber-muted mb-3">
                        Format Check: <span className={isReady ? 'text-emerald-400 font-bold' : 'text-cyan-400'}>{p.formattingStatus}</span>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/5 font-mono text-[11px]">
                      {p.missingVariables.length > 0 ? (
                        <div className="space-y-1">
                          <span className="text-cyber-muted text-[10px] uppercase">Missing Env Vars:</span>
                          <div className="flex flex-wrap gap-1">
                            {p.missingVariables.map((v) => (
                              <span key={v} className="px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px]">
                                {v}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <span className="text-emerald-400 font-bold">All required environment variables present</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* NEXUS DEPLOYMENT STATUS PANEL */}
          <div className="cyber-card p-6 border border-cyber-accent/20 bg-black/40 relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-4 mb-6">
              <div>
                <h3 className="font-display text-sm font-bold text-white uppercase tracking-widest">
                  NEXUS DEPLOYMENT STATUS
                </h3>
                <p className="font-mono text-[10px] text-cyber-muted mt-0.5">
                  Application Deployment & CI/CD Telemetry Mapping
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {applications.map((app) => {
                const st = STATUS_CONFIG[app.deploymentStatus] || STATUS_CONFIG.UNKNOWN;
                return (
                  <div key={app.id} className="p-4 rounded-xl border border-white/10 bg-black/60 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-display text-sm font-bold text-white uppercase">{app.name}</span>
                        <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${st.bg} ${st.text} ${st.border}`}>
                          {app.deploymentStatus === 'NOT_CONFIGURED' ? 'DEPLOYMENT MONITORING NOT CONFIGURED' : app.deploymentStatus}
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-cyber-muted mb-3">Provider: <span className="text-cyan-400 font-bold">{app.provider}</span></p>
                    </div>

                    <div className="pt-3 border-t border-white/5 space-y-1 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-cyber-muted">COMMIT:</span>
                        <span className="text-white font-mono">{app.commitSha || 'UNKNOWN'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cyber-muted">BRANCH:</span>
                        <span className="text-white font-mono">{app.branch || 'UNKNOWN'}</span>
                      </div>
                      {app.runNumber && (
                        <div className="flex justify-between">
                          <span className="text-cyber-muted">RUN NUMBER:</span>
                          <span className="text-cyber-accent font-mono">#{app.runNumber}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[10px] text-white/40 pt-1">
                        <span>DEPLOYED AT:</span>
                        <span className="truncate max-w-[140px]" title={app.deployedAt || 'NOT AVAILABLE'}>{app.deployedAt || 'NOT AVAILABLE'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DEPLOYMENT PIPELINE VISUALIZER */}
          <div className="cyber-card p-6 border border-white/10 bg-black/40">
            <h3 className="font-display text-xs text-cyber-muted uppercase tracking-widest mb-6">
              DEPLOYMENT PIPELINE VISUALIZATION
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
              {[
                { stage: 'BUILD', status: pipeline.build },
                { stage: 'TEST', status: pipeline.test },
                { stage: 'DEPLOY', status: pipeline.deploy },
                { stage: 'HEALTH CHECK', status: pipeline.healthCheck }
              ].map((step, idx) => {
                const st = STATUS_CONFIG[step.status] || STATUS_CONFIG.UNKNOWN;
                return (
                  <div key={step.stage} className={`p-4 rounded-xl border ${st.border} ${st.bg} relative flex flex-col justify-between`}>
                    <div>
                      <span className="font-mono text-[10px] text-cyber-muted uppercase">STAGE 0{idx + 1}</span>
                      <h4 className="font-display text-sm font-bold text-white uppercase mt-0.5">{step.stage}</h4>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className={`font-mono text-xs font-bold ${st.text}`}>{step.status}</span>
                      <span className={`w-2.5 h-2.5 rounded-full ${st.dot}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RECENT DEPLOYMENT HISTORY */}
          <div className="cyber-card p-6 border border-white/10 bg-black/40">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display text-xs text-cyber-muted uppercase tracking-widest">
                RECENT DEPLOYMENTS HISTORY (MAX 10)
              </h3>
              <span className="font-mono text-[10px] text-cyber-muted">{history.length} RECORD(S)</span>
            </div>

            {history.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-white/10 rounded-xl bg-black/20 font-mono text-xs text-cyber-muted uppercase">
                DEPLOYMENT HISTORY NOT AVAILABLE (PROVIDER INTEGRATION REQUIRED)
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-cyber-muted text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">TIME</th>
                      <th className="py-2.5 px-3">PROVIDER</th>
                      <th className="py-2.5 px-3">SERVICE</th>
                      <th className="py-2.5 px-3">COMMIT</th>
                      <th className="py-2.5 px-3">BRANCH</th>
                      <th className="py-2.5 px-3">STATUS</th>
                      <th className="py-2.5 px-3">DURATION</th>
                      <th className="py-2.5 px-3 text-right">METADATA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-cyber-text">
                    {history.map((rec) => {
                      const st = STATUS_CONFIG[rec.status] || STATUS_CONFIG.UNKNOWN;
                      return (
                        <tr key={rec.id} className="hover:bg-white/5 transition">
                          <td className="py-3 px-3 text-white/70 whitespace-nowrap">
                            {rec.createdAt ? new Date(rec.createdAt).toLocaleTimeString() : 'N/A'}
                          </td>
                          <td className="py-3 px-3 font-bold text-cyan-400 whitespace-nowrap">{rec.provider}</td>
                          <td className="py-3 px-3 text-white whitespace-nowrap">{rec.service}</td>
                          <td className="py-3 px-3 font-mono text-cyber-accent">{rec.commit || 'UNKNOWN'}</td>
                          <td className="py-3 px-3 text-white/80">{rec.branch || 'UNKNOWN'}</td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${st.bg} ${st.text} ${st.border}`}>
                              {rec.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-white/60 whitespace-nowrap">{formatDuration(rec.durationMs)}</td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => setSelectedRecord(rec)}
                              className="px-2.5 py-1 rounded bg-white/5 border border-white/10 hover:border-cyber-accent/40 text-cyber-accent transition text-[10px] font-mono"
                            >
                              INSPECT
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* METADATA INSPECTION MODAL */}
      <AnimatePresence>
        {selectedRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="cyber-card p-6 border border-cyber-accent/40 max-w-lg w-full bg-black/90 space-y-4 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="font-display text-sm font-bold text-white uppercase">
                  DEPLOYMENT METADATA INSPECTION
                </h3>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="text-cyber-muted hover:text-white font-mono text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 font-mono text-xs text-cyber-text">
                <div className="flex justify-between border-b border-white/5 py-1.5">
                  <span className="text-cyber-muted">PROVIDER:</span>
                  <span className="text-cyan-400 font-bold">{selectedRecord.provider}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 py-1.5">
                  <span className="text-cyber-muted">SERVICE:</span>
                  <span className="text-white">{selectedRecord.service}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 py-1.5">
                  <span className="text-cyber-muted">COMMIT SHA:</span>
                  <span className="text-cyber-accent font-mono">{selectedRecord.commit || 'UNKNOWN'}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 py-1.5">
                  <span className="text-cyber-muted">BRANCH:</span>
                  <span className="text-white">{selectedRecord.branch || 'UNKNOWN'}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 py-1.5">
                  <span className="text-cyber-muted">STATUS:</span>
                  <span className="text-emerald-400 font-bold">{selectedRecord.status}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 py-1.5">
                  <span className="text-cyber-muted">DURATION:</span>
                  <span className="text-white">{formatDuration(selectedRecord.durationMs)}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 py-1.5">
                  <span className="text-cyber-muted">TIMESTAMP:</span>
                  <span className="text-white">{selectedRecord.createdAt || 'NOT AVAILABLE'}</span>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-1.5 bg-cyber-accent/10 border border-cyber-accent/40 text-cyber-accent hover:bg-cyber-accent/20 transition font-mono text-xs rounded"
                >
                  CLOSE
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
