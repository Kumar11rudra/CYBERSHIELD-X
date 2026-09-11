import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, CheckCircle2, AlertTriangle, XCircle, Clock, 
  RefreshCw, Wrench, X, Terminal, Cpu, Check, AlertOctagon, Info
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function HostCapabilityManagerModal({ isOpen, onClose, onToolSelect = null }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toolHealth, setToolHealth] = useState(null);
  const [groupedDeps, setGroupedDeps] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL | AVAILABLE | BLOCKED | OUTDATED | UNSUPPORTED
  const [verifyingTool, setVerifyingTool] = useState(null);

  const isOperatorOrAdmin = user && ['operator', 'admin'].includes((user.role || '').toLowerCase());

  const fetchStatus = async () => {
    try {
      setRefreshing(true);
      const [healthRes, depsRes] = await Promise.all([
        api.get('/terminal/tool-health'),
        api.get('/terminal/dependencies')
      ]);

      if (healthRes.data?.success) {
        setToolHealth(healthRes.data.data);
      }
      if (depsRes.data?.success) {
        setGroupedDeps(depsRes.data.data);
      }
    } catch (err) {
      toast.error('Failed to inspect host tool capabilities');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const handleRemediateProbe = async (toolId) => {
    if (!isOperatorOrAdmin) {
      toast.error('Privileged Action: Operator or Admin role required');
      return;
    }

    try {
      setVerifyingTool(toolId);
      toast.loading(`Probing executable capability for ${toolId}...`, { id: 'probe' });
      const res = await api.post(`/terminal/remediate/${toolId}`);
      if (res.data?.success) {
        toast.success(`Validation succeeded! ${toolId} is now verified working.`, { id: 'probe' });
        await fetchStatus();
      } else {
        toast.error(`Probe failed: ${res.data?.data?.error || 'Executable missing or returned error'}`, { id: 'probe' });
        await fetchStatus();
      }
    } catch (err) {
      toast.error(`Probe failed: ${err.response?.data?.error || err.message}`, { id: 'probe' });
    } finally {
      setVerifyingTool(null);
    }
  };

  if (!isOpen) return null;

  const tools = toolHealth?.tools || [];
  const filteredTools = tools.filter(t => {
    if (activeTab === 'ALL') return true;
    return t.status?.toUpperCase() === activeTab;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> AVAILABLE
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> BLOCKED
          </span>
        );
      case 'OUTDATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> OUTDATED
          </span>
        );
      case 'UNSUPPORTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <AlertOctagon className="w-3.5 h-3.5" /> UNSUPPORTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Info className="w-3.5 h-3.5" /> {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Host Capability & Dependency Manager
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  {toolHealth?.os?.platform || 'HOST'} / {toolHealth?.os?.arch || 'ARCH'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Authoritative binary version detection, platform compatibility, and safe operator remediation.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchStatus}
              disabled={refreshing}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
              title="Refresh Capabilities"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950/40 border-b border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <div className="text-xs text-slate-400">Monitored Binaries</div>
            <div className="text-xl font-bold text-white mt-0.5">{toolHealth?.totalAudited || 0}</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40">
            <div className="text-xs text-emerald-400">Available & Verified</div>
            <div className="text-xl font-bold text-emerald-300 mt-0.5">{toolHealth?.availableCount || 0}</div>
          </div>
          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40">
            <div className="text-xs text-rose-400">Blocked Dependencies</div>
            <div className="text-xl font-bold text-rose-300 mt-0.5">{toolHealth?.blockedCount || 0}</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40">
            <div className="text-xs text-amber-400">Outdated / Version Issues</div>
            <div className="text-xl font-bold text-amber-300 mt-0.5">{toolHealth?.outdatedCount || 0}</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-800 bg-slate-900/50 overflow-x-auto">
          {['ALL', 'AVAILABLE', 'BLOCKED', 'OUTDATED', 'UNSUPPORTED'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tools List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mb-3" />
              <p className="text-sm font-medium">Inspecting host binaries and versions...</p>
            </div>
          ) : filteredTools.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-sm">
              No host capabilities found matching status: <span className="text-cyan-400">{activeTab}</span>
            </div>
          ) : (
            filteredTools.map(item => (
              <div 
                key={item.binary}
                className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-slate-600 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-base font-bold text-white">{item.binary}</span>
                    {getStatusBadge(item.status)}
                    <span className="text-xs font-mono text-slate-400">
                      Ver: <strong className="text-slate-200">{item.detectedVersion || 'Not Detected'}</strong> (Min: {item.minSupportedVersion || 'N/A'})
                    </span>
                    {item.path && (
                      <span className="text-xs font-mono text-slate-500 truncate max-w-xs" title={item.path}>
                        {item.path}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300">
                    {item.remediation?.explanation || 'Managed host tool capability'}
                  </p>
                  {item.remediation?.manualInstallGuide && (
                    <div className="text-xs text-slate-400 font-mono bg-slate-950/60 p-2 rounded border border-slate-800 mt-2">
                      <span className="text-cyan-400 font-semibold">Recommended Install: </span>
                      {item.remediation.manualInstallGuide}
                    </div>
                  )}
                </div>

                {/* Operator Actions */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  {item.status === 'AVAILABLE' ? (
                    <button
                      onClick={() => onToolSelect && onToolSelect(item.binary)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors flex items-center gap-1.5"
                    >
                      <Terminal className="w-3.5 h-3.5" /> Launch in Terminal
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRemediateProbe(item.binary)}
                      disabled={verifyingTool === item.binary}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      title={isOperatorOrAdmin ? 'Run safe probe verification' : 'Operator or Admin role required'}
                    >
                      {verifyingTool === item.binary ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Wrench className="w-3.5 h-3.5" />
                      )}
                      Verify Safe Probe
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
          <span>Zero simulation rule: Binary capability unlocks only after real host probe verification.</span>
          <span>Role: <strong className="text-cyan-400 uppercase">{user?.role || 'viewer'}</strong></span>
        </div>
      </motion.div>
    </div>
  );
}
