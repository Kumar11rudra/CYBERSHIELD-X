import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import RiskBadge from '../components/common/RiskBadge';
import ActivityTimeline from '../components/admin/ActivityTimeline';
import usePdfExport from '../hooks/usePdfExport';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const RISK_COLORS = { safe: '#00ff88', low: '#ffdd00', medium: '#ff8c00', dangerous: '#ff2244' };

const ICONS = {
  security: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
};

const Icon = ({ d, size = 14, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export default function AdminPage() {
  const { logout } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  // Analytics state
  const [analyticsOverview, setAnalyticsOverview] = useState(null);
  const [dailyActivity, setDailyActivity] = useState([]);
  const [scanTypes, setScanTypes] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  // Firewall state
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [newIP, setNewIP] = useState('');
  const [firewallLoading, setFirewallLoading] = useState(false);
  // Maintenance state
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState('');
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  // Telemetry state
  const [telemetry, setTelemetry] = useState(null);
  const [telemetryLoading, setTelemetryLoading] = useState(false);
  // Threat Injection state
  const [threatTarget, setThreatTarget] = useState('');
  const [threatType, setThreatType] = useState('url');
  const [threatRisk, setThreatRisk] = useState('dangerous');
  const [threatLoading, setThreatLoading] = useState(false);
  const navigate = useNavigate();
  const { exportAdminProfilePdf, exporting } = usePdfExport();

  const handleLogout = async () => {
    await logout({ redirectTo: '/nexus-admin' });
  };

  const fetchUserReport = async (userId) => {
    setReportLoading(true);
    setSelectedUserId(userId);
    try {
      const res = await api.get(`/admin/users/${userId}/report`);
      setReportData(res.data);
      setTab('report');
    } catch (err) {
      toast.error('Failed to decrypt intelligence report');
      setSelectedUserId(null);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([api.get('/admin/stats'), api.get('/admin/users')])
      .then(([s, u]) => { setStats(s.data); setUsers(u.data.users); })
      .catch(() => toast.error('Failed to load admin data'))
      .finally(() => setLoading(false));
  }, []);

  // Fetch analytics when analytics tab is opened
  useEffect(() => {
    if (tab !== 'analytics' || analyticsOverview) return;
    setAnalyticsLoading(true);
    Promise.all([
      api.get('/analytics/overview'),
      api.get('/analytics/daily-activity'),
      api.get('/analytics/scan-types'),
    ])
      .then(([ov, da, st]) => {
        setAnalyticsOverview(ov.data.overview);
        setDailyActivity(da.data.dailyActivity);
        setScanTypes(st.data.scanTypes.map((t, i) => ({ ...t, fill: ['#00d4ff','#00ff88','#ff8c00','#ff2244','#a855f7','#f59e0b'][i % 6] })));
      })
      .catch(() => toast.error('Analytics feed offline'))
      .finally(() => setAnalyticsLoading(false));
  }, [tab]);

  // Fetch Firewall rules when firewall tab opened
  useEffect(() => {
    if (tab !== 'firewall') return;
    setFirewallLoading(true);
    api.get('/admin/firewall')
      .then(r => setBlockedIPs(r.data.blockedIPs))
      .catch(() => toast.error('Firewall data unavailable'))
      .finally(() => setFirewallLoading(false));
  }, [tab]);

  // Fetch Maintenance status when maintenance tab opened
  useEffect(() => {
    if (tab !== 'maintenance') return;
    api.get('/admin/maintenance')
      .then(r => { setMaintenanceMode(r.data.maintenanceMode); setMaintenanceMsg(r.data.maintenanceMessage); })
      .catch(() => toast.error('Could not load maintenance status'));
  }, [tab]);

  // Fetch Audit Logs when audit tab opened
  useEffect(() => {
    if (tab !== 'audit') return;
    setAuditLoading(true);
    api.get('/admin/audit-logs?limit=50')
      .then(r => setAuditLogs(r.data.logs))
      .catch(() => toast.error('Audit log feed offline'))
      .finally(() => setAuditLoading(false));
  }, [tab]);

  // Fetch Telemetry when telemetry tab opened
  useEffect(() => {
    if (tab !== 'telemetry') return;
    setTelemetryLoading(true);
    api.get('/admin/telemetry')
      .then(r => setTelemetry(r.data))
      .catch(() => toast.error('Forensic telemetry offline'))
      .finally(() => setTelemetryLoading(false));
  }, [tab]);

  const blockIP = async () => {
    if (!newIP.trim()) return;
    try {
      const r = await api.post('/admin/firewall', { ip: newIP.trim() });
      setBlockedIPs(r.data.blockedIPs);
      setNewIP('');
      toast.success(`IP ${newIP.trim()} blocked`);
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to block IP'); }
  };

  const unblockIP = async (ip) => {
    try {
      const r = await api.delete(`/admin/firewall/${encodeURIComponent(ip)}`);
      setBlockedIPs(r.data.blockedIPs);
      toast.success(`IP ${ip} unblocked`);
    } catch { toast.error('Failed to unblock IP'); }
  };

  const toggleMaintenance = async () => {
    setMaintenanceLoading(true);
    try {
      const r = await api.post('/admin/maintenance', { maintenanceMode: !maintenanceMode, maintenanceMessage: maintenanceMsg });
      setMaintenanceMode(r.data.maintenanceMode);
      toast.success(r.data.maintenanceMode ? '🔒 Maintenance Mode ACTIVATED' : '✅ Platform is LIVE again');
    } catch { toast.error('Failed to toggle maintenance mode'); }
    finally { setMaintenanceLoading(false); }
  };

  const injectThreat = async (e) => {
    e.preventDefault();
    if (!threatTarget.trim()) return;
    setThreatLoading(true);
    try {
      await api.post('/admin/inject-threat', { target: threatTarget, type: threatType, riskLevel: threatRisk });
      toast.success('🧪 Test threat injected into scan feed!');
      setThreatTarget('');
    } catch (err) { toast.error(err.response?.data?.error || 'Injection failed'); }
    finally { setThreatLoading(false); }
  };

  const updateRole = async (userId, role) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role });
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, role } : u));
      toast.success('Role updated');
    } catch { toast.error('Failed to update role'); }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Delete this user and all their scan data?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      toast.success('User deleted');
    } catch { toast.error('Failed to delete user'); }
  };

  const toggleBanUser = async (userId) => {
    try {
      const res = await api.post(`/admin/users/${userId}/ban`);
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, isBanned: res.data.user.isBanned } : u));
      toast.success(res.data.message);
    } catch { toast.error('Failed to toggle ban status'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
      <div className="w-8 h-8 border-2 border-cyber-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const filteredUsers = users.filter((user) => {
    const matchesSearch = [user.username, user.email].some((value) =>
      value?.toLowerCase().includes(search.toLowerCase())
    );
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-[#020508] relative">
      {/* Standalone Admin Header */}
      <header className="w-full bg-[#050000] border-b border-red-900/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center font-display font-bold text-red-500 border border-red-500/30">X</div>
          <h1 className="font-display text-xl text-red-500 font-bold tracking-widest uppercase">{t('admin.nexusCommand')}</h1>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-[10px] font-mono text-red-400/60 hover:text-red-400 border border-red-900/40 px-3 py-1.5 transition-colors uppercase tracking-[0.2em]"
          >
            {t('admin.publicFeed')}
          </button>
          <button 
            onClick={handleLogout}
            className="text-[10px] font-mono bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-black border border-red-500/50 px-3 py-1.5 transition-all uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(255,0,0,0.1)] hover:shadow-[0_0_20px_rgba(255,0,0,0.4)]"
          >
            {t('admin.terminalLogout')}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h2 className="font-display text-2xl text-white tracking-widest uppercase text-shadow-sm">{t('admin.systemOverview')}</h2>
        </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-cyber-border overflow-x-auto custom-scrollbar">
        {['overview', 'users', 'analytics', 'telemetry', 'firewall', 'maintenance', 'audit', 'inject', ...(tab === 'report' ? ['report'] : [])].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`font-mono text-xs uppercase tracking-widest px-4 py-2.5 border-b-2 transition-all whitespace-nowrap ${
              tab === t ? 'border-cyber-accent text-cyber-accent' : 'border-transparent text-cyber-muted hover:text-cyber-text'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Platform stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: t('admin.totalUsers'), value: stats.totalUsers, shadow: 'shadow-cyber-accent/20' },
                { label: t('admin.intelligenceScans'), value: stats.totalScans, shadow: 'shadow-white/5' },
                { label: t('admin.neutralizedThreats'), value: stats.riskBreakdown?.dangerous || 0, shadow: 'shadow-red-500/20', color: '#ff2244' },
                { label: t('admin.globalConfidence'), value: '99.9%', shadow: 'shadow-green-500/10', color: '#00ff88' },
              ].map((s) => (
              <div key={s.label} className={`cyber-card p-5 border-white/5 ${s.shadow}`}>
                <p className="font-mono text-cyber-muted text-[10px] uppercase tracking-wider mb-2">{s.label}</p>
                <p className="font-display text-3xl font-black" style={{ color: s.color || '#white' }}>{s.value}</p>
                <div className="mt-2 w-full h-0.5 bg-white/5 rounded-full overflow-hidden">
                   <motion.div 
                     animate={{ x: ['-100%', '100%'] }} 
                     transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                     className="w-1/3 h-full bg-white/20" 
                   />
                </div>
              </div>
            ))}
          </div>

          {/* GLOBAL SIGNAL MONITOR (New Premium Feature) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 cyber-card p-6 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                <div>
                  <h3 className="font-display text-sm font-bold text-white uppercase tracking-widest">{t('admin.globalSignalMonitor')}</h3>
                  <p className="text-[10px] font-mono text-cyber-muted mt-1 uppercase tracking-wider">{t('dashboard.heatmapDesc')}</p>
                </div>
                <div className="flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-[9px] font-mono text-green-500 uppercase font-bold">{t('dashboard.status.active')}</span>
                </div>
              </div>
              
              <div className="h-64 relative flex items-center justify-center border border-white/5 rounded-2xl bg-black/40">
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--cyber-accent)_0%,_transparent_70%)]" />
                <div className="text-center z-10">
                   <div className="w-48 h-1 bg-white/5 rounded-full mb-4 overflow-hidden">
                      <motion.div animate={{ width: ['0%', '100%'] }} transition={{ duration: 3, repeat: Infinity }} className="h-full bg-cyber-accent shadow-[0_0_10px_var(--cyber-accent)]" />
                   </div>
                   <p className="font-mono text-[10px] text-cyber-muted uppercase tracking-[0.3em] font-bold">{t('admin.mappingNeuralNodes')}</p>
                   <p className="text-[9px] text-white/30 mt-1 uppercase italic">{t('admin.syncingFeeds')}</p>
                </div>

                {/* Simulated Data Nodes */}
                {[...Array(6)].map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
                    transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
                    className="absolute w-1.5 h-1.5 rounded-full shadow-[0_0_8px_white]"
                    style={{ 
                      top: `${Math.random() * 80 + 10}%`, 
                      left: `${Math.random() * 80 + 10}%`,
                      backgroundColor: i % 3 === 0 ? '#ff2244' : '#00d4ff'
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="cyber-card p-6">
               <h3 className="font-display text-sm font-bold text-white uppercase tracking-widest mb-6 border-b border-white/5 pb-4">{t('admin.systemIntegrity')}</h3>
               <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-mono text-cyber-muted uppercase font-bold">{t('admin.apiPerformance')}</span>
                      <span className="text-[10px] font-mono text-cyber-accent">{t('admin.nominal')}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="w-[88%] h-full bg-cyber-accent" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-mono text-cyber-muted uppercase font-bold">{t('admin.neuralEngineSync')}</span>
                      <span className="text-[10px] font-mono text-cyber-accent">94%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="w-[94%] h-full bg-cyber-accent" />
                    </div>
                  </div>
                  <div className="pt-4 mt-6 border-t border-white/5">
                     <p className="text-[9px] font-mono text-cyber-muted uppercase tracking-widest mb-2 italic">{t('admin.liveIntegrityTicker')}</p>
                     <div className="bg-black/60 p-3 rounded-xl border border-white/5">
                        <motion.div 
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="font-mono text-[10px] text-green-500 flex items-center gap-2"
                        >
                           <Icon d={ICONS.security} size={10} />
                           <span>{t('admin.perimetersStable')}</span>
                        </motion.div>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Recent scans */}
          <div className="cyber-card overflow-hidden">
            <div className="p-4 border-b border-cyber-border">
              <h3 className="font-mono text-cyber-muted text-xs uppercase tracking-wider">{t('admin.recentPlatformScans')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cyber-border bg-cyber-surface/50">
                    {[t('admin.users').slice(0,-1), t('history.target'), t('history.riskScore'), t('history.riskLevelHeader'), t('history.date')].map((h) => (
                      <th key={h} className="font-mono text-cyber-muted text-xs uppercase tracking-wider p-4 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recentScans?.map((scan) => (
                    <tr key={scan._id} className="border-b border-cyber-border/30 hover:bg-cyber-surface/40">
                      <td className="p-4 font-mono text-xs text-cyber-muted">{scan.userId?.username || 'Unknown'}</td>
                      <td className="p-4 font-mono text-xs text-cyber-text max-w-xs truncate">{scan.target}</td>
                      <td className="p-4">
                        <span className="font-display text-lg font-bold" style={{ color: RISK_COLORS[scan.riskLevel] }}>{scan.threatScore}</span>
                      </td>
                      <td className="p-4"><RiskBadge level={scan.riskLevel} size="sm" /></td>
                      <td className="p-4 font-mono text-xs text-cyber-muted">{new Date(scan.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="cyber-card overflow-hidden">
          <div className="p-4 border-b border-cyber-border bg-cyber-surface/40 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-3 flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('admin.searchUsers')}
                className="cyber-input h-10 min-w-[220px] max-w-sm"
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="cyber-input h-10 w-40"
              >
                <option value="all">{t('admin.allRoles')}</option>
                  <option value="admin">{t('admin.table.role')} (Admin)</option>
                  <option value="user">{t('admin.table.role')} (User)</option>
              </select>
            </div>
            <p className="font-mono text-xs text-cyber-muted">
              {t('admin.showingUsers', { count: filteredUsers.length, total: users.length })}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyber-border bg-cyber-surface/50">
                  {[t('admin.table.username'), t('admin.table.email'), t('admin.table.role'), t('admin.table.scans'), t('admin.table.joined'), t('admin.table.actions')].map((h) => (
                    <th key={h} className="font-mono text-cyber-muted text-xs uppercase tracking-wider p-4 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} className={`border-b border-cyber-border/30 hover:bg-cyber-surface/40 group ${user.isBanned ? 'opacity-50 grayscale' : ''}`}>
                    <td className="p-4 font-mono text-xs text-cyber-text">
                      {user.username} {user.isBanned && <span className="text-red-500 font-bold">[{t('admin.actions.ban').toUpperCase()}]</span>}
                    </td>
                    <td className="p-4 font-mono text-xs text-cyber-muted">{user.email}</td>
                    <td className="p-4">
                      <span className={`font-mono text-xs border px-2 py-0.5 rounded uppercase ${
                        user.role === 'admin' ? 'border-cyber-red/40 text-cyber-red' : 'border-cyber-border/40 text-cyber-muted'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-cyber-muted">{user.totalScans || 0}</td>
                    <td className="p-4 font-mono text-xs text-cyber-muted">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => fetchUserReport(user._id)}
                          className="font-mono text-[10px] bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/30 px-2 py-1 hover:bg-cyber-accent hover:text-black transition-all uppercase"
                        >
                          {t('admin.actions.intelligence')}
                        </button>
                        <button
                          onClick={() => updateRole(user._id, user.role === 'admin' ? 'user' : 'admin')}
                          className="font-mono text-[10px] text-cyber-muted hover:text-white transition-colors uppercase"
                        >
                          {user.role === 'admin' ? t('admin.actions.demote') : t('admin.actions.promote')}
                        </button>
                        <button
                          onClick={() => toggleBanUser(user._id)}
                          className="font-mono text-[10px] text-orange-500/60 hover:text-orange-500 transition-colors uppercase"
                        >
                          {user.isBanned ? t('admin.actions.unban') : t('admin.actions.ban')}
                        </button>
                        <button
                          onClick={() => deleteUser(user._id)}
                          className="font-mono text-[10px] text-cyber-red/60 hover:text-cyber-red transition-colors uppercase"
                        >
                          {t('admin.actions.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center font-mono text-sm text-cyber-muted">
                      {t('admin.noUsersMatch')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {tab === 'report' && reportData && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 pb-20">
          {/* User Bio Header */}
          <div className="cyber-card p-6 border-l-4 border-l-cyber-accent bg-gradient-to-r from-cyber-accent/5 to-transparent flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[10px] bg-cyber-accent/20 text-cyber-accent px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">{t('admin.targetFound')}</span>
                <h3 className="font-display text-2xl font-bold text-white uppercase tracking-tighter">{reportData.user.username}</h3>
              </div>
              <p className="font-mono text-xs text-cyber-muted flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyber-accent" />
                UID: {reportData.user._id} | EMAIL: {reportData.user.email}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-3 mb-2">
                <button 
                  onClick={() => exportAdminProfilePdf(reportData, { username: 'ADMIN' })}
                  disabled={exporting}
                  className="font-mono text-[9px] bg-cyber-accent/10 hover:bg-cyber-accent text-cyber-accent hover:text-black border border-cyber-accent/30 px-3 py-1.5 rounded transition-all uppercase tracking-widest disabled:opacity-50"
                >
                  {exporting ? t('common.loading') : t('admin.downloadPdfIntel')}
                </button>
              </div>
              <p className="font-mono text-[10px] text-cyber-muted uppercase mb-1">{t('admin.securityHealthIndex')}</p>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                  <div className="h-full bg-cyber-accent shadow-[0_0_10px_#00d4ff]" style={{ width: '85%' }} />
                </div>
                <span className="font-display text-lg font-bold text-cyber-accent">85%</span>
              </div>
            </div>
          </div>

          {/* SENTINEL AUDIT SUMMARY CARDS (Phase 12) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t('admin.pulseHeartbeat'), value: t('admin.nominal'), icon: '📡', color: 'text-green-500' },
              { label: t('admin.intelMatches'), value: reportData.activities.length, icon: '🔍', color: 'text-cyber-accent' },
              { label: t('admin.neuralConfidence'), value: '98.2%', icon: '🧠', color: 'text-purple-500' },
              { label: t('admin.nodeStatus'), value: reportData.user.twoFactorEnabled ? t('admin.protected') : t('admin.vulnerable'), icon: '🛡️', color: reportData.user.twoFactorEnabled ? 'text-cyan-500' : 'text-red-500' },
            ].map((kpi, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="cyber-card p-4 border-white/5 flex flex-col items-center justify-center text-center haptic-press cursor-help"
              >
                <span className="text-xl mb-2">{kpi.icon}</span>
                <p className="font-mono text-[9px] text-cyber-muted uppercase tracking-widest">{kpi.label}</p>
                <p className={`font-display text-sm font-black mt-1 ${kpi.color}`}>{kpi.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="cyber-card p-6">
                <div className="flex items-center justify-between mb-6 border-b border-cyber-border pb-4">
                  <h4 className="font-mono text-xs text-white uppercase tracking-[0.3em]">{t('admin.operationalTimeline')}</h4>
                  <span className="text-[10px] text-cyber-muted uppercase">{t('admin.last100Cycles')}</span>
                </div>
                
                <div className="custom-scrollbar">
                  <ActivityTimeline activities={reportData.activities} />
                </div>
              </div>
            </div>

            {/* Sidebar Stats Column */}
            <div className="space-y-6">
              <div className="cyber-card p-6 bg-cyber-accent/5">
                <h4 className="font-mono text-[10px] text-cyber-accent uppercase tracking-widest mb-4">Critical Intel</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-[10px] text-cyber-muted uppercase">{t('admin.lastSeen')}</span>
                    <span className="text-[10px] text-white font-mono">{reportData.user.lastLoginAt ? new Date(reportData.user.lastLoginAt).toLocaleDateString() : t('common.none')}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-[10px] text-cyber-muted uppercase">{t('admin.verification')}</span>
                    <span className={`text-[10px] font-bold uppercase ${reportData.user.emailVerified ? 'text-green-500' : 'text-red-500'}`}>
                      {reportData.user.emailVerified ? t('admin.secure') : t('admin.unverified')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-[10px] text-cyber-muted uppercase">{t('history.totalScans')}</span>
                    <span className="text-[10px] text-white font-mono">{reportData.scans.length}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-[10px] text-cyber-muted uppercase">{t('home.modules.breachTitle')}</span>
                    <span className="text-[10px] text-white font-mono">{reportData.activities.filter(a => a.action?.startsWith('BREACH_CHECK')).length}</span>
                  </div>
                </div>
              </div>

              <div className="cyber-card p-6">
                <h4 className="font-mono text-[10px] text-white uppercase tracking-widest mb-4">{t('admin.auditTrail')}</h4>
                <div className="space-y-3">
                  {reportData.activities.filter(a => a.action === 'ADMIN_VIEW_REPORT').slice(0, 5).map((a, i) => (
                    <div key={i} className="text-[9px] bg-white/5 p-2 border-l border-white/20">
                      <p className="text-white mb-1 uppercase tracking-tighter text-red-500">{t('admin.accessRecord')}</p>
                      <p className="text-cyber-muted font-mono">{new Date(a.timestamp).toLocaleString()}</p>
                      <p className="text-[8px] text-white/40 mt-1 italic">{a.metadata?.details}</p>
                    </div>
                  ))}
                  {reportData.activities.filter(a => a.action === 'ADMIN_VIEW_REPORT').length === 0 && (
                    <p className="text-[10px] text-cyber-muted italic">{t('admin.noAccessLogs')}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ANALYTICS TAB */}
      {tab === 'analytics' && (
        <div className="space-y-6">
          {analyticsLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-cyber-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : analyticsOverview ? (
            <>
              {/* KPI Overview Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Users', value: analyticsOverview.totalUsers, color: '#00d4ff' },
                  { label: 'New Users (7d)', value: analyticsOverview.newUsersLast7Days, color: '#00ff88' },
                  { label: 'Total Scans', value: analyticsOverview.totalScans, color: '#a855f7' },
                  { label: '2FA Adoption', value: analyticsOverview.twoFAAdoptionRate, color: '#ff8c00' },
                ].map((k) => (
                  <div key={k.label} className="cyber-card p-5 text-center">
                    <p className="text-[10px] font-mono text-cyber-muted uppercase tracking-widest mb-2">{k.label}</p>
                    <p className="text-3xl font-display font-black" style={{ color: k.color }}>{k.value}</p>
                  </div>
                ))}
              </div>

              {/* Daily Activity Chart */}
              <div className="cyber-card p-6">
                <h4 className="font-mono text-[10px] text-white uppercase tracking-widest mb-6">Daily Activity (14 Days)</h4>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={dailyActivity} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fill: '#4a5568', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#4a5568', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: 'rgba(5,10,20,0.95)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', fontFamily: 'monospace', fontSize: '11px' }}
                      labelStyle={{ color: '#00d4ff', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                    />
                    <Bar dataKey="users" fill="#00d4ff" name="New Users" radius={[3,3,0,0]} />
                    <Bar dataKey="scans" fill="#a855f7" name="Scans" radius={[3,3,0,0]} />
                    <Bar dataKey="logins" fill="#00ff88" name="Logins" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Scan Type Pie */}
              {scanTypes.length > 0 && (
                <div className="cyber-card p-6">
                  <h4 className="font-mono text-[10px] text-white uppercase tracking-widest mb-6">Scan Type Distribution</h4>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={scanTypes} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={90} paddingAngle={3}>
                        {scanTypes.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: 'rgba(5,10,20,0.95)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', fontFamily: 'monospace', fontSize: '11px' }}
                      />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontFamily: 'monospace', fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <p className="font-mono text-[11px] text-cyber-muted uppercase tracking-widest">» Analytics feed offline — Connect Nexus Data Core</p>
            </div>
          )}
        </div>
      )}

      {/* ── TOOL 1: GLOBAL FIREWALL ─────────────────────────────────────────── */}
      {tab === 'firewall' && (
        <div className="space-y-6">
          <div className="cyber-card p-6 border-l-4 border-l-red-500">
            <h3 className="font-display text-sm font-bold text-white uppercase tracking-widest mb-1">{t('admin.globalFirewall')}</h3>
            <p className="text-[10px] font-mono text-cyber-muted mb-6">Block any IP address from accessing the platform. Changes take effect immediately.</p>
            <div className="flex gap-3 mb-6">
              <input
                type="text" value={newIP} onChange={e => setNewIP(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && blockIP()}
                placeholder="Enter IP address (e.g. 192.168.1.1)"
                className="cyber-input flex-1 h-10"
              />
              <button onClick={blockIP} disabled={firewallLoading || !newIP.trim()}
                className="font-mono text-xs bg-red-600/20 text-red-500 border border-red-500/50 px-4 py-2 hover:bg-red-600 hover:text-black transition-all uppercase tracking-widest disabled:opacity-40">
                Block IP
              </button>
            </div>
            {firewallLoading ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : blockedIPs.length === 0 ? (
              <p className="text-center font-mono text-xs text-cyber-muted py-8 uppercase">No IPs currently blocked. Firewall perimeter is open.</p>
            ) : (
              <div className="space-y-2">
                <p className="font-mono text-[10px] text-red-500 uppercase tracking-widest mb-3">{blockedIPs.length} IP(s) Blocked</p>
                {blockedIPs.map(ip => (
                  <div key={ip} className="flex items-center justify-between bg-red-900/10 border border-red-900/30 px-4 py-2.5 rounded">
                    <span className="font-mono text-sm text-red-300">{ip}</span>
                    <button onClick={() => unblockIP(ip)}
                      className="font-mono text-[10px] text-red-500/60 hover:text-red-400 uppercase tracking-widest transition-colors">
                      {t('admin.unblockIP')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TOOL 2: MAINTENANCE MODE ────────────────────────────────────────── */}
      {tab === 'maintenance' && (
        <div className="space-y-6">
          <div className="cyber-card p-6 border-l-4 border-l-orange-500">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display text-sm font-bold text-white uppercase tracking-widest mb-1">Maintenance Mode</h3>
                <p className="text-[10px] font-mono text-cyber-muted">Lock the platform for all users. Only admins can bypass.</p>
              </div>
              <div className={`px-4 py-2 rounded border font-mono text-sm font-bold uppercase tracking-widest ${maintenanceMode ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-green-500/20 border-green-500/50 text-green-400'}`}>
                {maintenanceMode ? '🔒 MAINTENANCE ON' : '✅ PLATFORM LIVE'}
              </div>
            </div>
            <div className="mb-6">
              <label className="block font-mono text-[10px] text-cyber-muted uppercase tracking-widest mb-2">Maintenance Message (shown to users)</label>
              <textarea
                value={maintenanceMsg} onChange={e => setMaintenanceMsg(e.target.value)} rows={3}
                className="cyber-input w-full resize-none p-3 text-sm"
                placeholder="e.g. CyberShield X is undergoing scheduled maintenance. Back shortly."
              />
            </div>
            <motion.button onClick={toggleMaintenance} disabled={maintenanceLoading}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className={`w-full py-3.5 font-bold tracking-[0.2em] uppercase text-sm border transition-all duration-300 disabled:opacity-50 ${
                maintenanceMode
                  ? 'bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500 hover:text-black'
                  : 'bg-orange-500/20 text-orange-400 border-orange-500/50 hover:bg-orange-500 hover:text-black'
              }`}>
              {maintenanceLoading ? 'Processing...' : maintenanceMode ? '✅ Bring Platform Back LIVE' : '🔒 Activate Maintenance Mode'}
            </motion.button>
          </div>
        </div>
      )}

      {/* ── TOOL 3: ADMIN AUDIT LOGS ────────────────────────────────────────── */}
      {tab === 'audit' && (
        <div className="cyber-card overflow-hidden">
          <div className="p-4 border-b border-cyber-border flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-white uppercase tracking-widest">{t('admin.auditTrail')}</h3>
            <button onClick={() => { setAuditLoading(true); api.get('/admin/audit-logs?limit=50').then(r => setAuditLogs(r.data.logs)).finally(() => setAuditLoading(false)); }}
              className="font-mono text-[10px] text-cyber-accent border border-cyber-accent/30 px-3 py-1 hover:bg-cyber-accent hover:text-black transition-all uppercase">
              Refresh
            </button>
          </div>
          {auditLoading ? (
            <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-cyber-accent border-t-transparent rounded-full animate-spin" /></div>
          ) : auditLogs.length === 0 ? (
            <p className="text-center font-mono text-xs text-cyber-muted py-16 uppercase">No admin actions logged yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cyber-border bg-cyber-surface/50">
                    {['Action', 'User', 'IP', 'Timestamp'].map(h => (
                      <th key={h} className="font-mono text-cyber-muted text-xs uppercase tracking-wider p-4 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log, i) => (
                    <tr key={i} className="border-b border-cyber-border/30 hover:bg-cyber-surface/40">
                      <td className="p-4">
                        <span className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${
                          log.action?.includes('BAN') ? 'bg-red-500/20 text-red-400' :
                          log.action?.includes('FIREWALL') ? 'bg-orange-500/20 text-orange-400' :
                          log.action?.includes('MAINTENANCE') ? 'bg-yellow-500/20 text-yellow-400' :
                          log.action?.includes('INJECT') ? 'bg-purple-500/20 text-purple-400' :
                          'bg-cyber-accent/20 text-cyber-accent'
                        }`}>{log.action}</span>
                      </td>
                      <td className="p-4 font-mono text-xs text-cyber-muted">{log.userId?.username || '—'}</td>
                      <td className="p-4 font-mono text-xs text-cyber-muted">{log.metadata?.ip || '—'}</td>
                      <td className="p-4 font-mono text-xs text-cyber-muted">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TOOL: FORENSIC TELEMETRY ─────────────────────────────────────────── */}
      {tab === 'telemetry' && (
        <div className="space-y-6">
          {telemetryLoading ? (
            <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-cyber-accent border-t-transparent rounded-full animate-spin" /></div>
          ) : telemetry ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="cyber-card p-6 border-l-4 border-l-cyber-accent">
                  <h4 className="font-mono text-[10px] text-cyber-muted uppercase tracking-widest mb-4">Core Integrity</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-white/5 pb-2">
                      <span className="text-[10px] text-cyber-muted uppercase">Health Score</span>
                      <span className="text-xl font-display font-black text-cyber-green">{telemetry.system.healthScore}%</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/5 pb-2">
                      <span className="text-[10px] text-cyber-muted uppercase">API Latency</span>
                      <span className="text-sm font-mono text-white">{telemetry.system.apiLatency}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/5 pb-2">
                      <span className="text-[10px] text-cyber-muted uppercase">System Uptime</span>
                      <span className="text-sm font-mono text-white">{telemetry.system.uptime}</span>
                    </div>
                  </div>
                </div>

                <div className="cyber-card p-6">
                  <h4 className="font-mono text-[10px] text-white uppercase tracking-widest mb-4">Node Distribution</h4>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Mobile', value: telemetry.nodes.mobileNodes },
                          { name: 'Desktop', value: telemetry.nodes.desktopNodes }
                        ]}
                        dataKey="value"
                        innerRadius={30}
                        outerRadius={50}
                        paddingAngle={5}
                      >
                        <Cell fill="#00d4ff" />
                        <Cell fill="#ff8c00" />
                      </Pie>
                      <Tooltip contentStyle={{ background: '#0a0f18', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-2">
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#00d4ff]" /><span className="text-[9px] font-mono text-cyber-muted uppercase">Mobile</span></div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#ff8c00]" /><span className="text-[9px] font-mono text-cyber-muted uppercase">Desktop</span></div>
                  </div>
                </div>

                <div className="cyber-card p-6">
                  <h4 className="font-mono text-[10px] text-white uppercase tracking-widest mb-4">Service Status</h4>
                  <div className="flex flex-col gap-2">
                    {['Database Cluster', 'Neural Engine', 'Intelligence API', 'Realtime Sockets'].map((s, i) => (
                      <div key={s} className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
                        <span className="text-[10px] font-mono text-white uppercase">{s}</span>
                        <span className="w-2 h-2 rounded-full bg-cyber-green shadow-[0_0_8px_#00ff88]" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="cyber-card p-6">
                <h4 className="font-mono text-[10px] text-white uppercase tracking-widest mb-6">Geographic Signal Distribution</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div className="space-y-3">
                    {telemetry.geography.map((g, i) => (
                      <div key={g._id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-cyber-muted">0{i+1}</span>
                          <span className="text-xs font-display font-bold text-white uppercase tracking-wider">{g._id || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-4 flex-1 max-w-[200px] ml-4">
                          <div className="h-1 bg-white/5 rounded-full flex-1 overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(g.count / telemetry.geography[0].count) * 100}%` }}
                              className="h-full bg-cyber-accent" 
                            />
                          </div>
                          <span className="text-[10px] font-mono text-cyber-accent w-8 text-right">{g.count}</span>
                        </div>
                      </div>
                    ))}
                    {telemetry.geography.length === 0 && <p className="text-center font-mono text-xs text-cyber-muted py-8 uppercase">No geographic signals recorded.</p>}
                  </div>
                  <div className="h-48 border border-white/5 rounded-2xl bg-black/40 flex flex-col items-center justify-center relative overflow-hidden">
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#00d4ff11_0%,_transparent_70%)]" 
                    />
                    <Icon d="M21 12a9 9 0 11-18 0 9 9 0 0114 0z" size={40} className="text-cyber-muted opacity-20 mb-4" />
                    <p className="font-mono text-[10px] text-cyber-muted uppercase tracking-[0.4em] z-10 font-bold">Signal Vector Visualization</p>
                    <p className="text-[9px] text-white/30 uppercase z-10 italic mt-2">Connecting global nodes...</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <p className="font-mono text-[11px] text-cyber-muted uppercase tracking-widest">» Forensic telemetry stream encrypted — Awaiting SOC Handshake</p>
            </div>
          )}
        </div>
      )}

      {/* ── TOOL 4: THREAT INJECTION ─────────────────────────────────────────── */}
      {tab === 'inject' && (
        <div className="space-y-6">
          <div className="cyber-card p-6 border-l-4 border-l-purple-500">
            <h3 className="font-display text-sm font-bold text-white uppercase tracking-widest mb-1">🧪 {t('admin.threatInjectionLab')}</h3>
            <p className="text-[10px] font-mono text-cyber-muted mb-6">Inject synthetic test threats into the scan feed to test detection engines and dashboards. These appear as real scans.</p>
            <form onSubmit={injectThreat} className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] text-cyber-muted uppercase tracking-widest mb-2">Target (URL / Domain / IP / Hash)</label>
                <input type="text" value={threatTarget} onChange={e => setThreatTarget(e.target.value)}
                  placeholder="e.g. http://phishing-example.com"
                  className="cyber-input w-full h-10" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] text-cyber-muted uppercase tracking-widest mb-2">Scan Type</label>
                  <select value={threatType} onChange={e => setThreatType(e.target.value)} className="cyber-input w-full h-10">
                    {['url', 'domain', 'ip', 'hash'].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-cyber-muted uppercase tracking-widest mb-2">Risk Level</label>
                  <select value={threatRisk} onChange={e => setThreatRisk(e.target.value)} className="cyber-input w-full h-10">
                    {['safe', 'low', 'medium', 'dangerous'].map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
              <motion.button type="submit" disabled={threatLoading || !threatTarget.trim()}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 bg-purple-600/20 text-purple-400 font-bold tracking-[0.2em] uppercase text-sm border border-purple-500/50 hover:bg-purple-600 hover:text-white transition-all duration-300 disabled:opacity-40">
                {threatLoading ? 'Injecting...' : '⚡ Inject Test Threat'}
              </motion.button>
            </form>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
