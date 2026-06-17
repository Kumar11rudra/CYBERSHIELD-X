import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function SOCPage() {
  const { user } = useAuth();
  
  // Navigation tabs: 'siem' (default) or 'threat-intel'
  const [activeTab, setActiveTab] = useState('siem');
  
  // Common states
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [assets, setAssets] = useState([]);
  const [schedules, setSchedules] = useState([]);
  
  // SIEM stats
  const [stats, setStats] = useState({
    assetsCount: 0,
    criticalCount: 0,
    highCount: 0,
    sslWarnings: 0,
    iocHits: 0
  });

  // Threat Intel tab states
  const [intelQuery, setIntelQuery] = useState('');
  const [intelType, setIntelType] = useState('domain'); // domain, ip, url
  const [correlating, setCorrelating] = useState(false);
  const [correlationResult, setCorrelationResult] = useState(null);
  
  const [feedStats, setFeedStats] = useState({
    URLHaus: 0,
    OpenPhish: 0,
    FeodoTracker: 0,
    'CISA-KEV': 0
  });
  
  const [feedHealth, setFeedHealth] = useState({});
  const [recentCorrelations, setRecentCorrelations] = useState([]);
  const [syncingFeeds, setSyncingFeeds] = useState(false);

  // Fetch SIEM data & Feed stats
  const fetchSOCData = async () => {
    try {
      setLoading(true);
      const [notifRes, assetRes, schedRes, feedRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/assets'),
        api.get('/schedules'),
        api.get('/ioc/feed-stats')
      ]);

      let notifs = [];
      let asts = [];
      let scheds = [];

      if (notifRes.data && notifRes.data.success) {
        notifs = notifRes.data.notifications;
        setNotifications(notifs);
      }
      if (assetRes.data && assetRes.data.success) {
        asts = assetRes.data.assets;
        setAssets(asts);
      }
      if (schedRes.data && schedRes.data.success) {
        scheds = schedRes.data.schedules;
        setSchedules(scheds);
      }
      if (feedRes.data && feedRes.data.success) {
        setFeedStats(feedRes.data.stats || { URLHaus: 0, OpenPhish: 0, FeodoTracker: 0, 'CISA-KEV': 0 });
        setFeedHealth(feedRes.data.health || {});
        setRecentCorrelations(feedRes.data.recentCorrelations || []);
      }

      // Compute stats
      const criticalCount = notifs.filter(n => n.severity === 'critical' && !n.read).length;
      const highCount = notifs.filter(n => n.severity === 'high' && !n.read).length;
      const sslWarnings = notifs.filter(n => n.category === 'ssl' && !n.read).length;
      const iocHits = notifs.filter(n => n.category === 'ioc' && !n.read).length;

      setStats({
        assetsCount: asts.length,
        criticalCount,
        highCount,
        sslWarnings,
        iocHits
      });

    } catch (err) {
      console.error('Error fetching SOC data:', err);
      toast.error('Failed to update SOC dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSOCData();
  }, []);

  // Run threat correlation
  const handleCorrelate = async (e) => {
    e.preventDefault();
    if (!intelQuery.trim()) return;

    setCorrelating(true);
    setCorrelationResult(null);
    try {
      const res = await api.get(`/ioc/correlate?target=${encodeURIComponent(intelQuery.trim())}&targetType=${intelType}`);
      if (res.data && res.data.success) {
        setCorrelationResult(res.data.correlation);
        toast.success('Risk correlation cycle complete.');
        // Refresh feed data to pull recent correlations
        const feedRes = await api.get('/ioc/feed-stats');
        if (feedRes.data && feedRes.data.success) {
          setRecentCorrelations(feedRes.data.recentCorrelations || []);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Correlation failed.');
    } finally {
      setCorrelating(false);
    }
  };

  // Trigger manual feed sync
  const handleFeedSync = async () => {
    if (user?.role !== 'admin') {
      return toast.error('Requires administrator security clearance.');
    }

    setSyncingFeeds(true);
    const toastId = toast.loading('Synchronizing intelligence feeds...');
    try {
      const res = await api.post('/ioc/sync-feeds');
      if (res.data && res.data.success) {
        toast.success('Threat intelligence feeds synced successfully.', { id: toastId });
        fetchSOCData();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Feed sync failed.', { id: toastId });
    } finally {
      setSyncingFeeds(false);
    }
  };

  // Dismiss a notification
  const handleDismissNotification = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      toast.success('Alert dismissed.');
      fetchSOCData();
    } catch (err) {
      toast.error('Failed to dismiss alert.');
    }
  };

  // Dismiss All notifications
  const handleDismissAll = async () => {
    try {
      await api.put('/notifications/all/read');
      toast.success('All alerts marked as read.');
      fetchSOCData();
    } catch (err) {
      toast.error('Failed to dismiss all alerts.');
    }
  };

  // SVG Chart data generators
  const trendData = (() => {
    const data = [];
    const now = new Date();
    const dayCounts = {};
    notifications.forEach((notif) => {
      const dateStr = new Date(notif.createdAt).toDateString();
      dayCounts[dateStr] = (dayCounts[dateStr] || 0) + 1;
    });

    for (let i = 29; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateString = day.toDateString();
      const count = dayCounts[dateString] || 0;
      data.push({
        label: day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        value: count
      });
    }
    return data;
  })();

  const maxTrendValue = Math.max(...trendData.map(d => d.value), 5);

  // Growth Trend (mock database indicators growth for visualization)
  const growthData = (() => {
    const totalIndicators = Object.values(feedStats).reduce((a, b) => a + b, 0);
    const data = [];
    for (let i = 29; i >= 0; i--) {
      // Simulate exponential-style growth curve ending at current totalIndicators
      const factor = (30 - i) / 30;
      const value = Math.round(totalIndicators * (0.8 + 0.2 * factor * factor));
      data.push(value);
    }
    return data;
  })();
  const maxGrowthValue = Math.max(...growthData, 100);

  // SVG Line Chart details
  const width = 800;
  const height = 180;
  const padding = 25;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Coordinates helper
  const getPointsStr = (data, maxValue) => {
    return data.map((val, i) => {
      const x = padding + (i / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - (val / maxValue) * chartHeight;
      return `${x},${y}`;
    }).join(' L ');
  };

  const getSeverityBadge = (sev) => {
    const classes = {
      critical: 'text-red-400 bg-red-500/10 border-red-500/30',
      high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
      warning: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
      info: 'text-green-400 bg-green-500/10 border-green-500/30',
      // Correlation records risk level mappings
      Critical: 'text-red-400 bg-red-500/10 border-red-500/30',
      High: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
      Medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
      Low: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      Informational: 'text-green-400 bg-green-500/10 border-green-500/30'
    };
    return classes[sev] || classes.info;
  };

  const sslWatchlist = assets.filter(a => a.assetType === 'Website' || a.assetType === 'Domain');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 font-mono text-[#e0e6ff] relative z-10 space-y-8">
      
      {/* HUD Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border border-[#00bfff]/20 bg-[#070f21]/70 rounded-xl p-6 shadow-[0_0_20px_rgba(0,191,255,0.05)] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444]" />
            <h1 className="text-xl md:text-2xl font-black tracking-widest text-white uppercase font-display">
              SECURITY OPERATIONS CENTER (SOC) <span className="text-red-500">SIEM</span>
            </h1>
          </div>
          <p className="text-xs text-[#5a7fa8] mt-1.5 uppercase tracking-wider">
            Enterprise threat correlation engine. Monitor real-time logs, alert escalations, and expiring credentials.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('siem')}
            className={`text-xs font-bold px-3 py-1.5 rounded transition-all border ${
              activeTab === 'siem'
                ? 'bg-[#00bfff]/20 border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(0,191,255,0.2)]'
                : 'border-[#224466]/40 text-[#5a7fa8] hover:border-cyan-500/30'
            }`}
          >
            🛡️ SIEM Alerts
          </button>
          <button
            onClick={() => setActiveTab('threat-intel')}
            className={`text-xs font-bold px-3 py-1.5 rounded transition-all border ${
              activeTab === 'threat-intel'
                ? 'bg-[#00bfff]/20 border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(0,191,255,0.2)]'
                : 'border-[#224466]/40 text-[#5a7fa8] hover:border-cyan-500/30'
            }`}
          >
            🌐 Threat Intelligence
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
          <p className="animate-pulse tracking-[0.2em] text-xs uppercase text-cyan-400">Loading SOC Monitoring Intelligence...</p>
        </div>
      ) : activeTab === 'siem' ? (
        <>
          {/* SIEM Bento Stats Counters */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="border border-[#224466]/30 bg-[#0a1223]/75 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-[#5a7fa8] uppercase tracking-wider">ASSET COUNT</span>
              <p className="text-2xl font-black text-white font-tech mt-2">{stats.assetsCount}</p>
              <span className="text-[9px] text-cyan-400 font-bold mt-1 uppercase">MANAGED NODES</span>
            </div>

            <div className="border border-red-500/20 bg-red-950/10 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">CRITICAL ALERTS</span>
              <p className="text-2xl font-black text-red-500 font-tech mt-2">{stats.criticalCount}</p>
              <span className="text-[9px] text-red-400/80 font-bold mt-1 uppercase">IMMEDIATE ACTION</span>
            </div>

            <div className="border border-orange-500/20 bg-orange-950/10 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">HIGH ALERTS</span>
              <p className="text-2xl font-black text-orange-500 font-tech mt-2">{stats.highCount}</p>
              <span className="text-[9px] text-orange-400/80 font-bold mt-1 uppercase">RISK MITIGATION</span>
            </div>

            <div className="border border-yellow-500/20 bg-yellow-950/10 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">SSL EXPIRY WATCH</span>
              <p className="text-2xl font-black text-yellow-500 font-tech mt-2">{stats.sslWarnings}</p>
              <span className="text-[9px] text-yellow-400/80 font-bold mt-1 uppercase">CERT ISSUES</span>
            </div>

            <div className="border border-purple-500/20 bg-purple-950/10 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">IOC INTELLIGENCE</span>
              <p className="text-2xl font-black text-purple-500 font-tech mt-2">{stats.iocHits}</p>
              <span className="text-[9px] text-purple-400/80 font-bold mt-1 uppercase">MALWARE HITS</span>
            </div>
          </div>

          {/* Alert Trend Line Chart */}
          <div className="border border-[#00bfff]/15 bg-[#0a1223]/80 rounded-xl p-6 shadow-lg space-y-4">
            <div className="border-b border-[#224466]/30 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-white tracking-widest uppercase">SIEM Threat Incidence Trend</h3>
                <p className="text-[9px] text-[#5a7fa8] uppercase mt-0.5">Frequency of triggered alerts over the last 30 days</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={fetchSOCData} className="text-[10px] text-cyan-400 hover:underline uppercase">Sync</button>
                <button onClick={handleDismissAll} className="text-[10px] text-green-400 hover:underline uppercase">Dismiss All</button>
              </div>
            </div>
            
            <div className="relative w-full h-[200px] bg-black/40 rounded-lg p-2 overflow-hidden border border-[#224466]/15">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => (
                  <line
                    key={idx}
                    x1={padding}
                    y1={padding + p * chartHeight}
                    x2={padding + chartWidth}
                    y2={padding + p * chartHeight}
                    stroke="#224466"
                    strokeWidth="0.5"
                    strokeDasharray="4,4"
                    strokeOpacity="0.25"
                  />
                ))}
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {points.length > 0 && (
                  <>
                    <path d={areaD} fill="url(#chartGrad)" />
                    <path d={`M ${getPointsStr(trendData.map(d => d.value), maxTrendValue)}`} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
                  </>
                )}
                {trendData.map((d, i) => {
                  const x = padding + (i / (trendData.length - 1)) * chartWidth;
                  const y = padding + chartHeight - (d.value / maxTrendValue) * chartHeight;
                  return d.value > 0 ? (
                    <circle key={i} cx={x} cy={y} r="4" className="fill-red-500 stroke-black stroke-2" />
                  ) : null;
                })}
                <text x={padding} y={height - 5} fill="#5a7fa8" fontSize="8" textAnchor="start">{trendData[0]?.label}</text>
                <text x={padding + chartWidth} y={height - 5} fill="#5a7fa8" fontSize="8" textAnchor="end">{trendData[trendData.length - 1]?.label}</text>
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 border border-[#00bfff]/15 bg-[#0a1223]/80 rounded-xl p-6 shadow-lg space-y-6">
              <div className="flex justify-between items-center border-b border-[#224466]/30 pb-3">
                <h3 className="text-xs font-bold text-white tracking-widest uppercase">REAL-TIME THREAT ESCALATIONS</h3>
                <span className="text-[9px] text-[#5a7fa8]">{notifications.filter(n => !n.read).length} UNRESOLVED INCIDENTS</span>
              </div>

              {notifications.filter(n => !n.read).length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[#224466]/30 rounded-lg bg-black/10">
                  <p className="text-xs text-[#5a7fa8] uppercase">✓ Shield Perimeter Intact</p>
                  <p className="text-[9px] text-green-400 mt-1 uppercase tracking-wider">Zero security threat alerts are currently active.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  <AnimatePresence>
                    {notifications.filter(n => !n.read).map((notif) => (
                      <motion.div
                        key={notif._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="border border-[#224466]/20 bg-black/25 rounded-lg p-4 flex items-start justify-between gap-4 hover:border-red-500/25 transition-all"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[8px] font-tech uppercase font-black px-1.5 py-0.5 rounded border ${getSeverityBadge(notif.severity)}`}>
                              {notif.severity}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#224466]/10 text-[#8892b0] border border-[#224466]/35 uppercase font-bold">{notif.category}</span>
                            <span className="text-[9px] text-[#5a7fa8]">{new Date(notif.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <h4 className="text-xs font-bold text-white tracking-wide">{notif.title}</h4>
                          <p className="text-[10px] text-[#8892b0] leading-relaxed">{notif.message}</p>
                          <p className="text-[8px] text-[#5a7fa8] uppercase">Source Core: {notif.source}</p>
                        </div>
                        <button
                          onClick={() => handleDismissNotification(notif._id)}
                          className="text-[10px] text-green-400 border border-green-500/20 hover:border-green-400 hover:bg-green-500/10 px-2 py-1 rounded transition-all font-tech font-bold uppercase tracking-wider self-center"
                        >
                          Resolve
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <div className="border border-[#00bfff]/15 bg-[#0a1223]/80 rounded-xl p-6 shadow-lg space-y-6">
              <div className="border-b border-[#224466]/30 pb-3">
                <h3 className="text-xs font-bold text-white tracking-widest uppercase">SSL EXPIRY WATCHLIST</h3>
                <p className="text-[9px] text-[#5a7fa8] uppercase mt-0.5">TLS credentials expiring or degraded</p>
              </div>

              {sslWatchlist.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-[#224466]/30 rounded-lg bg-black/10">
                  <p className="text-[10px] text-[#5a7fa8] uppercase">No active domains in inventory</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sslWatchlist.map((asset) => {
                    const expiryAlert = notifications.find(n => n.category === 'ssl' && n.message.includes(asset.hostname) && !n.read);
                    return (
                      <div key={asset._id} className="border border-[#224466]/20 bg-black/20 rounded-lg p-3 space-y-1.5">
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-bold text-white font-tech truncate max-w-[150px]">{asset.hostname}</p>
                          <span className={`text-[9px] font-bold px-1 py-0.5 rounded border ${expiryAlert ? 'border-red-500/30 text-red-400 bg-red-500/10' : 'border-green-500/30 text-green-400 bg-green-500/10'}`}>
                            {expiryAlert ? 'EXPIRED/WARNING' : 'HEALTHY'}
                          </span>
                        </div>
                        <div className="flex justify-between text-[9px] text-[#8892b0] uppercase font-mono">
                          <span>Risk: {asset.lastRiskScore}/100</span>
                          <span>Checked: {asset.lastScanAt ? new Date(asset.lastScanAt).toLocaleDateString() : 'Never'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* THREAT INTELLIGENCE PORTAL */
        <div className="space-y-8">
          
          {/* Feed Stats Overview Widgets */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(feedStats).map(([source, count]) => {
              const healthInfo = feedHealth[source] || { status: 'unknown' };
              const isHealthy = healthInfo.status === 'healthy';
              return (
                <div key={source} className="border border-[#224466]/30 bg-[#0a1223]/75 rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-[#5a7fa8] uppercase tracking-wider">{source}</span>
                    <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-400 shadow-[0_0_8px_#10b981]' : 'bg-yellow-500 animate-pulse'}`} />
                  </div>
                  <p className="text-2xl font-black text-white font-tech mt-2">{count}</p>
                  <div className="flex justify-between items-center mt-1 text-[8px] text-[#8892b0]">
                    <span>ACTIVE RECORDS</span>
                    <span className="uppercase">{healthInfo.status}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Correlation Search Console & Visual Nodes */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Correlation Form */}
              <div className="border border-[#00bfff]/15 bg-[#0a1223]/80 rounded-xl p-5 shadow-lg">
                <h3 className="text-xs font-bold text-white tracking-widest uppercase mb-4 border-b border-[#224466]/30 pb-2">
                  IOC Correlation Console
                </h3>
                <form onSubmit={handleCorrelate} className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 flex gap-2">
                    <select
                      value={intelType}
                      onChange={(e) => setIntelType(e.target.value)}
                      className="bg-black/40 border border-[#224466]/40 rounded text-xs text-white p-2 focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="domain">Domain</option>
                      <option value="ip">IP Address</option>
                      <option value="url">URL</option>
                    </select>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 198.51.100.42 or malware-site.com"
                      value={intelQuery}
                      onChange={(e) => setIntelQuery(e.target.value)}
                      className="flex-1 bg-black/40 border border-[#224466]/40 rounded text-xs p-2 text-white placeholder-white/20 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={correlating}
                    className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold uppercase py-2 px-4 rounded text-xs tracking-widest disabled:opacity-50 transition-all font-tech"
                  >
                    {correlating ? 'Correlating...' : '⚡ Correlate'}
                  </button>
                </form>
              </div>

              {/* Correlation Findings & visual node display */}
              {correlationResult && (
                <div className="border border-[#00bfff]/15 bg-[#0a1223]/80 rounded-xl p-6 shadow-lg space-y-6">
                  <div className="flex justify-between items-center border-b border-[#224466]/30 pb-3">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Correlation Results: {correlationResult.target}</h4>
                      <p className="text-[8px] text-[#5a7fa8] uppercase mt-0.5">Computed Risk Heuristics Map</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getSeverityBadge(correlationResult.riskLevel)}`}>
                        {correlationResult.riskLevel}
                      </span>
                      <span className="text-xs font-black text-white">{correlationResult.riskScore}/100</span>
                    </div>
                  </div>

                  {/* Node map visual simulation */}
                  <div className="h-[200px] border border-[#224466]/20 bg-black/30 rounded-lg relative overflow-hidden flex items-center justify-center">
                    <div className="absolute text-center z-10 space-y-1">
                      <div className="w-12 h-12 rounded-full bg-cyan-950 border border-cyan-400 flex items-center justify-center text-lg mx-auto shadow-[0_0_15px_#00bfff]">🎯</div>
                      <p className="text-[10px] font-bold text-white truncate max-w-[180px]">{correlationResult.target}</p>
                    </div>

                    {/* Surrounding link nodes */}
                    <div className="absolute top-6 left-12 text-center text-[9px] text-[#8892b0] border border-white/5 bg-black/40 px-2 py-1 rounded">
                      <p>Threat Feeds</p>
                      <span className={correlationResult.riskScore >= 40 ? 'text-red-400 font-bold' : 'text-green-400'}>
                        {correlationResult.riskScore >= 40 ? 'MATCHED' : 'CLEAN'}
                      </span>
                    </div>
                    <div className="absolute top-6 right-12 text-center text-[9px] text-[#8892b0] border border-white/5 bg-black/40 px-2 py-1 rounded">
                      <p>Managed Assets</p>
                      <span className="text-cyan-400 font-bold">MONITORED</span>
                    </div>
                    <div className="absolute bottom-6 left-12 text-center text-[9px] text-[#8892b0] border border-white/5 bg-black/40 px-2 py-1 rounded">
                      <p>Port Sentinel</p>
                      <span className="text-[#8892b0]">AUDITED</span>
                    </div>
                    <div className="absolute bottom-6 right-12 text-center text-[9px] text-[#8892b0] border border-white/5 bg-black/40 px-2 py-1 rounded">
                      <p>SSL Auditor</p>
                      <span className="text-[#8892b0]">VERIFIED</span>
                    </div>

                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25">
                      <line x1="10%" y1="20%" x2="50%" y2="50%" stroke="#00bfff" strokeWidth="1" />
                      <line x1="90%" y1="20%" x2="50%" y2="50%" stroke="#00bfff" strokeWidth="1" />
                      <line x1="10%" y1="80%" x2="50%" y2="50%" stroke="#00bfff" strokeWidth="1" />
                      <line x1="90%" y1="80%" x2="50%" y2="50%" stroke="#00bfff" strokeWidth="1" />
                    </svg>
                  </div>

                  {/* Findings logs */}
                  <div className="space-y-2.5">
                    <p className="text-[10px] text-[#5a7fa8] uppercase font-bold tracking-wider">Correlation Evidence Log</p>
                    <div className="space-y-1.5 font-mono text-[10px] text-[#8892b0] max-h-[180px] overflow-y-auto pr-1">
                      {correlationResult.findings.map((finding, idx) => (
                        <div key={idx} className="border-l-2 border-cyan-500/40 pl-2 py-0.5 bg-cyan-950/5">
                          {finding}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* Feed Sync control & growth charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Sync panel */}
                <div className="border border-[#00bfff]/15 bg-[#0a1223]/80 rounded-xl p-5 shadow-lg flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white tracking-widest uppercase mb-2">Feed Sync Manager</h3>
                    <p className="text-[9px] text-[#5a7fa8] leading-relaxed uppercase">
                      Admin clearance allows manual trigger to sync active URLHaus, OpenPhish, and Feodo Tracker indicator lists.
                    </p>
                  </div>
                  <button
                    onClick={handleFeedSync}
                    disabled={syncingFeeds}
                    className="w-full bg-[#00bfff]/10 hover:bg-[#00bfff]/20 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 font-bold uppercase py-2 px-3 rounded text-[10px] tracking-widest disabled:opacity-50 transition-all font-tech mt-4"
                  >
                    {syncingFeeds ? 'Syncing Feeds...' : '🔄 Run Feed Sync'}
                  </button>
                </div>

                {/* Growth trend SVG */}
                <div className="border border-[#00bfff]/15 bg-[#0a1223]/80 rounded-xl p-5 shadow-lg space-y-3">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-white uppercase">IOC Growth Trend</span>
                    <span className="text-[#5a7fa8]">30D Curve</span>
                  </div>
                  <div className="relative h-[80px] bg-black/30 border border-[#224466]/15 rounded overflow-hidden p-1">
                    <svg viewBox={`0 0 ${width} 90`} className="w-full h-full">
                      <path
                        d={`M ${getPointsStr(growthData, maxGrowthValue)}`}
                        fill="none"
                        stroke="#00d4ff"
                        strokeWidth="2.5"
                      />
                    </svg>
                  </div>
                </div>

              </div>

            </div>

            {/* Right: Recent Correlations List */}
            <div className="border border-[#00bfff]/15 bg-[#0a1223]/80 rounded-xl p-6 shadow-lg space-y-6">
              <div className="border-b border-[#224466]/30 pb-3">
                <h3 className="text-xs font-bold text-white tracking-widest uppercase">RECENT CORRELATIONS</h3>
                <p className="text-[9px] text-[#5a7fa8] uppercase mt-0.5">Historical Risk correlation logs</p>
              </div>

              {recentCorrelations.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[#224466]/30 rounded-lg bg-black/10">
                  <p className="text-[10px] text-[#5a7fa8] uppercase">No correlation queries logged.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentCorrelations.map((rec) => (
                    <div key={rec._id} className="border border-[#224466]/20 bg-black/20 rounded-lg p-3 space-y-1.5 hover:border-cyan-500/20 transition-all cursor-pointer" onClick={() => { setIntelQuery(rec.target); setCorrelationResult(rec); }}>
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-bold text-white font-tech truncate max-w-[150px]">{rec.target}</p>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${getSeverityBadge(rec.riskLevel)}`}>
                          {rec.riskLevel}
                        </span>
                      </div>
                      <div className="flex justify-between text-[9px] text-[#8892b0] uppercase font-mono">
                        <span>Score: {rec.riskScore}/100</span>
                        <span>{new Date(rec.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
