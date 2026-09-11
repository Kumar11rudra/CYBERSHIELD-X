import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, AlertTriangle, CheckCircle2, ShieldAlert, 
  Search, Filter, Clock, Eye, Check, RefreshCw, X, Radio, ArrowRight
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

export default function AlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);

  const socketRef = useRef(null);
  const isAnalystOrHigher = user && ['analyst', 'operator', 'admin'].includes((user.role || '').toLowerCase());

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/alerts');
      if (res.data?.success) {
        setAlerts(res.data.data?.alerts || []);
      }
    } catch (err) {
      toast.error('Failed to load SOC alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    // Section 17: Real-time Socket.IO listener with safe cleanup
    try {
      const socketUrl = window.location.origin;
      const socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5
      });
      socketRef.current = socket;

      socket.on('alert:new', (newAlert) => {
        toast((t) => (
          <span className="flex items-center gap-2 text-xs">
            <Bell className="w-4 h-4 text-cyan-400 animate-bounce" />
            <strong>New SOC Alert:</strong> {newAlert.title}
          </span>
        ));
        setAlerts(prev => [newAlert, ...prev]);
      });

      socket.on('alert:status', (updatedAlert) => {
        setAlerts(prev => prev.map(a => a.alertId === updatedAlert.alertId ? { ...a, ...updatedAlert } : a));
      });

      return () => {
        socket.disconnect();
      };
    } catch (err) {
      console.warn('Socket connection warning:', err);
    }
  }, []);

  const handleAcknowledge = async (alertId) => {
    if (!isAnalystOrHigher) return toast.error('Permission denied: Analyst role required');
    try {
      const res = await api.post(`/alerts/${alertId}/acknowledge`);
      if (res.data?.success) {
        toast.success(`Alert ${alertId} acknowledged`);
        fetchAlerts();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to acknowledge alert');
    }
  };

  const handleInvestigate = async (alertId) => {
    if (!isAnalystOrHigher) return toast.error('Permission denied: Analyst role required');
    try {
      const res = await api.post(`/alerts/${alertId}/investigate`);
      if (res.data?.success) {
        toast.success(`Alert ${alertId} marked as investigating`);
        fetchAlerts();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update alert');
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!selectedAlert) return;
    if (!isAnalystOrHigher) return toast.error('Permission denied: Analyst role required');
    try {
      const res = await api.post(`/alerts/${selectedAlert.alertId}/resolve`, { resolutionNotes: resolveNotes });
      if (res.data?.success) {
        toast.success(`Alert ${selectedAlert.alertId} resolved`);
        setShowResolveModal(false);
        setResolveNotes('');
        setSelectedAlert(null);
        fetchAlerts();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resolve alert');
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.title?.toLowerCase().includes(q) ||
        a.alertId?.toLowerCase().includes(q) ||
        a.source?.toLowerCase().includes(q) ||
        a.asset?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">LOW</span>;
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'NEW':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">NEW</span>;
      case 'ACKNOWLEDGED':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">ACKNOWLEDGED</span>;
      case 'INVESTIGATING':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">INVESTIGATING</span>;
      case 'RESOLVED':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">RESOLVED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-800 text-slate-300">{st}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
              <ShieldAlert className="w-7 h-7 text-rose-500" />
              SOC Alert Center
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                Live Feed
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Real-time security alerts from verified scanner findings, telemetry events, and system anomalies.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAlerts}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
              title="Refresh Alerts"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search alert title, source, asset..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {['ALL', 'NEW', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                    statusFilter === st ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* Alerts Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Severity</th>
                  <th className="px-6 py-3.5">Alert</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Source / Asset</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      Loading real-time alerts...
                    </td>
                  </tr>
                ) : filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      No alerts match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAlerts.map(a => (
                    <tr key={a.alertId || a._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        {getSeverityBadge(a.severity)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{a.title}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{a.alertId}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-300">
                        {a.category}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-200">{a.source}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{a.asset || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(a.status)}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-[11px]">
                        {new Date(a.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {a.status === 'NEW' && (
                            <button
                              onClick={() => handleAcknowledge(a.alertId)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 text-[11px] font-semibold"
                            >
                              Acknowledge
                            </button>
                          )}
                          {(a.status === 'NEW' || a.status === 'ACKNOWLEDGED') && (
                            <button
                              onClick={() => handleInvestigate(a.alertId)}
                              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 text-[11px] font-semibold"
                            >
                              Investigate
                            </button>
                          )}
                          {a.status !== 'RESOLVED' && (
                            <button
                              onClick={() => {
                                setSelectedAlert(a);
                                setShowResolveModal(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 text-[11px] font-semibold"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Resolve Alert */}
        {showResolveModal && selectedAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">Resolve Alert: {selectedAlert.alertId}</h3>
                <button onClick={() => setShowResolveModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleResolve} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 block mb-1">Resolution Notes *</label>
                  <textarea
                    rows={4}
                    required
                    value={resolveNotes}
                    onChange={(e) => setResolveNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                    placeholder="Document root cause, mitigation steps, or false-positive verification..."
                  />
                </div>
                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowResolveModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500"
                  >
                    Confirm Resolution
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
