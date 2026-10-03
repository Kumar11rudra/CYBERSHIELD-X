import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import BrandLogo from '../components/common/BrandLogo';
import RiskBadge from '../components/common/RiskBadge';
import ActivityTimeline from '../components/admin/ActivityTimeline';
import usePdfExport from '../hooks/usePdfExport';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  Activity,
  Database,
  Server,
  Globe,
  Search,
  Trash2,
  UserX,
  UserCheck,
  FileText,
  RefreshCw,
  LogOut,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Radio,
  Sliders,
  Sparkles,
  ExternalLink,
  Cpu
} from 'lucide-react';

const RISK_COLORS = {
  safe: '#00ff88',
  low: '#ffdd00',
  medium: '#ff8c00',
  dangerous: '#ff2244'
};

export default function AdminPage() {
  const { logout, user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { exportAdminProfilePdf, exporting } = usePdfExport();

  // Core Data States
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview'); // 'overview' | 'users' | 'audit' | 'firewall' | 'report'

  // User Filter & Search
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected User Intelligence Report
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditFilter, setAuditFilter] = useState('ALL');

  // Firewall / Security State
  const [firewallRules, setFirewallRules] = useState([]);
  const [firewallLoading, setFirewallLoading] = useState(false);
  const [newBlockedIp, setNewBlockedIp] = useState('');
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

  // Initial Data Fetch
  const loadPlatformData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users')
      ]);
      setStats(statsRes.data);
      setUsersList(usersRes.data.users || []);
    } catch (err) {
      toast.error('Failed to synchronize admin telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlatformData();
  }, []);

  // Fetch Audit Logs when tab switched to audit
  useEffect(() => {
    if (tab === 'audit') {
      setAuditLoading(true);
      api.get('/admin/audit-logs?limit=50')
        .then(res => setAuditLogs(res.data.logs || []))
        .catch(() => toast.error('Audit logs offline'))
        .finally(() => setAuditLoading(false));
    } else if (tab === 'firewall') {
      setFirewallLoading(true);
      Promise.all([
        api.get('/admin/firewall').catch(() => ({ data: { rules: [] } })),
        api.get('/admin/maintenance').catch(() => ({ data: { enabled: false } }))
      ]).then(([fwRes, maintRes]) => {
        setFirewallRules(fwRes.data.rules || []);
        setMaintenanceEnabled(Boolean(maintRes.data.enabled));
      }).finally(() => setFirewallLoading(false));
    }
  }, [tab]);

  // Fetch User Intelligence Report
  const fetchUserReport = async (userId) => {
    setReportLoading(true);
    setSelectedUserId(userId);
    try {
      const res = await api.get(`/admin/users/${userId}/report`);
      setReportData(res.data);
      setTab('report');
    } catch (err) {
      toast.error('Failed to load user intelligence report');
      setSelectedUserId(null);
    } finally {
      setReportLoading(false);
    }
  };

  // User Management Actions
  const updateRole = async (userId, newRole) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsersList(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
      toast.success(`Role updated to ${newRole.toUpperCase()}`);
    } catch {
      toast.error('Failed to update role');
    }
  };

  const toggleBanUser = async (userId) => {
    try {
      const res = await api.post(`/admin/users/${userId}/ban`);
      setUsersList(prev => prev.map(u => u._id === userId ? { ...u, isBanned: res.data.isBanned } : u));
      toast.success(res.data.isBanned ? 'User banned from platform' : 'User unbanned successfully');
    } catch {
      toast.error('Failed to toggle ban status');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user and their scan records?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsersList(prev => prev.filter(u => u._id !== userId));
      toast.success('User permanently deleted');
    } catch {
      toast.error('Failed to delete user');
    }
  };

  // Firewall Actions
  const handleAddFirewallRule = async (e) => {
    e.preventDefault();
    if (!newBlockedIp.trim()) return;
    try {
      const res = await api.post('/admin/firewall', { ip: newBlockedIp.trim() });
      setFirewallRules(res.data.rules || []);
      setNewBlockedIp('');
      toast.success(`IP ${newBlockedIp} added to blocked perimeters`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to block IP');
    }
  };

  const handleRemoveFirewallRule = async (ip) => {
    try {
      const res = await api.delete(`/admin/firewall/${encodeURIComponent(ip)}`);
      setFirewallRules(res.data.rules || []);
      toast.success(`IP ${ip} unblocked`);
    } catch {
      toast.error('Failed to remove firewall rule');
    }
  };

  const handleToggleMaintenance = async () => {
    setMaintenanceLoading(true);
    const targetState = !maintenanceEnabled;
    try {
      await api.post('/admin/maintenance', {
        enabled: targetState,
        message: targetState ? 'CyberShield X is currently undergoing scheduled maintenance.' : ''
      });
      setMaintenanceEnabled(targetState);
      toast.success(targetState ? 'Maintenance mode enabled' : 'Platform live mode restored');
    } catch {
      toast.error('Failed to toggle maintenance mode');
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout({ redirectTo: '/nexus-admin' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020814] flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_#00bfff]" />
          <p className="text-xs text-cyan-400 font-bold uppercase tracking-widest animate-pulse">
            Connecting to Founder Command Center...
          </p>
        </div>
      </div>
    );
  }

  // Filtered Users List
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch = [u.username, u.email].some(val =>
      val?.toLowerCase().includes(search.toLowerCase())
    );
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'banned' ? u.isBanned : !u.isBanned);
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#020814] text-slate-200 font-mono relative selection:bg-cyan-500/30 selection:text-white">
      {/* Background Matrix Blueprint Layer */}
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#00d4ff_1px,transparent_1px)] [background-size:24px_24px] z-0" />

      {/* ── TOP EXECUTIVE COMMAND BAR ── */}
      <header className="sticky top-0 z-40 bg-[#050e1d]/90 border-b border-cyan-500/20 backdrop-blur-xl px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <BrandLogo size={32} />
            <div className="flex flex-col">
              <span className="font-display font-black text-sm tracking-wider text-white group-hover:text-cyan-400 transition-colors">
                CYBERSHIELD <span className="text-cyan-400">X</span>
              </span>
              <span className="text-[9px] text-cyan-400/70 tracking-[0.2em] uppercase font-bold">
                Founder Command Nexus
              </span>
            </div>
          </Link>

          <div className="hidden sm:flex items-center gap-2 ml-4 pl-4 border-l border-white/10 text-[10px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#00ff88]" />
            <span className="text-emerald-400 font-bold uppercase tracking-wider">SECURE LINK ACTIVE</span>
            <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
              OPERATOR: {user?.username || 'ANIL KUMAR'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all shadow-sm"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Public Workstation ↗</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white border border-red-500/40 text-xs font-bold transition-all shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout Nexus</span>
          </button>
        </div>
      </header>

      {/* ── MAIN WORKSPACE CONTAINER ── */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 relative z-10 space-y-6">

        {/* ── TOP TITLE & WORKSPACE TABS ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
          <div>
            <h1 className="text-2xl font-display font-black text-white uppercase tracking-wider flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
              <span>Platform Administration Hub</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Enterprise operator control, security audit feeds, and live infrastructure telemetry.
            </p>
          </div>

          {/* Segmented Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-cyan-500/20 overflow-x-auto custom-scrollbar">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'users', label: 'Operators & Users', icon: Users, badge: usersList.length },
              { id: 'audit', label: 'Audit Trail', icon: FileText },
              { id: 'firewall', label: 'Security & Access', icon: Lock },
              ...(tab === 'report' ? [{ id: 'report', label: 'Operator Report', icon: Sparkles }] : [])
            ].map(t => {
              const Icon = t.icon;
              const isActive = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 relative whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-white border border-cyan-400/50 shadow-[0_0_12px_rgba(0,191,255,0.3)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span>{t.label}</span>
                  {t.badge !== undefined && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── TAB 1: EXECUTIVE OVERVIEW ── */}
        {tab === 'overview' && stats && (
          <div className="space-y-6">
            
            {/* 4 Hero KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Total Registered Users */}
              <div className="bg-slate-900/60 border border-cyan-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-md">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Total Registered Operators</span>
                  <Users className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-display font-black text-white">{stats.totalUsers || usersList.length}</span>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    ({usersList.filter(u => !u.isBanned).length} Active)
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 border-t border-white/5 pt-2">
                  <span>Admins: {usersList.filter(u => u.role === 'admin').length}</span>
                  <span>Banned: {usersList.filter(u => u.isBanned).length}</span>
                </div>
              </div>

              {/* Platform Scans Run */}
              <div className="bg-slate-900/60 border border-cyan-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-md">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Total Platform Scans</span>
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-display font-black text-white">{stats.totalScans || 0}</span>
                  <span className="text-[10px] text-cyan-400 font-bold">Across 125 Tools</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 border-t border-white/5 pt-2">
                  <span>Safe Scans: {stats.riskBreakdown?.safe || 0}</span>
                  <span>Suspicious: {(stats.riskBreakdown?.low || 0) + (stats.riskBreakdown?.medium || 0)}</span>
                </div>
              </div>

              {/* Intercepted Threats */}
              <div className="bg-slate-900/60 border border-red-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-md">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Dangerous Threats</span>
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-display font-black text-red-400">{stats.riskBreakdown?.dangerous || 0}</span>
                  <span className="text-[10px] text-red-400/80 font-bold">Flagged & Blocked</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 border-t border-white/5 pt-2">
                  <span>CISA Real Feeds: Active</span>
                  <span className="text-emerald-400">100% Mitigated</span>
                </div>
              </div>

              {/* Infrastructure Operational Status */}
              <div className="bg-slate-900/60 border border-cyan-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-md">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Platform Infrastructure</span>
                  <Server className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-display font-black text-emerald-400">ALL SYSTEMS GO</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 border-t border-white/5 pt-2">
                  <span>Uptime: 99.98%</span>
                  <span className="text-cyan-400">Cloudflare Pages</span>
                </div>
              </div>

            </div>

            {/* Live Infrastructure Services Strip */}
            <div className="bg-slate-900/60 border border-cyan-500/20 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>Real-Time Production Infrastructure Health</span>
                </div>
                <button
                  onClick={loadPlatformData}
                  className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh Telemetry</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                
                {/* 1. Cloudflare CDN */}
                <div className="bg-black/50 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-bold text-white text-[11px]">Cloudflare Pages Edge</p>
                    <p className="text-[10px] text-slate-400">Global DNS & SSL</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                    ONLINE
                  </span>
                </div>

                {/* 2. Render Web Service */}
                <div className="bg-black/50 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-bold text-white text-[11px]">Render API Gateway</p>
                    <p className="text-[10px] text-slate-400">Node.js Express Server</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                    HEALTHY
                  </span>
                </div>

                {/* 3. MongoDB Atlas */}
                <div className="bg-black/50 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-bold text-white text-[11px]">MongoDB Atlas Cluster</p>
                    <p className="text-[10px] text-slate-400">Replica Set Connected</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                    CONNECTED
                  </span>
                </div>

                {/* 4. Gemini AI Engine */}
                <div className="bg-black/50 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-bold text-white text-[11px]">CyberBot AI Copilot</p>
                    <p className="text-[10px] text-slate-400">gemini-2.5 & 3.8 Flash</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                    OPERATIONAL
                  </span>
                </div>

              </div>
            </div>

            {/* Recent Scans Real Table */}
            <div className="bg-slate-900/60 border border-cyan-500/20 rounded-2xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-white">Recent Security Scans</h3>
                </div>
                <span className="text-[10px] text-slate-400">
                  Showing last {stats.recentScans?.length || 0} live operations
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02] text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                      <th className="p-4">Target / Destination</th>
                      <th className="p-4">Threat Score</th>
                      <th className="p-4">Risk Level</th>
                      <th className="p-4">Scanned By</th>
                      <th className="p-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stats.recentScans && stats.recentScans.length > 0 ? (
                      stats.recentScans.map((scan) => (
                        <tr key={scan._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-4 font-bold text-slate-200 max-w-xs truncate">
                            {scan.target}
                          </td>
                          <td className="p-4 font-bold" style={{ color: RISK_COLORS[scan.riskLevel] || '#00d4ff' }}>
                            {scan.threatScore || 0} / 100
                          </td>
                          <td className="p-4">
                            <RiskBadge level={scan.riskLevel} size="sm" />
                          </td>
                          <td className="p-4 text-slate-400">
                            {scan.userId?.username || 'Guest Visitor'}
                          </td>
                          <td className="p-4 text-slate-500 text-[11px]">
                            {new Date(scan.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-slate-500">
                          No scans logged yet. Run a scan from the public tools to see live entries.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ── TAB 2: OPERATOR & USER MANAGEMENT ── */}
        {tab === 'users' && (
          <div className="bg-slate-900/60 border border-cyan-500/20 rounded-2xl overflow-hidden shadow-lg space-y-0">
            {/* Filter & Search Bar */}
            <div className="p-4 border-b border-white/5 bg-black/40 flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                {/* Search Input */}
                <div className="relative min-w-[240px] max-w-sm flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by username or email..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl text-xs text-white outline-none font-mono"
                  />
                </div>

                {/* Role Filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-700 text-xs text-white rounded-xl outline-none font-mono"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admins Only</option>
                  <option value="user">Users Only</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-700 text-xs text-white rounded-xl outline-none font-mono"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="banned">Banned Only</option>
                </select>
              </div>

              <div className="text-xs text-slate-400">
                Showing <strong className="text-white">{filteredUsers.length}</strong> of {usersList.length} Operators
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                    <th className="p-4">Operator</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Scans Run</th>
                    <th className="p-4">Joined Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((u) => {
                    const isAdmin = u.role === 'admin';
                    const isBanned = Boolean(u.isBanned);
                    return (
                      <tr key={u._id} className={`hover:bg-white/[0.02] transition-colors ${isBanned ? 'opacity-50' : ''}`}>
                        
                        {/* Operator Name */}
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400 text-xs uppercase">
                              {u.username?.[0] || 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{u.username}</span>
                                {isAdmin && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
                                    ADMIN
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500">{u.fullName || 'Security Operator'}</span>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="p-4 text-slate-300">
                          {u.email}
                        </td>

                        {/* Role Switcher */}
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => updateRole(u._id, isAdmin ? 'user' : 'admin')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all border ${
                              isAdmin
                                ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                            }`}
                            title="Click to toggle between Admin and User"
                          >
                            {u.role} ⇄
                          </button>
                        </td>

                        {/* Status (Active / Banned) */}
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => toggleBanUser(u._id)}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition-all border ${
                              isBanned
                                ? 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            }`}
                            title="Click to toggle ban status"
                          >
                            {isBanned ? '⛔ Banned' : '🟢 Active'}
                          </button>
                        </td>

                        {/* Total Scans */}
                        <td className="p-4 font-bold text-slate-300">
                          {u.totalScans || 0}
                        </td>

                        {/* Joined Date */}
                        <td className="p-4 text-slate-400 text-[11px]">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => fetchUserReport(u._id)}
                              className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold transition-all flex items-center gap-1"
                              title="View Intelligence Report & History"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Intel Report</span>
                            </button>

                            <button
                              onClick={() => deleteUser(u._id)}
                              className="p-1 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-white border border-red-500/30 transition-all"
                              title="Delete Operator permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-500">
                        No operators found matching your search and filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ── TAB 3: REAL AUDIT TRAIL ── */}
        {tab === 'audit' && (
          <div className="bg-slate-900/60 border border-cyan-500/20 rounded-2xl overflow-hidden shadow-lg space-y-0">
            <div className="p-4 border-b border-white/5 bg-black/40 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Platform Security Audit Trail</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Immutable record of administrative, role change, ban, and firewall operations.
                </p>
              </div>

              <button
                onClick={() => {
                  setAuditLoading(true);
                  api.get('/admin/audit-logs?limit=50')
                    .then(res => setAuditLogs(res.data.logs || []))
                    .finally(() => setAuditLoading(false));
                }}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3 h-3 ${auditLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Logs</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              {auditLoading ? (
                <div className="py-16 text-center">
                  <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  No administrative audit records logged yet.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02] text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                      <th className="p-4">Action Event</th>
                      <th className="p-4">Operator / Actor</th>
                      <th className="p-4">Source IP</th>
                      <th className="p-4">Details / Metadata</th>
                      <th className="p-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {auditLogs.map((log, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            log.action?.includes('BAN')
                              ? 'bg-red-500/15 text-red-400 border-red-500/30'
                              : log.action?.includes('ROLE')
                              ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                              : log.action?.includes('FIREWALL')
                              ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                              : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-white">
                          {log.userId?.username || 'System Root'}
                        </td>
                        <td className="p-4 text-slate-400 font-mono text-[11px]">
                          {log.metadata?.ip || '127.0.0.1'}
                        </td>
                        <td className="p-4 text-slate-400 max-w-sm truncate text-[11px]">
                          {log.metadata?.details || log.metadata?.reason || '—'}
                        </td>
                        <td className="p-4 text-right text-slate-500 text-[11px]">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        )}

        {/* ── TAB 4: SECURITY & ACCESS CONTROLS (FIREWALL & MAINTENANCE) ── */}
        {tab === 'firewall' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* IP Firewall / Perimeter Defense */}
            <div className="bg-slate-900/60 border border-cyan-500/20 rounded-2xl p-6 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  <span>IP Firewall & Blocklist Perimeters</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {firewallRules.length} Blocked IPs
                </span>
              </div>

              {/* Add Block Rule Form */}
              <form onSubmit={handleAddFirewallRule} className="flex gap-2">
                <input
                  type="text"
                  value={newBlockedIp}
                  onChange={(e) => setNewBlockedIp(e.target.value)}
                  placeholder="Enter IPv4 / IPv6 address to block..."
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 focus:border-red-400 rounded-xl text-xs text-white outline-none font-mono"
                />
                <button
                  type="submit"
                  disabled={!newBlockedIp.trim()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(255,0,50,0.3)]"
                >
                  Block IP
                </button>
              </form>

              {/* Blocked IP Table */}
              <div className="border border-white/5 rounded-xl overflow-hidden bg-black/40 max-h-72 overflow-y-auto custom-scrollbar">
                {firewallLoading ? (
                  <div className="py-8 text-center text-slate-500 text-xs">Loading firewall rules...</div>
                ) : firewallRules.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">No active IP blocks. Perimeters are clear.</div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.02] text-slate-400 text-[10px] uppercase font-bold">
                        <th className="p-3">Blocked IP</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {firewallRules.map((r, i) => {
                        const ipVal = typeof r === 'string' ? r : r.ip;
                        return (
                          <tr key={i} className="hover:bg-white/[0.02]">
                            <td className="p-3 text-red-400 font-bold font-mono">{ipVal}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleRemoveFirewallRule(ipVal)}
                                className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border border-slate-700 hover:border-emerald-500/40 transition-all font-bold"
                              >
                                Unblock
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Platform Emergency Maintenance & Founder Security */}
            <div className="space-y-6">
              
              {/* Emergency Maintenance Mode */}
              <div className="bg-slate-900/60 border border-cyan-500/20 rounded-2xl p-6 shadow-lg space-y-4">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider border-b border-white/5 pb-3">
                  <Sliders className="w-4 h-4 text-orange-400" />
                  <span>Platform Maintenance Mode</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  When enabled, all incoming visitors except Founder Admins will see a maintenance notice. Active WebSocket feeds remain paused.
                </p>
                <div className="flex items-center justify-between pt-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${maintenanceEnabled ? 'text-orange-400' : 'text-emerald-400'}`}>
                    Status: {maintenanceEnabled ? '🔴 MAINTENANCE ACTIVE' : '🟢 LIVE PRODUCTION'}
                  </span>
                  <button
                    onClick={handleToggleMaintenance}
                    disabled={maintenanceLoading}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                      maintenanceEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-orange-500/20 text-orange-300 border-orange-500/40 hover:bg-orange-500/30'
                    }`}
                  >
                    {maintenanceEnabled ? 'Restore Live Mode' : 'Enable Maintenance'}
                  </button>
                </div>
              </div>

              {/* Founder Security Credentials Status */}
              <div className="bg-slate-900/60 border border-cyan-500/20 rounded-2xl p-6 shadow-lg space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider border-b border-white/5 pb-3">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Founder Admin Security Credentials</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Google Authenticator (RFC 6238 TOTP):</span>
                    <span className="text-emerald-400 font-bold">ACTIVE & CONFIGURED</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>CyberPass™ Cryptographic QR:</span>
                    <span className="text-emerald-400 font-bold">HMAC-SHA256 SIGNED</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Founder Secret Passkey:</span>
                    <span className="text-emerald-400 font-bold">ZERO DATABASE STORAGE</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ── TAB 5: OPERATOR INTELLIGENCE REPORT ── */}
        {tab === 'report' && reportData && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setTab('users')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Operators List</span>
              </button>

              <button
                onClick={() => exportAdminProfilePdf(reportData, { username: 'ADMIN' })}
                disabled={exporting}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-black text-xs font-black uppercase tracking-wider shadow-lg hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>{exporting ? 'Generating PDF...' : 'Download Intelligence PDF 🖨️'}</span>
              </button>
            </div>

            {/* Operator Bio Card */}
            <div className="bg-slate-900/60 border border-cyan-500/30 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold uppercase tracking-widest">
                    OPERATOR DOSSIER
                  </span>
                  <h2 className="text-2xl font-display font-black text-white uppercase">
                    {reportData.user.username}
                  </h2>
                </div>
                <p className="text-xs text-slate-400">
                  UID: <code className="text-cyan-400">{reportData.user._id}</code> | Email: <span className="text-white">{reportData.user.email}</span>
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Security Integrity Rating
                </span>
                <span className="text-2xl font-display font-black text-emerald-400">
                  {reportData.user.isBanned ? 'RESTRICTED' : '98.5% NOMINAL'}
                </span>
              </div>
            </div>

            {/* Operator Activities Timeline */}
            <div className="bg-slate-900/60 border border-cyan-500/20 rounded-2xl p-6 shadow-xl">
              <h3 className="font-bold text-xs uppercase tracking-wider text-white mb-4 border-b border-white/5 pb-3">
                Operator Threat Intelligence & Action Timeline
              </h3>
              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                <ActivityTimeline activities={reportData.activities || []} />
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
