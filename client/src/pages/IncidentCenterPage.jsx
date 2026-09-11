import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Users,
  FileText,
  Terminal,
  Activity,
  Sparkles,
  RefreshCw,
  Plus,
  Shield,
  Tag,
  Lock,
  ExternalLink,
  ChevronRight,
  Crosshair,
  FileCheck,
  AlertOctagon,
  ArrowRight,
  Cpu,
  Layers,
  HelpCircle,
  X,
  Play,
  RotateCcw,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function IncidentCenterPage() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, timeline, evidence, tasks, response, intel, entities, closure
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  // Child data states
  const [tasks, setTasks] = useState([]);
  const [evidenceList, setEvidenceList] = useState([]);
  const [timelineEvents, setTimelineEvents] = useState([]);

  // Modals
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState('TRIAGING');
  const [transitionReason, setTransitionReason] = useState('');
  const [transitionEvidenceRef, setTransitionEvidenceRef] = useState('');

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [primaryAnalystName, setPrimaryAnalystName] = useState('');
  const [assignedTeam, setAssignedTeam] = useState('SOC-Tier1');

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');

  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [rawEvidenceText, setRawEvidenceText] = useState('');
  const [evidenceSourceEntity, setEvidenceSourceEntity] = useState('MANUAL_UPLOAD');

  const [showSafeCollectModal, setShowSafeCollectModal] = useState(false);
  const [collectTool, setCollectTool] = useState('whois');
  const [collectTarget, setCollectTarget] = useState('');

  const [showProposeActionModal, setShowProposeActionModal] = useState(false);
  const [actionType, setActionType] = useState('HOST_ISOLATION');
  const [actionTarget, setActionTarget] = useState('');
  const [actionRiskClass, setActionRiskClass] = useState('USER_APPROVED');
  const [actionReason, setActionReason] = useState('');

  const [showVerifyActionModal, setShowVerifyActionModal] = useState(false);
  const [verifyingActionId, setVerifyingActionId] = useState(null);
  const [verifyResult, setVerifyResult] = useState('PASS');
  const [verifyNotes, setVerifyNotes] = useState('');

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [rootCause, setRootCause] = useState('');
  const [impactSummary, setImpactSummary] = useState('');
  const [containmentSummary, setContainmentSummary] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [detectionGaps, setDetectionGaps] = useState('');

  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenEvidenceId, setReopenEvidenceId] = useState('');

  // AI Copilot Drawer
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [aiMode, setAiMode] = useState(null); // 'summarize' | 'triage' | 'investigate' | 'containment' | 'tasks' | 'postmortem'
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);

  const userRole = (user?.role || 'viewer').toLowerCase();
  const isAnalystOrHigher = ['analyst', 'operator', 'admin'].includes(userRole);
  const isOperatorOrAdmin = ['operator', 'admin'].includes(userRole);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (severityFilter) params.append('severity', severityFilter);
      if (search) params.append('search', search);

      const res = await api.get(`/incidents?${params.toString()}`);
      if (res.data?.success) {
        const list = res.data.data.incidents || [];
        setIncidents(list);
        if (list.length > 0 && !selectedIncident) {
          fetchIncidentDetails(list[0].incidentId);
        }
      }
    } catch {
      toast.error('Failed to load incidents');
    } finally {
      setLoading(false);
    }
  };

  const fetchIncidentDetails = async (incidentId) => {
    try {
      const res = await api.get(`/incidents/${incidentId}`);
      if (res.data?.success) {
        const inc = res.data.data;
        setSelectedIncident(inc);
        // Load tasks and evidence
        const [taskRes, evRes] = await Promise.all([
          api.get(`/incidents/${incidentId}/tasks`).catch(() => ({ data: { data: [] } })),
          api.get(`/incidents/${incidentId}/evidence`).catch(() => ({ data: { data: [] } })),
        ]);
        setTasks(taskRes.data?.data || []);
        setEvidenceList(evRes.data?.data || []);
      }
    } catch {
      toast.error('Failed to load incident details');
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter, severityFilter, search]);

  const handleSelectIncident = (inc) => {
    fetchIncidentDetails(inc.incidentId);
  };

  // State Transition
  const handleTransition = async (e) => {
    e.preventDefault();
    if (!selectedIncident) return;
    try {
      const res = await api.post(`/incidents/${selectedIncident.incidentId}/transition`, {
        toState: targetStatus,
        reason: transitionReason,
        evidenceRef: transitionEvidenceRef || null,
      });
      if (res.data?.success) {
        toast.success(`Transitioned to ${targetStatus}`);
        setShowTransitionModal(false);
        setTransitionReason('');
        setTransitionEvidenceRef('');
        fetchIncidentDetails(selectedIncident.incidentId);
        fetchIncidents();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Transition failed');
    }
  };

  // Assignment
  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedIncident) return;
    try {
      const res = await api.post(`/incidents/${selectedIncident.incidentId}/assign`, {
        primaryAnalyst: { name: primaryAnalystName },
        team: assignedTeam,
      });
      if (res.data?.success) {
        toast.success(`Assigned to ${primaryAnalystName}`);
        setShowAssignModal(false);
        fetchIncidentDetails(selectedIncident.incidentId);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Assignment failed');
    }
  };

  const handleClaim = async () => {
    if (!selectedIncident) return;
    try {
      const res = await api.post(`/incidents/${selectedIncident.incidentId}/claim`);
      if (res.data?.success) {
        toast.success('Incident claimed');
        fetchIncidentDetails(selectedIncident.incidentId);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Claim failed');
    }
  };

  // Task creation
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!selectedIncident || !taskTitle) return;
    try {
      const res = await api.post(`/incidents/${selectedIncident.incidentId}/tasks`, {
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
      });
      if (res.data?.success) {
        toast.success('Task created');
        setShowTaskModal(false);
        setTaskTitle('');
        setTaskDesc('');
        setTasks((prev) => [...prev, res.data.data]);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Task creation failed');
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const res = await api.put(`/incidents/${selectedIncident.incidentId}/tasks/${taskId}`, {
        status: newStatus,
      });
      if (res.data?.success) {
        toast.success(`Task ${newStatus}`);
        setTasks((prev) => prev.map((t) => (t.taskId === taskId ? res.data.data : t)));
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update task status');
    }
  };

  // Evidence Registration
  const handleRegisterEvidence = async (e) => {
    e.preventDefault();
    if (!selectedIncident || !rawEvidenceText) return;
    try {
      const res = await api.post(`/incidents/${selectedIncident.incidentId}/evidence`, {
        rawEvidence: rawEvidenceText,
        sourceEntity: evidenceSourceEntity,
      });
      if (res.data?.success) {
        toast.success(`Evidence registered (SHA-256: ${res.data.data.hash.substring(0, 12)}...)`);
        setShowEvidenceModal(false);
        setRawEvidenceText('');
        setEvidenceList((prev) => [res.data.data, ...prev]);
        fetchIncidentDetails(selectedIncident.incidentId);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Evidence registration failed');
    }
  };

  // Safe Evidence Collection
  const handleSafeCollect = async (e) => {
    e.preventDefault();
    if (!selectedIncident || !collectTarget) return;
    try {
      const res = await api.post(`/incidents/${selectedIncident.incidentId}/evidence/collect`, {
        tool: collectTool,
        target: collectTarget,
        reason: `Diagnostic evidence collection for ${selectedIncident.incidentId}`,
      });
      if (res.data?.success) {
        toast.success('Safe evidence collected and verified');
        setShowSafeCollectModal(false);
        setCollectTarget('');
        setEvidenceList((prev) => [res.data.data.evidence, ...prev]);
        fetchIncidentDetails(selectedIncident.incidentId);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Evidence collection failed');
    }
  };

  // Verify Evidence
  const handleVerifyEvidence = async (evidenceId) => {
    try {
      const res = await api.post(`/incidents/${selectedIncident.incidentId}/evidence/${evidenceId}/verify`);
      if (res.data?.success) {
        if (res.data.data.integrityStatus === 'VALID') {
          toast.success('Cryptographic SHA-256 verification PASSED: VALID');
        } else {
          toast.error('TAMPER DETECTED: Hash mismatch!');
        }
        // Refresh evidence list
        const evRes = await api.get(`/incidents/${selectedIncident.incidentId}/evidence`);
        setEvidenceList(evRes.data?.data || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Verification failed');
    }
  };

  // Response Actions
  const handleProposeResponseAction = async (e) => {
    e.preventDefault();
    if (!selectedIncident || !actionTarget) return;
    try {
      const res = await api.post(`/incidents/${selectedIncident.incidentId}/response/propose`, {
        actionType,
        target: actionTarget,
        riskClass: actionRiskClass,
        reason: actionReason || `Containment action proposed for ${selectedIncident.incidentId}`,
      });
      if (res.data?.success) {
        toast.success('Response action proposed');
        setShowProposeActionModal(false);
        setActionTarget('');
        setActionReason('');
        fetchIncidentDetails(selectedIncident.incidentId);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to propose response action');
    }
  };

  const handleExecuteResponseAction = async (actId) => {
    try {
      const res = await api.post(`/incidents/${selectedIncident.incidentId}/response/${actId}/execute`);
      if (res.data?.success) {
        toast.success('Response action executed. Awaiting independent verification.');
        fetchIncidentDetails(selectedIncident.incidentId);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Execution failed');
    }
  };

  const handleVerifyResponseAction = async (e) => {
    e.preventDefault();
    if (!selectedIncident || !verifyingActionId) return;
    try {
      const res = await api.post(`/incidents/${selectedIncident.incidentId}/response/${verifyingActionId}/verify`, {
        result: verifyResult,
        notes: verifyNotes,
        verificationMethod: 'INDEPENDENT_DIAGNOSTIC_PROBE',
      });
      if (res.data?.success) {
        toast.success(`Action verified as ${verifyResult}`);
        setShowVerifyActionModal(false);
        setVerifyNotes('');
        fetchIncidentDetails(selectedIncident.incidentId);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action verification failed');
    }
  };

  // Closure & Reopen
  const handleCloseIncident = async (e) => {
    e.preventDefault();
    if (!selectedIncident) return;
    try {
      const res = await api.post(`/incidents/${selectedIncident.incidentId}/close`, {
        rootCause,
        impact: impactSummary,
        containmentSummary,
        lessonsLearned,
        detectionGaps,
      });
      if (res.data?.success) {
        toast.success('Incident closed with post-incident review');
        setShowCloseModal(false);
        fetchIncidentDetails(selectedIncident.incidentId);
        fetchIncidents();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to close incident');
    }
  };

  const handleReopenIncident = async (e) => {
    e.preventDefault();
    if (!selectedIncident || !reopenReason || !reopenEvidenceId) return;
    try {
      const res = await api.post(`/incidents/${selectedIncident.incidentId}/reopen`, {
        reason: reopenReason,
        triggeringEvidenceId: reopenEvidenceId,
      });
      if (res.data?.success) {
        toast.success('Incident reopened with evidence reference');
        setShowReopenModal(false);
        setReopenReason('');
        setReopenEvidenceId('');
        fetchIncidentDetails(selectedIncident.incidentId);
        fetchIncidents();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reopen incident');
    }
  };

  const handleGenerateDetectionGapFeedback = async () => {
    if (!selectedIncident) return;
    try {
      const res = await api.post(`/incidents/${selectedIncident.incidentId}/feedback/gap`);
      if (res.data?.success) {
        toast.success(`Candidate Hunt ${res.data.data.hunt.huntId} and Rule ${res.data.data.rule.ruleId} drafted!`);
        fetchIncidentDetails(selectedIncident.incidentId);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Feedback generation failed');
    }
  };

  // AI Copilot Invocations
  const handleInvokeAi = async (endpoint, modeName) => {
    if (!selectedIncident) return;
    setAiMode(modeName);
    setAiLoading(true);
    setAiResponse(null);
    setShowAiDrawer(true);
    try {
      const res = await api.post(`/chatbot/incidents/${endpoint}`, {
        incidentId: selectedIncident.incidentId,
      });
      if (res.data?.success) {
        setAiResponse(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'AI Copilot query failed');
    } finally {
      setAiLoading(false);
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-950/80 text-red-300 border-red-500/50';
      case 'HIGH':
        return 'bg-orange-950/80 text-orange-300 border-orange-500/50';
      case 'MEDIUM':
        return 'bg-yellow-950/80 text-yellow-300 border-yellow-500/50';
      case 'LOW':
        return 'bg-blue-950/80 text-blue-300 border-blue-500/50';
      default:
        return 'bg-gray-800 text-gray-300 border-gray-600';
    }
  };

  const getSlaBadge = (status) => {
    switch (status) {
      case 'BREACHED':
        return 'bg-red-950/90 text-red-300 border-red-500/60 animate-pulse';
      case 'AT_RISK':
        return 'bg-amber-950/90 text-amber-300 border-amber-500/60';
      case 'COMPLETED':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50';
      default:
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50';
    }
  };

  return (
    <div className="min-h-screen bg-[#070a13] text-gray-100 p-6 flex flex-col">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-gray-800/80">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-400 font-mono text-sm tracking-wider">CYBERSOC // INCIDENT COMMAND WORKSPACE</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
              PHASE 72 CERTIFIED
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Incident Response, Orchestration & Evidence Lifecycle</h1>
          <p className="text-gray-400 text-xs mt-0.5">
            Full 14-state lifecycle, deterministic 6-factor priority, cryptographic SHA-256 evidence integrity, human-in-the-loop response actions, and bounded AI assistance.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleInvokeAi('summarize', 'AI Executive Summary')}
            className="px-3 py-1.5 bg-gradient-to-r from-purple-900/60 to-cyan-900/60 hover:from-purple-800 hover:to-cyan-800 text-cyan-200 border border-cyan-500/40 rounded-lg text-xs font-mono flex items-center gap-1.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span>AI Copilot</span>
          </button>
          <button
            onClick={fetchIncidents}
            className="p-2 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white rounded-lg transition"
            title="Refresh Incidents"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main 2-Column Command Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 flex-1">
        {/* Left Column: Incidents Queue (4 cols) */}
        <div className="lg:col-span-4 flex flex-col bg-gray-900/60 border border-gray-800/80 rounded-xl p-4 h-[calc(100vh-210px)] overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              placeholder="Search ID, title, assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-950 border border-gray-800 rounded-lg px-2 py-1.5 text-xs text-gray-300 font-mono"
            >
              <option value="">All States</option>
              <option value="DETECTED">Detected</option>
              <option value="TRIAGING">Triaging</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="CONTAINMENT_PENDING">Containment Pending</option>
              <option value="CONTAINED">Contained</option>
              <option value="ERADICATING">Eradicating</option>
              <option value="RECOVERING">Recovering</option>
              <option value="VALIDATION">Validation</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="REOPENED">Reopened</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center h-32 text-xs font-mono text-gray-500">
                Loading incidents...
              </div>
            ) : incidents.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-xs font-mono text-gray-500">
                No incidents match filter criteria
              </div>
            ) : (
              incidents.map((inc) => {
                const isSelected = selectedIncident?.incidentId === inc.incidentId;
                return (
                  <div
                    key={inc.incidentId}
                    onClick={() => handleSelectIncident(inc)}
                    className={`p-3 rounded-lg border cursor-pointer transition ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/80 shadow-lg'
                        : 'bg-gray-950/60 border-gray-800/80 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-400">{inc.incidentId}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${getSeverityBadge(inc.severity)}`}>
                        {inc.severity}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-white mt-1 line-clamp-1">{inc.title}</h4>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800/60 text-[10px] font-mono text-gray-400">
                      <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">{inc.status}</span>
                      <span className={`px-1.5 py-0.5 rounded border ${getSlaBadge(inc.sla?.status)}`}>
                        SLA: {inc.sla?.status || 'ON_TRACK'}
                      </span>
                      <span className="text-cyan-300 font-bold">Priority: {inc.priority?.level || 'MED'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Incident Command Deck (8 cols) */}
        <div className="lg:col-span-8 flex flex-col bg-gray-900/60 border border-gray-800/80 rounded-xl p-5 h-[calc(100vh-210px)] overflow-y-auto">
          {selectedIncident ? (
            <div className="space-y-5">
              {/* Header Deck */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-cyan-400 font-bold">{selectedIncident.incidentId}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getSeverityBadge(selectedIncident.severity)}`}>
                      {selectedIncident.severity}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-gray-800 text-gray-300">
                      {selectedIncident.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getSlaBadge(selectedIncident.sla?.status)}`}>
                      SLA: {selectedIncident.sla?.status || 'ON_TRACK'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/80 text-purple-300 border border-purple-800/60">
                      Priority: {selectedIncident.priority?.level || 'MEDIUM'} ({selectedIncident.priority?.calculatedScore || 50}/100)
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1.5">{selectedIncident.title}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{selectedIncident.description}</p>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {isAnalystOrHigher && (
                    <>
                      <button
                        onClick={() => {
                          setTargetStatus('TRIAGING');
                          setShowTransitionModal(true);
                        }}
                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-mono transition"
                      >
                        Transition ▾
                      </button>
                      <button
                        onClick={() => setShowAssignModal(true)}
                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-mono transition"
                      >
                        Assign ▾
                      </button>
                      <button
                        onClick={handleClaim}
                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-mono transition"
                      >
                        Claim
                      </button>
                    </>
                  )}
                  {selectedIncident.status !== 'CLOSED' ? (
                    <button
                      onClick={() => setShowCloseModal(true)}
                      className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/50 rounded-lg text-xs font-mono transition"
                    >
                      Close / Postmortem
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowReopenModal(true)}
                      className="px-3 py-1.5 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500/50 rounded-lg text-xs font-mono transition flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reopen
                    </button>
                  )}
                </div>
              </div>

              {/* 8-Tab Navigation Bar */}
              <div className="flex items-center gap-1 border-b border-gray-800 overflow-x-auto pb-1 font-mono text-xs">
                {[
                  { id: 'overview', label: '1. Overview' },
                  { id: 'timeline', label: '2. Timeline' },
                  { id: 'evidence', label: `3. Evidence (${evidenceList.length})` },
                  { id: 'tasks', label: `4. Tasks (${tasks.length})` },
                  { id: 'response', label: `5. Response (${selectedIncident.responseActions?.length || 0})` },
                  { id: 'intel', label: '6. Threat Intel' },
                  { id: 'entities', label: '7. Underlying Entities' },
                  { id: 'closure', label: '8. Postmortem & Closure' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-t-lg transition whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-gray-800 text-cyan-400 font-bold border-b-2 border-cyan-400'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-4 text-xs font-mono">
                  {/* Priority & SLA Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-black/40 border border-gray-800 rounded-xl p-4">
                      <span className="text-cyan-400 font-bold tracking-wider block mb-2">DETERMINISTIC 6-FACTOR PRIORITY</span>
                      <div className="space-y-1 text-gray-300">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Asset Criticality:</span>
                          <span>{selectedIncident.priority?.factors?.assetCriticality || 'MEDIUM'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Incident Severity:</span>
                          <span>{selectedIncident.priority?.factors?.incidentSeverity || selectedIncident.severity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Exploitability Score:</span>
                          <span>{selectedIncident.priority?.factors?.exploitability || 50}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Confidence:</span>
                          <span>{selectedIncident.priority?.factors?.confidence || 75}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Business Impact:</span>
                          <span>{selectedIncident.priority?.factors?.businessImpact || 'MEDIUM'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Active Compromise:</span>
                          <span className={selectedIncident.priority?.factors?.activeCompromise ? 'text-red-400 font-bold' : 'text-gray-400'}>
                            {selectedIncident.priority?.factors?.activeCompromise ? 'YES' : 'NO'}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-800 text-cyan-300 font-bold">
                          <span>Total Calculated Score:</span>
                          <span>{selectedIncident.priority?.calculatedScore || 50}/100</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-black/40 border border-gray-800 rounded-xl p-4">
                      <span className="text-cyan-400 font-bold tracking-wider block mb-2">REAL TIMESTAMP SLA DEADLINES</span>
                      <div className="space-y-1 text-gray-300">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Current SLA Status:</span>
                          <span className={`px-1.5 py-0.5 rounded border ${getSlaBadge(selectedIncident.sla?.status)}`}>
                            {selectedIncident.sla?.status || 'ON_TRACK'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Acknowledgement:</span>
                          <span>
                            {selectedIncident.sla?.acknowledgedAt
                              ? new Date(selectedIncident.sla.acknowledgedAt).toLocaleTimeString()
                              : selectedIncident.sla?.acknowledgementDeadline
                              ? `Due: ${new Date(selectedIncident.sla.acknowledgementDeadline).toLocaleTimeString()}`
                              : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Investigation Deadline:</span>
                          <span>{selectedIncident.sla?.investigationDeadline ? new Date(selectedIncident.sla.investigationDeadline).toLocaleTimeString() : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Containment Deadline:</span>
                          <span>{selectedIncident.sla?.containmentDeadline ? new Date(selectedIncident.sla.containmentDeadline).toLocaleTimeString() : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Resolution Deadline:</span>
                          <span>{selectedIncident.sla?.resolutionDeadline ? new Date(selectedIncident.sla.resolutionDeadline).toLocaleTimeString() : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assignment & Classification Card */}
                  <div className="bg-black/40 border border-gray-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-cyan-400 font-bold tracking-wider block mb-2">OWNERSHIP & ASSIGNMENT</span>
                      <div className="space-y-1 text-gray-300">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Primary Analyst:</span>
                          <span className="font-semibold text-white">{selectedIncident.assignment?.primaryAnalyst?.name || 'Unassigned'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Assigned Team:</span>
                          <span>{selectedIncident.assignment?.team || 'SOC-Tier1'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Assigned At:</span>
                          <span>{selectedIncident.assignment?.assignedAt ? new Date(selectedIncident.assignment.assignedAt).toLocaleString() : 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-cyan-400 font-bold tracking-wider block mb-2">CLASSIFICATION & ENVIRONMENT</span>
                      <div className="space-y-1 text-gray-300">
                        <div className="flex justify-between">
                          <span className="text-gray-500">MITRE Tactic:</span>
                          <span className="text-purple-300">{selectedIncident.classification?.tactic || 'OTHER'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Incident Type:</span>
                          <span>{selectedIncident.classification?.incidentType || 'SECURITY_INCIDENT'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Environment:</span>
                          <span>{selectedIncident.classification?.environment || 'Production'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Affected Assets:</span>
                          <span>{(selectedIncident.affectedAssets || []).join(', ') || 'None'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: INVESTIGATION TIMELINE */}
              {activeTab === 'timeline' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                    <span className="text-cyan-400 font-bold">CHRONOLOGICAL AUDITED TIMELINE</span>
                    <span className="text-gray-500 text-[10px]">Zero synthetic events</span>
                  </div>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {(selectedIncident.timeline || []).map((t, idx) => (
                      <div key={idx} className="flex items-start gap-3 border-l-2 border-cyan-500/60 pl-3 py-1 bg-black/20 rounded-r">
                        <div className="text-[10px] text-cyan-400 w-24 shrink-0">
                          {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-white">[{t.eventType}] </span>
                          <span className="text-gray-300">{t.description}</span>
                          <span className="text-gray-500 text-[10px] ml-2">by {t.actor || 'SYSTEM'}</span>
                          {t.evidenceRef && (
                            <span className="ml-2 px-1.5 py-0.2 bg-cyan-950/60 text-cyan-400 border border-cyan-800 rounded text-[9px]">
                              Ref: {t.evidenceRef}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: EVIDENCE */}
              {activeTab === 'evidence' && (
                <div className="space-y-4 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-bold">IMMUTABLE EVIDENCE RECORDS</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowSafeCollectModal(true)}
                        className="px-2.5 py-1 bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-600/60 rounded text-[11px] flex items-center gap-1"
                      >
                        <Terminal className="w-3 h-3" />
                        Safe Collect
                      </button>
                      <button
                        onClick={() => setShowEvidenceModal(true)}
                        className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded text-[11px] flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Register Evidence
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {evidenceList.length === 0 ? (
                      <div className="p-6 text-center text-gray-500 bg-black/30 rounded-xl border border-gray-800">
                        No evidence records attached to this incident yet.
                      </div>
                    ) : (
                      evidenceList.map((ev) => (
                        <div key={ev.evidenceId} className="p-3 bg-black/40 border border-gray-800 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-cyan-400">{ev.evidenceId}</span>
                              <span className="text-gray-400">[{ev.sourceEntity}]</span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                  ev.integrityStatus === 'VALID'
                                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                                    : 'bg-red-950 text-red-300 border-red-500/50'
                                }`}
                              >
                                {ev.integrityStatus}
                              </span>
                            </div>

                            <button
                              onClick={() => handleVerifyEvidence(ev.evidenceId)}
                              className="px-2 py-0.5 bg-gray-800 hover:bg-gray-700 text-cyan-300 border border-cyan-700/60 rounded text-[10px]"
                            >
                              Verify SHA-256
                            </button>
                          </div>

                          <div className="text-[11px] text-gray-400 break-all">
                            <span className="text-gray-500">SHA-256: </span>
                            <span className="text-gray-200 font-mono">{ev.hash}</span>
                          </div>

                          <div className="p-2 bg-gray-950/80 rounded border border-gray-800/80 max-h-24 overflow-y-auto text-[10px] text-gray-300 whitespace-pre-wrap">
                            {ev.rawEvidence}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: TASKS */}
              {activeTab === 'tasks' && (
                <div className="space-y-4 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-bold">INCIDENT INVESTIGATION TASKS</span>
                    <button
                      onClick={() => setShowTaskModal(true)}
                      className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-cyan-300 border border-cyan-600/60 rounded text-[11px] flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Task
                    </button>
                  </div>

                  <div className="space-y-2">
                    {tasks.length === 0 ? (
                      <div className="p-6 text-center text-gray-500 bg-black/30 rounded-xl border border-gray-800">
                        No tasks created for this incident yet.
                      </div>
                    ) : (
                      tasks.map((task) => (
                        <div
                          key={task.taskId}
                          className="p-3 bg-black/40 border border-gray-800 rounded-xl flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{task.title}</span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] ${
                                  task.priority === 'HIGH'
                                    ? 'bg-red-950 text-red-300 border border-red-800'
                                    : 'bg-gray-800 text-gray-300'
                                }`}
                              >
                                {task.priority}
                              </span>
                              <span className="text-gray-500 text-[10px]">{task.taskId}</span>
                            </div>
                            <p className="text-gray-400 text-[11px] mt-0.5">{task.description}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-gray-900 border border-gray-700 text-cyan-300 text-[10px]">
                              {task.status}
                            </span>
                            {task.status !== 'DONE' && (
                              <button
                                onClick={() => handleUpdateTaskStatus(task.taskId, 'DONE')}
                                className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/60 rounded text-[10px]"
                              >
                                Mark Done
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: RESPONSE & REMEDIATION */}
              {activeTab === 'response' && (
                <div className="space-y-4 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-cyan-400 font-bold block">RESPONSE ACTIONS & REMEDIATION</span>
                      <span className="text-[10px] text-gray-500">Decoupled execution vs independent verification</span>
                    </div>
                    {isAnalystOrHigher && (
                      <button
                        onClick={() => setShowProposeActionModal(true)}
                        className="px-2.5 py-1 bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-600/60 rounded text-[11px] flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Propose Response Action
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {(selectedIncident.responseActions || []).length === 0 ? (
                      <div className="p-6 text-center text-gray-500 bg-black/30 rounded-xl border border-gray-800">
                        No response actions proposed for this incident yet.
                      </div>
                    ) : (
                      selectedIncident.responseActions.map((act) => (
                        <div key={act.actionId} className="p-3 bg-black/40 border border-gray-800 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{act.type}</span>
                              <span className="text-cyan-400 text-[10px]">Target: {act.target}</span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] ${
                                  act.riskClass === 'PRIVILEGED'
                                    ? 'bg-red-950 text-red-300 border border-red-800'
                                    : 'bg-purple-950 text-purple-300 border border-purple-800'
                                }`}
                              >
                                {act.riskClass}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 text-[10px]">
                                Status: {act.status}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded border text-[10px] ${
                                  act.verificationStatus === 'PASS'
                                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                                    : act.verificationStatus === 'FAIL'
                                    ? 'bg-red-950 text-red-300 border-red-500/50'
                                    : 'bg-amber-950 text-amber-300 border-amber-500/50'
                                }`}
                              >
                                Verification: {act.verificationStatus}
                              </span>
                            </div>
                          </div>

                          {/* Action controls */}
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800/80">
                            {isOperatorOrAdmin && ['PROPOSED', 'AWAITING_APPROVAL'].includes(act.status) && (
                              <button
                                onClick={() => handleExecuteResponseAction(act.actionId)}
                                className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-bold flex items-center gap-1"
                              >
                                <Play className="w-3 h-3" />
                                Execute Action
                              </button>
                            )}
                            {isAnalystOrHigher && (
                              <button
                                onClick={() => {
                                  setVerifyingActionId(act.actionId);
                                  setShowVerifyActionModal(true);
                                }}
                                className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-cyan-300 border border-cyan-600/60 rounded text-[10px]"
                              >
                                Independent Verification ▾
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: THREAT INTELLIGENCE */}
              {activeTab === 'intel' && (
                <div className="space-y-4 font-mono text-xs">
                  <span className="text-cyan-400 font-bold block">CORRELATED THREAT INTELLIGENCE & ATT&CK</span>
                  <div className="bg-black/40 border border-gray-800 rounded-xl p-4 space-y-3">
                    <span className="text-gray-400 block font-semibold">Normalized Indicators of Compromise (IOCs):</span>
                    {(selectedIncident.iocs || []).length === 0 ? (
                      <div className="text-gray-500">No IOCs bound to this incident</div>
                    ) : (
                      selectedIncident.iocs.map((ioc, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-gray-950 rounded border border-gray-800">
                          <span className="text-cyan-300 font-mono">{ioc.value}</span>
                          <span className="text-gray-400 text-[10px]">{ioc.type}</span>
                          <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 text-[10px]">{ioc.reputation}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 7: UNDERLYING ENTITIES */}
              {activeTab === 'entities' && (
                <div className="space-y-4 font-mono text-xs">
                  <span className="text-cyan-400 font-bold block">ATTACK-CHAIN RELATIONSHIP GRAPH</span>
                  <div className="p-4 bg-gray-950/80 border border-gray-800/80 rounded-lg min-h-[140px] flex flex-wrap items-center justify-center gap-4">
                    {(selectedIncident.attackChainGraph?.nodes || []).map((node) => (
                      <div
                        key={node.id}
                        className="px-3 py-2 bg-gray-900 border border-cyan-500/40 rounded-lg shadow-md flex flex-col items-center min-w-[100px]"
                      >
                        <span className="text-[10px] font-mono uppercase text-cyan-400">{node.type}</span>
                        <span className="text-xs font-semibold text-white mt-0.5">{node.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1 text-[11px] text-gray-400">
                    {(selectedIncident.attackChainGraph?.edges || []).map((edge, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-cyan-400">↳</span>
                        <span>{edge.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 8: POSTMORTEM & CLOSURE */}
              {activeTab === 'closure' && (
                <div className="space-y-4 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-bold">STRUCTURED POST-INCIDENT REVIEW</span>
                    {selectedIncident.status === 'CLOSED' && (
                      <button
                        onClick={handleGenerateDetectionGapFeedback}
                        className="px-2.5 py-1 bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-500/50 rounded text-[11px] flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-purple-300" />
                        Generate Feedback Hunt / Rule
                      </button>
                    )}
                  </div>

                  {selectedIncident.closure?.rootCause ? (
                    <div className="bg-black/40 border border-gray-800 rounded-xl p-4 space-y-3">
                      <div>
                        <span className="text-gray-500 block">Root Cause:</span>
                        <p className="text-gray-200 mt-0.5">{selectedIncident.closure.rootCause}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Business Impact:</span>
                        <p className="text-gray-200 mt-0.5">{selectedIncident.closure.impact}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Containment Summary:</span>
                        <p className="text-gray-200 mt-0.5">{selectedIncident.closure.containmentSummary}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Lessons Learned:</span>
                        <p className="text-gray-200 mt-0.5">{selectedIncident.closure.lessonsLearned}</p>
                      </div>
                      {selectedIncident.closure.detectionGaps && (
                        <div>
                          <span className="text-purple-400 block">Identified Detection Gaps:</span>
                          <p className="text-gray-200 mt-0.5">{selectedIncident.closure.detectionGaps}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500 bg-black/30 rounded-xl border border-gray-800">
                      Postmortem not yet completed. High/Critical incidents require postmortem for closure.
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-xs font-mono">
              Select an incident from the left queue to enter command workspace.
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Transition Status */}
      {showTransitionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleTransition} className="bg-gray-900 border border-gray-700 rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <h3 className="text-sm font-bold text-white pb-2 border-b border-gray-800">Transition Incident State</h3>
            <div>
              <label className="block text-gray-400 mb-1">Target 14-State Target</label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white"
              >
                <option value="TRIAGING">TRIAGING</option>
                <option value="INVESTIGATING">INVESTIGATING</option>
                <option value="CONTAINMENT_PENDING">CONTAINMENT_PENDING</option>
                <option value="CONTAINED">CONTAINED</option>
                <option value="ERADICATING">ERADICATING</option>
                <option value="RECOVERING">RECOVERING</option>
                <option value="VALIDATION">VALIDATION</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Reason / Rationale</label>
              <textarea
                required
                rows={2}
                value={transitionReason}
                onChange={(e) => setTransitionReason(e.target.value)}
                placeholder="State reason for transition..."
                className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Evidence Reference (Optional)</label>
              <input
                type="text"
                value={transitionEvidenceRef}
                onChange={(e) => setTransitionEvidenceRef(e.target.value)}
                placeholder="e.g. EVID-..."
                className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowTransitionModal(false)} className="px-3 py-1.5 bg-gray-800 rounded text-gray-300">
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 bg-cyan-600 rounded text-white font-bold">
                Transition
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Assign Ownership */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAssign} className="bg-gray-900 border border-gray-700 rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <h3 className="text-sm font-bold text-white pb-2 border-b border-gray-800">Assign Incident Ownership</h3>
            <div>
              <label className="block text-gray-400 mb-1">Analyst Name</label>
              <input
                required
                type="text"
                value={primaryAnalystName}
                onChange={(e) => setPrimaryAnalystName(e.target.value)}
                placeholder="Analyst Name"
                className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Team</label>
              <select
                value={assignedTeam}
                onChange={(e) => setAssignedTeam(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white"
              >
                <option value="SOC-Tier1">SOC Tier 1</option>
                <option value="SOC-Tier2">SOC Tier 2</option>
                <option value="DFIR-Escalation">DFIR Escalation</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAssignModal(false)} className="px-3 py-1.5 bg-gray-800 rounded text-gray-300">
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 bg-purple-600 rounded text-white font-bold">
                Assign
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Add Task */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateTask} className="bg-gray-900 border border-gray-700 rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <h3 className="text-sm font-bold text-white pb-2 border-b border-gray-800">Create Incident Task</h3>
            <div>
              <label className="block text-gray-400 mb-1">Task Title</label>
              <input
                required
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Verify process hash on endpoint"
                className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Description</label>
              <textarea
                rows={2}
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                placeholder="Task details..."
                className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Priority</label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowTaskModal(false)} className="px-3 py-1.5 bg-gray-800 rounded text-gray-300">
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 bg-cyan-600 rounded text-white font-bold">
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Register Evidence */}
      {showEvidenceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleRegisterEvidence} className="bg-gray-900 border border-gray-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <h3 className="text-sm font-bold text-white pb-2 border-b border-gray-800">Register Immutable Evidence</h3>
            <div>
              <label className="block text-gray-400 mb-1">Source Entity</label>
              <select
                value={evidenceSourceEntity}
                onChange={(e) => setEvidenceSourceEntity(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white"
              >
                <option value="MANUAL_UPLOAD">MANUAL_UPLOAD</option>
                <option value="HOST">HOST</option>
                <option value="NETWORK">NETWORK</option>
                <option value="LOG">LOG</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Raw Evidence Content</label>
              <textarea
                required
                rows={5}
                value={rawEvidenceText}
                onChange={(e) => setRawEvidenceText(e.target.value)}
                placeholder="Paste raw log, artifact, or diagnostic output..."
                className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowEvidenceModal(false)} className="px-3 py-1.5 bg-gray-800 rounded text-gray-300">
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 bg-cyan-600 rounded text-white font-bold">
                Register (Compute SHA-256)
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Safe Evidence Collection */}
      {showSafeCollectModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSafeCollect} className="bg-gray-900 border border-gray-700 rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <h3 className="text-sm font-bold text-white pb-2 border-b border-gray-800">Safe Native Evidence Collection</h3>
            <div>
              <label className="block text-gray-400 mb-1">Certified Diagnostic Tool</label>
              <select
                value={collectTool}
                onChange={(e) => setCollectTool(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white"
              >
                <option value="whois">whois</option>
                <option value="dig">dig / dns</option>
                <option value="ping">ping probe</option>
                <option value="curl">curl HTTP headers</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Target Host / Indicator</label>
              <input
                required
                type="text"
                value={collectTarget}
                onChange={(e) => setCollectTarget(e.target.value)}
                placeholder="e.g. 1.1.1.1 or example.com"
                className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowSafeCollectModal(false)} className="px-3 py-1.5 bg-gray-800 rounded text-gray-300">
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 bg-cyan-600 rounded text-white font-bold">
                Collect & Hash
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Close Incident / Postmortem */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCloseIncident} className="bg-gray-900 border border-gray-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-3 font-mono text-xs max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-white pb-2 border-b border-gray-800">Close Incident & Postmortem</h3>
            <div>
              <label className="block text-gray-400 mb-1">Root Cause (Mandatory for High/Crit)</label>
              <textarea
                required
                rows={2}
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                placeholder="Confirmed adversary root cause..."
                className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Impact Summary</label>
              <textarea
                required
                rows={2}
                value={impactSummary}
                onChange={(e) => setImpactSummary(e.target.value)}
                placeholder="Business and system impact..."
                className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Containment Summary</label>
              <textarea
                required
                rows={2}
                value={containmentSummary}
                onChange={(e) => setContainmentSummary(e.target.value)}
                placeholder="Containment execution and verification..."
                className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Lessons Learned</label>
              <textarea
                required
                rows={2}
                value={lessonsLearned}
                onChange={(e) => setLessonsLearned(e.target.value)}
                placeholder="Future preventative recommendations..."
                className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-purple-400 mb-1">Detection Gaps (Feeds future Threat Hunts)</label>
              <textarea
                rows={2}
                value={detectionGaps}
                onChange={(e) => setDetectionGaps(e.target.value)}
                placeholder="Gaps in telemetry or rules observed..."
                className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowCloseModal(false)} className="px-3 py-1.5 bg-gray-800 rounded text-gray-300">
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 bg-red-600 rounded text-white font-bold">
                Submit Closure
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Reopen Incident */}
      {showReopenModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleReopenIncident} className="bg-gray-900 border border-gray-700 rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <h3 className="text-sm font-bold text-white pb-2 border-b border-gray-800">Reopen Incident</h3>
            <div>
              <label className="block text-gray-400 mb-1">Reason for Reopening</label>
              <textarea
                required
                rows={2}
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="Adversary re-emergence or new evidence..."
                className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Triggering Evidence Reference</label>
              <input
                required
                type="text"
                value={reopenEvidenceId}
                onChange={(e) => setReopenEvidenceId(e.target.value)}
                placeholder="e.g. EVID-..."
                className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowReopenModal(false)} className="px-3 py-1.5 bg-gray-800 rounded text-gray-300">
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 bg-amber-600 rounded text-white font-bold">
                Reopen Incident
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Propose Response Action */}
      {showProposeActionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleProposeResponseAction} className="bg-gray-900 border border-gray-700 rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <h3 className="text-sm font-bold text-white pb-2 border-b border-gray-800">Propose Response Action</h3>
            <div>
              <label className="block text-gray-400 mb-1">Action Type</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white"
              >
                <option value="HOST_ISOLATION">HOST_ISOLATION</option>
                <option value="PROCESS_TERMINATION">PROCESS_TERMINATION</option>
                <option value="FIREWALL_BLOCK">FIREWALL_BLOCK</option>
                <option value="ACCOUNT_REVOCATION">ACCOUNT_REVOCATION</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Target Asset / Identity</label>
              <input
                required
                type="text"
                value={actionTarget}
                onChange={(e) => setActionTarget(e.target.value)}
                placeholder="e.g. srv-prod-01"
                className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Risk Class</label>
              <select
                value={actionRiskClass}
                onChange={(e) => setActionRiskClass(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white"
              >
                <option value="USER_APPROVED">USER_APPROVED (Operator Gate)</option>
                <option value="PRIVILEGED">PRIVILEGED (Admin Gate)</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Rationale</label>
              <textarea
                rows={2}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Why is this response necessary?"
                className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowProposeActionModal(false)} className="px-3 py-1.5 bg-gray-800 rounded text-gray-300">
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 bg-cyan-600 rounded text-white font-bold">
                Submit Proposal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Independent Verification */}
      {showVerifyActionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleVerifyResponseAction} className="bg-gray-900 border border-gray-700 rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <h3 className="text-sm font-bold text-white pb-2 border-b border-gray-800">Independent Security Verification</h3>
            <div>
              <label className="block text-gray-400 mb-1">Verification Result</label>
              <select
                value={verifyResult}
                onChange={(e) => setVerifyResult(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white"
              >
                <option value="PASS">PASS (Remediation Confirmed)</option>
                <option value="FAIL">FAIL (Adversary Activity Persists)</option>
                <option value="INCONCLUSIVE">INCONCLUSIVE (Further Telemetry Needed)</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Verification Notes & Evidence</label>
              <textarea
                required
                rows={3}
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                placeholder="Detail diagnostic check results confirming status..."
                className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowVerifyActionModal(false)} className="px-3 py-1.5 bg-gray-800 rounded text-gray-300">
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 bg-cyan-600 rounded text-white font-bold">
                Record Verification
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AI Copilot Drawer */}
      {showAiDrawer && (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-gray-950/95 border-l border-gray-800 p-6 z-50 shadow-2xl flex flex-col font-mono text-xs">
          <div className="flex items-center justify-between pb-4 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="font-bold text-white">Bounded Incident Copilot</span>
            </div>
            <button onClick={() => setShowAiDrawer(false)} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Copilot Action Bar */}
          <div className="grid grid-cols-3 gap-1.5 py-3 border-b border-gray-800">
            <button
              onClick={() => handleInvokeAi('summarize', 'Incident Summary')}
              className="px-2 py-1 bg-gray-900 hover:bg-gray-800 text-cyan-300 rounded text-[10px]"
            >
              Summarize
            </button>
            <button
              onClick={() => handleInvokeAi('triage', 'Triage Advice')}
              className="px-2 py-1 bg-gray-900 hover:bg-gray-800 text-purple-300 rounded text-[10px]"
            >
              Triage
            </button>
            <button
              onClick={() => handleInvokeAi('investigate', 'Investigation Steps')}
              className="px-2 py-1 bg-gray-900 hover:bg-gray-800 text-emerald-300 rounded text-[10px]"
            >
              Investigate
            </button>
            <button
              onClick={() => handleInvokeAi('recommend-containment', 'Containment Suggestions')}
              className="px-2 py-1 bg-gray-900 hover:bg-gray-800 text-red-300 rounded text-[10px]"
            >
              Containment
            </button>
            <button
              onClick={() => handleInvokeAi('draft-tasks', 'Draft Tasks')}
              className="px-2 py-1 bg-gray-900 hover:bg-gray-800 text-yellow-300 rounded text-[10px]"
            >
              Draft Tasks
            </button>
            <button
              onClick={() => handleInvokeAi('postmortem', 'Draft Postmortem')}
              className="px-2 py-1 bg-gray-900 hover:bg-gray-800 text-blue-300 rounded text-[10px]"
            >
              Postmortem
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {aiLoading ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin text-purple-400 mb-2" />
                <span>Consulting Bounded Gemini AI...</span>
              </div>
            ) : aiResponse ? (
              <div className="space-y-3 bg-black/40 p-4 rounded-xl border border-gray-800 text-gray-200">
                <span className="text-cyan-400 font-bold block">{aiMode}</span>
                <pre className="whitespace-pre-wrap text-[11px] text-gray-300 leading-relaxed font-mono">
                  {JSON.stringify(aiResponse, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-12">
                Select an action above to generate advisory assistance for incident {selectedIncident?.incidentId}.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-gray-800 text-[10px] text-gray-500 text-center">
            Zero Autonomous Authority: AI recommendations require analyst confirmation. Privileged actions route to PendingApproval.
          </div>
        </div>
      )}
    </div>
  );
}
