import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  FileText,
  History,
  Archive,
  Lock,
  Unlock,
  Key,
  Flame,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Plus,
  Play,
  RotateCcw,
  Eye,
  Sliders,
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight,
  Database,
  Cpu,
  Layers,
  FileCheck,
  Clock,
  XCircle,
  HelpCircle,
  FileCode,
  Zap,
  Info
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function GovernanceCenterPage() {
  const { user } = useAuth();
  const isAdmin = (user?.role || '').toUpperCase() === 'ADMIN';
  const isAnalystOrAbove = ['ANALYST', 'OPERATOR', 'ADMIN'].includes((user?.role || '').toUpperCase());

  const [activeTab, setActiveTab] = useState('posture'); // posture, policies, revisions, retention, breakglass, integrations, copilot
  const [loading, setLoading] = useState(false);

  // 1. Posture & Gaps State
  const [posture, setPosture] = useState(null);
  const [gaps, setGaps] = useState([]);

  // 2. Policies State
  const [policies, setPolicies] = useState([]);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [policyFilter, setPolicyFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // 3. Revisions State
  const [revisions, setRevisions] = useState([]);
  const [selectedRevision, setSelectedRevision] = useState(null);

  // 4. Retention & Legal Holds State
  const [retentionPolicies, setRetentionPolicies] = useState([]);
  const [selectedEntityType, setSelectedEntityType] = useState('audit_events');
  const [dryRunResult, setDryRunResult] = useState(null);
  const [dryRunning, setDryRunning] = useState(false);
  const [executingRetention, setExecutingRetention] = useState(false);

  // 5. Break-Glass State
  const [breakGlassSessions, setBreakGlassSessions] = useState([]);
  const [bgReason, setBgReason] = useState('');
  const [bgDuration, setBgDuration] = useState(30);
  const [requestingBg, setRequestingBg] = useState(false);

  // 6. Integration Governance State
  const [integrations, setIntegrations] = useState([]);

  // 7. AI Copilot State
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState(null);

  // Data Fetching
  const fetchPosture = useCallback(async () => {
    try {
      const res = await api.get('/governance/posture');
      if (res.data?.success) {
        setPosture(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load governance posture', err);
    }
  }, []);

  const fetchGaps = useCallback(async () => {
    try {
      const res = await api.get('/governance/gaps');
      if (res.data?.success) {
        setGaps(res.data.data.gaps || []);
      }
    } catch (err) {
      console.error('Failed to load governance gaps', err);
    }
  }, []);

  const fetchPolicies = useCallback(async () => {
    try {
      const res = await api.get('/governance/policies');
      if (res.data?.success) {
        setPolicies(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load policies', err);
    }
  }, []);

  const fetchRetention = useCallback(async () => {
    try {
      const res = await api.get('/governance/retention');
      if (res.data?.success) {
        setRetentionPolicies(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load retention policies', err);
    }
  }, []);

  const fetchBreakGlass = useCallback(async () => {
    try {
      const res = await api.get('/governance/breakglass');
      if (res.data?.success) {
        setBreakGlassSessions(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load break glass sessions', err);
    }
  }, []);

  const fetchIntegrations = useCallback(async () => {
    try {
      const res = await api.get('/governance/integrations');
      if (res.data?.success) {
        setIntegrations(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load integrations', err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchPosture(),
      fetchGaps(),
      fetchPolicies(),
      fetchRetention(),
      fetchBreakGlass(),
      fetchIntegrations()
    ]);
    setLoading(false);
  }, [fetchPosture, fetchGaps, fetchPolicies, fetchRetention, fetchBreakGlass, fetchIntegrations]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Policy Revision fetch
  const handleSelectPolicy = async (policy) => {
    setSelectedPolicy(policy);
    try {
      const res = await api.get(`/governance/policies/${policy.policyId}/revisions`);
      if (res.data?.success) {
        setRevisions(res.data.data || []);
        if (res.data.data?.length > 0) {
          setSelectedRevision(res.data.data[0]);
        }
      }
    } catch (err) {
      toast.error('Failed to load revisions');
    }
  };

  // Seed Canonical Policies
  const handleSeedCanonical = async () => {
    try {
      const res = await api.post('/governance/policies/seed-canonical');
      if (res.data?.success) {
        toast.success('Canonical governance policies seeded successfully');
        refreshAll();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to seed canonical policies');
    }
  };

  // Lifecycle transitions
  const handleSubmitReview = async (policyId) => {
    try {
      const res = await api.post(`/governance/policies/${policyId}/review`);
      if (res.data?.success) {
        toast.success('Policy submitted for review');
        fetchPolicies();
        if (selectedPolicy?.policyId === policyId) setSelectedPolicy(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Review submission failed');
    }
  };

  const handleApprovePolicy = async (policyId) => {
    if (!isAdmin) {
      toast.error('Only administrators can approve governance policies');
      return;
    }
    try {
      const res = await api.post(`/governance/policies/${policyId}/approve`);
      if (res.data?.success) {
        toast.success('Policy revision approved and cryptographically signed');
        fetchPolicies();
        if (selectedPolicy?.policyId === policyId) setSelectedPolicy(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Policy approval failed');
    }
  };

  const handleActivatePolicy = async (policyId) => {
    if (!isAdmin) {
      toast.error('Only administrators can activate governance policies');
      return;
    }
    try {
      const res = await api.post(`/governance/policies/${policyId}/activate`);
      if (res.data?.success) {
        toast.success('Policy activated and enforced across tenant');
        fetchPolicies();
        fetchPosture();
        if (selectedPolicy?.policyId === policyId) setSelectedPolicy(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Policy activation failed');
    }
  };

  const handleSuspendPolicy = async (policyId) => {
    if (!isAdmin) {
      toast.error('Only administrators can suspend governance policies');
      return;
    }
    try {
      const res = await api.post(`/governance/policies/${policyId}/suspend`, {
        reason: 'Administrative temporary suspension'
      });
      if (res.data?.success) {
        toast.success('Policy suspended');
        fetchPolicies();
        fetchPosture();
        if (selectedPolicy?.policyId === policyId) setSelectedPolicy(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Policy suspension failed');
    }
  };

  // Retention dry-run & execute
  const handleDryRun = async () => {
    setDryRunning(true);
    try {
      const res = await api.post('/governance/retention/dry-run', { entityType: selectedEntityType });
      if (res.data?.success) {
        setDryRunResult(res.data.data);
        toast.success(`Dry run complete: ${res.data.data.eligibleCount} eligible records identified`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Dry run failed');
    } finally {
      setDryRunning(false);
    }
  };

  const handleExecuteRetention = async () => {
    if (!isAdmin) {
      toast.error('Retention execution requires ADMIN privileges');
      return;
    }
    setExecutingRetention(true);
    try {
      const res = await api.post('/governance/retention/execute', {
        entityType: selectedEntityType,
        batchSize: 500
      });
      if (res.data?.success) {
        const d = res.data.data;
        if (d.blocked) {
          toast.error(`Blocked by Legal Hold: ${d.reason}`);
        } else {
          toast.success(`Retention executed: ${d.deletedCount || d.archivedCount} records processed`);
        }
        setDryRunResult(null);
        fetchRetention();
        fetchPosture();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Retention execution failed');
    } finally {
      setExecutingRetention(false);
    }
  };

  const handleToggleLegalHold = async (entityType, active) => {
    if (!isAdmin) {
      toast.error('Only administrators can toggle legal holds');
      return;
    }
    try {
      const res = await api.post('/governance/retention/legal-hold', {
        entityType,
        active,
        reason: active ? 'Litigation / Regulatory Preservation Order' : ''
      });
      if (res.data?.success) {
        toast.success(`Legal hold ${active ? 'applied' : 'removed'} for ${entityType}`);
        fetchRetention();
        fetchPosture();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update legal hold');
    }
  };

  // Break glass request & approve
  const handleRequestBreakGlass = async (e) => {
    e.preventDefault();
    if (!bgReason.trim()) {
      toast.error('Justification is required');
      return;
    }
    setRequestingBg(true);
    try {
      const res = await api.post('/governance/breakglass/request', {
        reason: bgReason,
        durationMinutes: bgDuration,
        scope: ['EMERGENCY_INCIDENT_ISOLATION', 'EMERGENCY_LOG_ACCESS']
      });
      if (res.data?.success) {
        toast.success(`Break-glass session ${res.data.data.sessionId} requested`);
        setBgReason('');
        fetchBreakGlass();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to request break-glass session');
    } finally {
      setRequestingBg(false);
    }
  };

  const handleApproveBreakGlass = async (sessionId) => {
    if (!isAdmin) {
      toast.error('Only administrators can approve emergency break-glass sessions');
      return;
    }
    try {
      const res = await api.post(`/governance/breakglass/${sessionId}/approve`);
      if (res.data?.success) {
        toast.success(`Session ${sessionId} approved and active`);
        fetchBreakGlass();
        fetchPosture();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve break glass');
    }
  };

  const handleRevokeBreakGlass = async (sessionId) => {
    try {
      const res = await api.post(`/governance/breakglass/${sessionId}/revoke`, {
        reason: 'Administrative early revocation'
      });
      if (res.data?.success) {
        toast.success(`Session ${sessionId} revoked immediately`);
        fetchBreakGlass();
        fetchPosture();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to revoke session');
    }
  };

  // AI Copilot calls
  const handleAiSummarize = async () => {
    setAiLoading(true);
    try {
      const res = await api.post('/chatbot/governance/summarize', { postureData: posture });
      if (res.data?.success) {
        setAiSummary(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to generate AI governance summary');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiExplainPolicy = async (policy) => {
    setAiLoading(true);
    try {
      const res = await api.post('/chatbot/governance/explain-policy', { policyData: policy });
      if (res.data?.success) {
        setAiExplanation(res.data.data);
        setActiveTab('copilot');
      }
    } catch (err) {
      toast.error('Failed to explain policy');
    } finally {
      setAiLoading(false);
    }
  };

  // Status color helpers
  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
      case 'COMPLIANT':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> ACTIVE</span>;
      case 'APPROVED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> APPROVED</span>;
      case 'REVIEW':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5"><Clock className="w-3 h-3" /> IN REVIEW</span>;
      case 'DRAFT':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5"><Sliders className="w-3 h-3" /> DRAFT</span>;
      case 'PARTIAL':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" /> PARTIAL</span>;
      case 'SUSPENDED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/30 flex items-center gap-1.5"><Lock className="w-3 h-3" /> SUSPENDED</span>;
      case 'RETIRED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30 flex items-center gap-1.5"><Archive className="w-3 h-3" /> RETIRED</span>;
      case 'NON_COMPLIANT':
      case 'REJECTED':
      case 'EXPIRED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1.5"><XCircle className="w-3 h-3" /> {status}</span>;
      case 'NOT_CONFIGURED':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-700/30 text-zinc-400 border border-zinc-700 flex items-center gap-1.5"><HelpCircle className="w-3 h-3" /> NOT CONFIGURED</span>;
    }
  };

  const filteredPolicies = policies.filter((p) => {
    if (policyFilter !== 'ALL' && p.status !== policyFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.policyId.toLowerCase().includes(q) ||
        p.policyType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                Enterprise Governance Center
                <span className="text-xs px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">
                  Phase 75
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Multi-tenant security policy administration, immutable versioning, bounded data retention & break-glass access
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshAll}
            disabled={loading}
            className="px-4 py-2 bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/80 rounded-xl text-xs font-medium text-slate-300 transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {isAnalystOrAbove && (
            <button
              onClick={handleSeedCanonical}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              Seed Canonical Policies
            </button>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-slate-800/50">
        {[
          { id: 'posture', label: 'Overview & Posture', icon: ShieldCheck },
          { id: 'policies', label: 'Policy Administration', icon: Sliders },
          { id: 'revisions', label: 'Revisions & Approvals', icon: History },
          { id: 'retention', label: 'Data Retention & Legal Holds', icon: Database },
          { id: 'breakglass', label: 'Break-Glass Emergency Access', icon: Flame },
          { id: 'integrations', label: 'Integration Governance', icon: Key },
          { id: 'copilot', label: 'AI Governance Copilot', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
                isActive
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                  : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* TAB 1: OVERVIEW & POSTURE */}
        {activeTab === 'posture' && (
          <div className="space-y-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
                <div className="text-xs text-slate-400 font-medium">Governance Posture</div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xl font-bold tracking-tight text-white">
                    {posture?.overallStatus || 'EVALUATING'}
                  </span>
                  {getStatusBadge(posture?.overallStatus)}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Real platform state inspection
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
                <div className="text-xs text-slate-400 font-medium">Compliance Score</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">
                    {posture?.complianceScore !== undefined ? `${posture.complianceScore}%` : '0%'}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({posture?.compliantDomains || 0}/{posture?.totalDomains || 8} domains)
                  </span>
                </div>
                <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${posture?.complianceScore || 0}%` }}
                  />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
                <div className="text-xs text-slate-400 font-medium">Active Break-Glass</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-amber-400">
                    {posture?.operationalTelemetry?.activeBreakGlassSessions || 0}
                  </span>
                  <span className="text-xs text-slate-400">sessions</span>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Time-bounded emergency elevation
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
                <div className="text-xs text-slate-400 font-medium">Legal Holds Active</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-rose-400">
                    {posture?.operationalTelemetry?.legalHoldsCount || 0}
                  </span>
                  <span className="text-xs text-slate-400">locked entities</span>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Guarantees immutable retention
                </div>
              </div>
            </div>

            {/* Domains Breakdown Table */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  Canonical Policy Domain Posture
                </h3>
                <span className="text-xs text-slate-500">
                  Evaluated at: {posture?.evaluatedAt ? new Date(posture.evaluatedAt).toLocaleString() : 'N/A'}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="pb-3 px-3">Domain</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3">Enforcement</th>
                      <th className="pb-3 px-3">Policy ID</th>
                      <th className="pb-3 px-3">Version</th>
                      <th className="pb-3 px-3">Explanation</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {posture?.domains?.map((dom) => (
                      <tr key={dom.domain} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 px-3 font-medium text-slate-200">{dom.domain}</td>
                        <td className="py-3 px-3">{getStatusBadge(dom.status)}</td>
                        <td className="py-3 px-3 font-mono text-slate-400">{dom.enforcementMode}</td>
                        <td className="py-3 px-3 font-mono text-indigo-400">{dom.policyId || '—'}</td>
                        <td className="py-3 px-3 font-mono text-slate-300">v{dom.version}</td>
                        <td className="py-3 px-3 text-slate-400 max-w-xs truncate">{dom.explanation}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              const pol = policies.find((p) => p.policyId === dom.policyId);
                              if (pol) {
                                handleSelectPolicy(pol);
                                setActiveTab('policies');
                              }
                            }}
                            className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
                          >
                            View <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Identified Gaps Section */}
            {gaps.length > 0 && (
              <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                <h3 className="text-base font-semibold text-amber-300 flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Identified Governance Gaps ({gaps.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  {gaps.map((gap) => (
                    <div key={gap.gapId} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{gap.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {gap.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">{gap.description}</p>
                      <div className="mt-3 text-xs text-indigo-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Remediation: {gap.remediation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: POLICY ADMINISTRATION */}
        {activeTab === 'policies' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left list */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search policies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <select
                  value={policyFilter}
                  onChange={(e) => setPolicyFilter(e.target.value)}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-300 px-3 py-2 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="REVIEW">REVIEW</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="RETIRED">RETIRED</option>
                </select>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {filteredPolicies.map((pol) => {
                  const isSelected = selectedPolicy?.policyId === pol.policyId;
                  return (
                    <div
                      key={pol.policyId}
                      onClick={() => handleSelectPolicy(pol)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/10'
                          : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate max-w-[180px]">
                          {pol.name}
                        </span>
                        {getStatusBadge(pol.status)}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 font-mono">
                        {pol.policyId} • v{pol.currentVersion}
                      </div>
                      <div className="text-[10px] text-indigo-400/80 mt-1">
                        {pol.policyType}
                      </div>
                    </div>
                  );
                })}
                {filteredPolicies.length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    No policies found. Click "Seed Canonical Policies" above.
                  </div>
                )}
              </div>
            </div>

            {/* Right details */}
            <div className="lg:col-span-2">
              {selectedPolicy ? (
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        {selectedPolicy.name}
                      </h2>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span className="font-mono text-indigo-400">{selectedPolicy.policyId}</span>
                        <span>•</span>
                        <span>Version {selectedPolicy.currentVersion}</span>
                        <span>•</span>
                        <span>{selectedPolicy.policyType}</span>
                      </div>
                    </div>
                    <div>{getStatusBadge(selectedPolicy.status)}</div>
                  </div>

                  {/* Lifecycle Action Bar */}
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex flex-wrap items-center gap-3">
                    <span className="text-xs font-semibold text-slate-300 mr-2">Lifecycle Actions:</span>

                    {selectedPolicy.status === 'DRAFT' && isAnalystOrAbove && (
                      <button
                        onClick={() => handleSubmitReview(selectedPolicy.policyId)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition-all"
                      >
                        <Clock className="w-3.5 h-3.5" /> Submit for Review
                      </button>
                    )}

                    {selectedPolicy.status === 'REVIEW' && (
                      <button
                        onClick={() => handleApprovePolicy(selectedPolicy.policyId)}
                        disabled={!isAdmin}
                        title={!isAdmin ? 'Admin role required' : ''}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                          isAdmin
                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> Approve Revision (Admin)
                      </button>
                    )}

                    {selectedPolicy.status === 'APPROVED' && (
                      <button
                        onClick={() => handleActivatePolicy(selectedPolicy.policyId)}
                        disabled={!isAdmin}
                        title={!isAdmin ? 'Admin role required' : ''}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                          isAdmin
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5" /> Activate Policy (Admin)
                      </button>
                    )}

                    {selectedPolicy.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleSuspendPolicy(selectedPolicy.policyId)}
                        disabled={!isAdmin}
                        title={!isAdmin ? 'Admin role required' : ''}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                          isAdmin
                            ? 'bg-orange-600 hover:bg-orange-500 text-white'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" /> Suspend Enforcement (Admin)
                      </button>
                    )}

                    <button
                      onClick={() => handleAiExplainPolicy(selectedPolicy)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition-all ml-auto"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Explain with AI
                    </button>
                  </div>

                  {/* Cryptographic Verification Box */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs space-y-1">
                    <div className="text-slate-400 font-sans font-medium mb-1">Cryptographic Integrity:</div>
                    <div className="text-slate-300 truncate">
                      <span className="text-slate-500">Config Checksum:</span> {selectedPolicy.checksum || 'N/A'}
                    </div>
                    <div className="text-slate-300 truncate">
                      <span className="text-slate-500">Approved Revision Hash:</span> {selectedPolicy.approvedRevisionHash || 'AWAITING APPROVAL'}
                    </div>
                  </div>

                  {/* Configuration JSON Viewer */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Active Configuration Payload
                    </h4>
                    <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto max-h-60">
                      {JSON.stringify(selectedPolicy.configuration, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="p-16 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                  Select a policy from the list to view configuration and lifecycle controls.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: REVISIONS & APPROVALS */}
        {activeTab === 'revisions' && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-400" />
                  Immutable Revision Audit Trail
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Append-only record snapshots with cryptographic SHA-256 content hashes. Stale approvals are rejected at activation.
                </p>
              </div>
            </div>

            {revisions.length > 0 ? (
              <div className="space-y-3">
                {revisions.map((rev) => (
                  <div key={rev._id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold">
                          v{rev.version}
                        </span>
                        <span className="text-xs font-bold text-white">{rev.changeSummary || 'Snapshot'}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                        <span>Changed by: {rev.changedBy?.username || 'SYSTEM'}</span>
                        <span>•</span>
                        <span>{new Date(rev.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-[11px] text-slate-400">
                        SHA-256: <span className="text-indigo-400">{rev.contentHash?.substring(0, 16)}...</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl text-xs">
                No policy selected or no revisions found. Select a policy in Policy Administration first.
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DATA RETENTION & LEGAL HOLDS */}
        {activeTab === 'retention' && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-400" />
                  Bounded Data Lifecycle & Legal Holds
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Enforces non-mutating dry runs, legal hold mutation guards, and hard 500-record batch limits.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedEntityType}
                  onChange={(e) => setSelectedEntityType(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl text-xs text-white px-3 py-2"
                >
                  <option value="audit_events">Audit Events</option>
                  <option value="reports">SOC Reports</option>
                  <option value="evidence_packages">Evidence Packages</option>
                  <option value="incidents">Incidents</option>
                  <option value="cases">Cases</option>
                  <option value="alerts">Alerts</option>
                  <option value="findings">Findings</option>
                  <option value="threat_hunts">Threat Hunts</option>
                </select>

                <button
                  onClick={handleDryRun}
                  disabled={dryRunning}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-all"
                >
                  <Play className="w-3.5 h-3.5" />
                  {dryRunning ? 'Evaluating...' : 'Dry Run Preview'}
                </button>

                <button
                  onClick={handleExecuteRetention}
                  disabled={executingRetention || !isAdmin}
                  title={!isAdmin ? 'Admin role required' : ''}
                  className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                    isAdmin
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <Archive className="w-3.5 h-3.5" />
                  {executingRetention ? 'Executing...' : 'Execute Bounded Retention (Admin)'}
                </button>
              </div>
            </div>

            {/* Dry Run Outcome Panel */}
            {dryRunResult && (
              <div className="p-5 rounded-xl bg-slate-900 border border-indigo-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <Info className="w-4 h-4" /> Non-Mutating Dry Run Analysis Result
                  </h4>
                  <span className="text-[10px] text-slate-500">Zero data was modified</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-slate-500">Target Entity:</div>
                    <div className="font-mono text-white font-bold">{dryRunResult.entityType}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-slate-500">Eligible Count:</div>
                    <div className="font-mono text-white font-bold">{dryRunResult.eligibleCount} records</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-slate-500">Projected Action:</div>
                    <div className="font-mono font-bold text-amber-400">{dryRunResult.projectedAction}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-slate-500">Legal Hold Guard:</div>
                    <div className={`font-mono font-bold ${dryRunResult.legalHoldActive ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {dryRunResult.legalHoldActive ? 'ACTIVE (BLOCKING)' : 'INACTIVE'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Retention Policies Table */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <h3 className="text-sm font-semibold text-white mb-4">Configured Retention Schedules</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 px-3">Entity Type</th>
                      <th className="pb-3 px-3">Retention Period</th>
                      <th className="pb-3 px-3">Tier</th>
                      <th className="pb-3 px-3">Legal Hold Status</th>
                      <th className="pb-3 px-3 text-right">Legal Hold Guard</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {retentionPolicies.map((rp) => (
                      <tr key={rp.retentionId} className="hover:bg-slate-800/20">
                        <td className="py-3 px-3 font-mono text-slate-200">{rp.entityType}</td>
                        <td className="py-3 px-3 text-slate-300">{rp.retentionDays} days</td>
                        <td className="py-3 px-3 font-mono text-slate-400">{rp.retentionClass}</td>
                        <td className="py-3 px-3">
                          {rp.legalHoldActive ? (
                            <span className="px-2 py-0.5 rounded text-xs bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1 w-max">
                              <Lock className="w-3 h-3" /> LEGAL HOLD ENGAGED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1 w-max">
                              <Unlock className="w-3 h-3" /> NO HOLD
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleToggleLegalHold(rp.entityType, !rp.legalHoldActive)}
                            disabled={!isAdmin}
                            title={!isAdmin ? 'Admin role required' : ''}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                              rp.legalHoldActive
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                                : 'bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {rp.legalHoldActive ? 'Lift Hold' : 'Apply Legal Hold'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BREAK-GLASS EMERGENCY ACCESS */}
        {activeTab === 'breakglass' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Request Form */}
            <div className="lg:col-span-1 p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                Request Emergency Access
              </h3>
              <p className="text-xs text-slate-400">
                Grants narrow, explicit capabilities for up to 240 minutes. Does NOT grant blanket admin authority.
              </p>

              <form onSubmit={handleRequestBreakGlass} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Emergency Justification (Required, min 10 chars)
                  </label>
                  <textarea
                    rows={3}
                    value={bgReason}
                    onChange={(e) => setBgReason(e.target.value)}
                    placeholder="e.g. Critical ransomware containment on DC-01 requiring immediate log export"
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Duration (Minutes, 5-240)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="240"
                    value={bgDuration}
                    onChange={(e) => setBgDuration(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={requestingBg}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2"
                >
                  <Flame className="w-4 h-4" />
                  {requestingBg ? 'Requesting...' : 'Request Emergency Break-Glass'}
                </button>
              </form>
            </div>

            {/* Sessions Table */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                Break-Glass Sessions ({breakGlassSessions.length})
              </h3>

              <div className="space-y-3">
                {breakGlassSessions.map((session) => (
                  <div key={session.sessionId} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-400">{session.sessionId}</span>
                        {getStatusBadge(session.status)}
                      </div>
                      <p className="text-xs text-slate-300 mt-1 font-medium">{session.reason}</p>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                        <span>Requester: {session.requester?.username}</span>
                        <span>•</span>
                        <span>Expires: {session.expiresAt ? new Date(session.expiresAt).toLocaleTimeString() : 'Pending'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {session.status === 'REQUESTED' && (
                        <button
                          onClick={() => handleApproveBreakGlass(session.sessionId)}
                          disabled={!isAdmin}
                          title={!isAdmin ? 'Admin role required' : ''}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isAdmin
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                          }`}
                        >
                          Approve (Admin)
                        </button>
                      )}
                      {session.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleRevokeBreakGlass(session.sessionId)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white transition-all"
                        >
                          Revoke Access
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {breakGlassSessions.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                    No active or historical break-glass sessions found.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: INTEGRATION GOVERNANCE */}
        {activeTab === 'integrations' && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-indigo-400" />
                  Integration Credential Governance Metadata
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Tracks cryptographic key fingerprints, expiry dates, and rotation schedules. Never stores raw secrets.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 px-3">Name</th>
                    <th className="pb-3 px-3">Type</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3">Fingerprint</th>
                    <th className="pb-3 px-3">Rotation Interval</th>
                    <th className="pb-3 px-3">Expires At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {integrations.map((integ) => (
                    <tr key={integ.integrationId} className="hover:bg-slate-800/20">
                      <td className="py-3 px-3 font-semibold text-white">{integ.name}</td>
                      <td className="py-3 px-3 font-mono text-indigo-400">{integ.type}</td>
                      <td className="py-3 px-3">{getStatusBadge(integ.status)}</td>
                      <td className="py-3 px-3 font-mono text-slate-400 truncate max-w-xs">{integ.keyFingerprint}</td>
                      <td className="py-3 px-3 text-slate-300">{integ.rotationIntervalDays} days</td>
                      <td className="py-3 px-3 text-slate-400">
                        {integ.expiresAt ? new Date(integ.expiresAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                  {integrations.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No integration credential metadata registered.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: AI GOVERNANCE COPILOT */}
        {activeTab === 'copilot' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  Bounded AI Governance Copilot
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Advisory-only governance assistant. Generates posture narratives, control explanations, and gap remediation roadmaps.
                </p>
              </div>
              <button
                onClick={handleAiSummarize}
                disabled={aiLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
              >
                <Sparkles className="w-4 h-4" />
                {aiLoading ? 'Analyzing...' : 'Generate Executive Narrative'}
              </button>
            </div>

            {aiSummary && (
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Executive Governance Narrative
                </h4>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {aiSummary.narrative}
                </p>
                <div className="border-t border-slate-800 pt-3">
                  <span className="text-xs font-semibold text-slate-400">Key Highlights:</span>
                  <ul className="mt-2 space-y-1 text-xs text-slate-300 list-disc list-inside">
                    {aiSummary.highlights?.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-500">
                  ⚠️ {aiSummary.aiBoundary?.disclaimer}
                </div>
              </div>
            )}

            {aiExplanation && (
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  Policy Control Analysis: {aiExplanation.name}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">{aiExplanation.summary}</p>
                <p className="text-xs text-slate-400">{aiExplanation.controlAnalysis}</p>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-500">
                  ⚠️ {aiExplanation.aiBoundary?.disclaimer}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
