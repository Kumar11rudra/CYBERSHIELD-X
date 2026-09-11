import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderLock, Plus, Search, Filter, Shield, AlertTriangle, 
  CheckCircle2, Clock, ChevronRight, FileText, Bot, Terminal, 
  Eye, Hash, User, Tag, Sparkles, Send, Wrench, RefreshCw, X,
  Layers, FileCheck, Crosshair
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function CaseWorkspacePage() {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('evidence'); // 'evidence' | 'timeline' | 'orchestration' | 'ai'

  // Creation Modals
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [showAddEvidenceModal, setShowAddEvidenceModal] = useState(false);
  const [showNewFindingModal, setShowNewFindingModal] = useState(false);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [dossierData, setDossierData] = useState(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [showLinkIncidentModal, setShowLinkIncidentModal] = useState(false);
  const [incidentToLink, setIncidentToLink] = useState('');
  const [showLinkHuntModal, setShowLinkHuntModal] = useState(false);
  const [huntToLink, setHuntToLink] = useState('');

  // Form states
  const [newCaseData, setNewCaseData] = useState({ title: '', description: '', severity: 'MEDIUM', assets: '', tags: '' });
  const [newEvidenceData, setNewEvidenceData] = useState({ tool: 'whois', rawOutput: '', artifactType: 'RAW_OUTPUT' });
  const [newFindingData, setNewFindingData] = useState({ title: '', description: '', severity: 'MEDIUM', asset: '', sourceTool: 'whois' });

  // AI Investigation State
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const isAnalystOrHigher = user && ['analyst', 'operator', 'admin'].includes((user.role || '').toLowerCase());
  const isOperatorOrAdmin = user && ['operator', 'admin'].includes((user.role || '').toLowerCase());

  const handleFetchDossier = async () => {
    if (!selectedCase) return;
    try {
      setDossierLoading(true);
      setShowDossierModal(true);
      const res = await api.get(`/cases/${selectedCase.caseId}/dossier`);
      if (res.data?.success) {
        setDossierData(res.data.data);
      }
    } catch {
      toast.error('Failed to compile case dossier');
    } finally {
      setDossierLoading(false);
    }
  };

  const handleLinkIncident = async (e) => {
    e.preventDefault();
    if (!selectedCase || !incidentToLink) return;
    try {
      const res = await api.post(`/cases/${selectedCase.caseId}/incidents`, {
        incidentId: incidentToLink,
      });
      if (res.data?.success) {
        toast.success(`Incident ${incidentToLink} linked to case`);
        setShowLinkIncidentModal(false);
        setIncidentToLink('');
        fetchCaseDetail(selectedCase.caseId);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to link incident');
    }
  };

  const handleLinkHunt = async (e) => {
    e.preventDefault();
    if (!selectedCase || !huntToLink) return;
    try {
      const res = await api.post(`/cases/${selectedCase.caseId}/hunts`, {
        huntId: huntToLink,
      });
      if (res.data?.success) {
        toast.success(`Threat Hunt ${huntToLink} linked to case`);
        setShowLinkHuntModal(false);
        setHuntToLink('');
        fetchCaseDetail(selectedCase.caseId);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to link hunt');
    }
  };

  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cases');
      if (res.data?.success) {
        const fetched = res.data.data?.cases || [];
        setCases(fetched);
        if (fetched.length > 0 && !selectedCase) {
          // Select first case and fetch its full details
          fetchCaseDetail(fetched[0].caseId || fetched[0]._id);
        }
      }
    } catch (err) {
      toast.error('Failed to load cases');
    } finally {
      setLoading(false);
    }
  };

  const fetchCaseDetail = async (id) => {
    try {
      const res = await api.get(`/cases/${id}`);
      if (res.data?.success) {
        setSelectedCase(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to fetch case details');
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleCreateCase = async (e) => {
    e.preventDefault();
    if (!newCaseData.title) return toast.error('Case title is required');
    try {
      const payload = {
        title: newCaseData.title,
        description: newCaseData.description,
        severity: newCaseData.severity,
        assets: newCaseData.assets.split(',').map(a => a.trim()).filter(Boolean),
        tags: newCaseData.tags.split(',').map(t => t.trim()).filter(Boolean)
      };
      const res = await api.post('/cases', payload);
      if (res.data?.success) {
        toast.success('Investigation case opened');
        setShowNewCaseModal(false);
        setNewCaseData({ title: '', description: '', severity: 'MEDIUM', assets: '', tags: '' });
        await fetchCases();
        fetchCaseDetail(res.data.data.caseId);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create case');
    }
  };

  const handleAddEvidence = async (e) => {
    e.preventDefault();
    if (!newEvidenceData.rawOutput) return toast.error('Raw evidence output is required');
    try {
      const res = await api.post(`/cases/${selectedCase.caseId}/evidence`, newEvidenceData);
      if (res.data?.success) {
        toast.success('Raw evidence attached and hash verified');
        setShowAddEvidenceModal(false);
        setNewEvidenceData({ tool: 'whois', rawOutput: '', artifactType: 'RAW_OUTPUT' });
        fetchCaseDetail(selectedCase.caseId);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to attach evidence');
    }
  };

  const handleCreateFinding = async (e) => {
    e.preventDefault();
    if (!newFindingData.title || !newFindingData.asset) return toast.error('Title and Asset are required');
    try {
      const payload = {
        ...newFindingData,
        caseId: selectedCase.caseId
      };
      const res = await api.post('/findings', payload);
      if (res.data?.success) {
        toast.success('Finding logged to case');
        setShowNewFindingModal(false);
        setNewFindingData({ title: '', description: '', severity: 'MEDIUM', asset: '', sourceTool: 'whois' });
        fetchCaseDetail(selectedCase.caseId);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create finding');
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedCase) return;
    try {
      const res = await api.patch(`/cases/${selectedCase.caseId}`, { status: newStatus });
      if (res.data?.success) {
        toast.success(`Case status updated to ${newStatus}`);
        fetchCaseDetail(selectedCase.caseId);
        fetchCases();
      }
    } catch (err) {
      toast.error('Failed to transition case status');
    }
  };

  const handleAddTimelineNote = async (noteText) => {
    if (!noteText.trim()) return;
    try {
      const res = await api.post(`/cases/${selectedCase.caseId}/timeline`, { note: noteText });
      if (res.data?.success) {
        toast.success('Timeline note recorded');
        fetchCaseDetail(selectedCase.caseId);
      }
    } catch (err) {
      toast.error('Failed to add note');
    }
  };

  const handleRunAiInvestigation = async () => {
    if (!selectedCase) return;
    try {
      setAiLoading(true);
      const res = await api.post('/chatbot/investigate', {
        caseId: selectedCase.caseId,
        userQuery: aiQuery || 'Perform investigation synthesis and correlate current case telemetry'
      });
      if (res.data?.success) {
        setAiResult(res.data.data);
        toast.success('AI investigation synthesis complete');
        fetchCaseDetail(selectedCase.caseId);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'AI investigation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const filteredCases = cases.filter(c => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.title?.toLowerCase().includes(q) ||
        c.caseId?.toLowerCase().includes(q) ||
        c.assets?.some(a => a.toLowerCase().includes(q))
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
              <FolderLock className="w-7 h-7 text-cyan-400" />
              CyberSOC Investigation & Case Workspace
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Structured incident management, immutable evidence hashing, and bounded AI investigation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchCases}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
              title="Refresh Cases"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {isAnalystOrHigher && (
              <button
                onClick={() => setShowNewCaseModal(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-cyan-900/30 flex items-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" /> New Case
              </button>
            )}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Master List (4 cols) */}
          <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-4">
            {/* Search & Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search cases, assets, IDs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {['ALL', 'OPEN', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED'].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold tracking-wider transition-colors ${
                      statusFilter === st ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {loading ? (
                <div className="text-center py-12 text-slate-400 text-xs">Loading cases...</div>
              ) : filteredCases.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">No cases found</div>
              ) : (
                filteredCases.map(c => {
                  const isSelected = selectedCase?.caseId === c.caseId;
                  return (
                    <div
                      key={c.caseId}
                      onClick={() => fetchCaseDetail(c.caseId)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-slate-800/80 border-cyan-500/50 shadow-md shadow-cyan-950/20' 
                          : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-mono text-xs font-bold text-cyan-400">{c.caseId}</span>
                        {getSeverityBadge(c.severity)}
                      </div>
                      <h4 className="text-xs font-semibold text-white truncate mb-1">{c.title}</h4>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">{c.status}</span>
                        <span>{new Date(c.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Detail Pane (8 cols) */}
          <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 min-h-[600px] flex flex-col">
            {selectedCase ? (
              <div className="space-y-6 flex-1 flex flex-col">
                {/* Case Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-cyan-400">{selectedCase.caseId}</span>
                      {getSeverityBadge(selectedCase.severity)}
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {selectedCase.status}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white">{selectedCase.title}</h2>
                    <p className="text-xs text-slate-400">{selectedCase.description || 'No description provided.'}</p>
                  </div>

                  {/* Actions & Status Switcher */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleFetchDossier}
                      className="px-3 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-500/50 hover:bg-cyan-900 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 transition"
                    >
                      <FileCheck className="w-3.5 h-3.5" /> Compile Dossier
                    </button>
                    {isAnalystOrHigher && (
                      <select
                        value={selectedCase.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="ESCALATED">ESCALATED</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* Metadata Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-slate-500 block">Analyst Owner</span>
                    <span className="font-semibold text-slate-200">{selectedCase.analystId || 'Unassigned'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Target Assets</span>
                    <span className="font-mono text-slate-200 truncate block">
                      {selectedCase.assets?.length ? selectedCase.assets.join(', ') : 'None attached'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Findings Logged</span>
                    <span className="font-semibold text-cyan-400">{selectedCase.findings?.length || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Raw Evidence Items</span>
                    <span className="font-semibold text-emerald-400">{selectedCase.evidence?.length || 0}</span>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-4 border-b border-slate-800">
                  <button
                    onClick={() => setActiveTab('evidence')}
                    className={`pb-2 text-xs font-semibold tracking-wide border-b-2 transition-colors flex items-center gap-2 ${
                      activeTab === 'evidence' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" /> Evidence & Findings
                  </button>
                  <button
                    onClick={() => setActiveTab('timeline')}
                    className={`pb-2 text-xs font-semibold tracking-wide border-b-2 transition-colors flex items-center gap-2 ${
                      activeTab === 'timeline' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" /> Timeline & Notes
                  </button>
                  <button
                    onClick={() => setActiveTab('orchestration')}
                    className={`pb-2 text-xs font-semibold tracking-wide border-b-2 transition-colors flex items-center gap-2 ${
                      activeTab === 'orchestration' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" /> Incidents & Hunts ({(selectedCase.incidents?.length || 0) + (selectedCase.hunts?.length || 0)})
                  </button>
                  <button
                    onClick={() => setActiveTab('ai')}
                    className={`pb-2 text-xs font-semibold tracking-wide border-b-2 transition-colors flex items-center gap-2 ${
                      activeTab === 'ai' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5" /> AI Investigation Assistant
                  </button>
                </div>

                {/* Tab Contents */}
                <div className="flex-1 overflow-y-auto space-y-4">
                  {/* TAB: EVIDENCE */}
                  {activeTab === 'evidence' && (
                    <div className="space-y-6">
                      {/* Findings Section */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400" /> Correlated Findings
                          </h3>
                          {isAnalystOrHigher && (
                            <button
                              onClick={() => setShowNewFindingModal(true)}
                              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Finding
                            </button>
                          )}
                        </div>

                        {selectedCase.findings?.length === 0 ? (
                          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-center text-xs text-slate-500">
                            No findings linked yet. Create one or run automated scans.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {selectedCase.findings.map(f => (
                              <div key={f.findingId || f._id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-xs text-white">{f.title}</span>
                                  {getSeverityBadge(f.severity)}
                                </div>
                                <p className="text-xs text-slate-400">{f.description}</p>
                                {f.remediation && (
                                  <div className="text-xs text-cyan-300 bg-cyan-950/20 p-2 rounded border border-cyan-800/40">
                                    <strong>Remediation:</strong> {f.remediation}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Raw Evidence Section (STRICT IMMUTABILITY ENFORCED) */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                            <Hash className="w-4 h-4 text-emerald-400" /> Raw Tool Evidence (Authoritative & Immutable)
                          </h3>
                          {isAnalystOrHigher && (
                            <button
                              onClick={() => setShowAddEvidenceModal(true)}
                              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" /> Attach Raw Evidence
                            </button>
                          )}
                        </div>

                        {selectedCase.evidence?.length === 0 ? (
                          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-center text-xs text-slate-500">
                            No raw evidence attached. Use the terminal or paste command output.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {selectedCase.evidence.map(e => (
                              <div key={e.evidenceId} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
                                <div className="flex items-center justify-between flex-wrap gap-2 text-slate-400 text-[11px] pb-2 border-b border-slate-800">
                                  <span className="text-cyan-400 font-bold">[{e.tool.toUpperCase()}] {e.evidenceId}</span>
                                  <span className="text-slate-500">SHA-256: {e.hash?.substring(0, 16)}...</span>
                                  <span>{new Date(e.capturedAt).toLocaleString()}</span>
                                </div>
                                <pre className="text-slate-300 text-xs overflow-x-auto whitespace-pre-wrap max-h-48 p-2 rounded bg-slate-900">
                                  {e.rawOutput}
                                </pre>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB: TIMELINE */}
                  {activeTab === 'timeline' && (
                    <div className="space-y-4">
                      {/* Add Note Form */}
                      {isAnalystOrHigher && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            id="timeline-note-input"
                            placeholder="Add an analyst note to the permanent case timeline..."
                            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddTimelineNote(e.target.value);
                                e.target.value = '';
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              const el = document.getElementById('timeline-note-input');
                              if (el) {
                                handleAddTimelineNote(el.value);
                                el.value = '';
                              }
                            }}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl text-xs font-semibold"
                          >
                            Post Note
                          </button>
                        </div>
                      )}

                      {/* Timeline entries */}
                      <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-800 pl-8">
                        {selectedCase.timeline?.slice().reverse().map((item, idx) => (
                          <div key={idx} className="relative space-y-1">
                            <div className="absolute -left-8 top-1.5 w-2 h-2 rounded-full bg-cyan-400 ring-4 ring-slate-950" />
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              <span className="font-bold text-slate-200 uppercase">{item.action}</span>
                              <span>•</span>
                              <span>By: {item.performedBy}</span>
                              <span>•</span>
                              <span>{new Date(item.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                              {item.details}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB: ORCHESTRATION (INCIDENTS & HUNTS) */}
                  {activeTab === 'orchestration' && (
                    <div className="space-y-6">
                      {/* Linked Incidents */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-cyan-400" /> Linked Incidents
                          </h3>
                          {isAnalystOrHigher && (
                            <button
                              onClick={() => setShowLinkIncidentModal(true)}
                              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                            >
                              <Plus className="w-3.5 h-3.5" /> Link Incident
                            </button>
                          )}
                        </div>

                        {(!selectedCase.incidents || selectedCase.incidents.length === 0) ? (
                          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 text-center text-xs text-slate-500">
                            No formal SOC incidents linked to this operational case.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {selectedCase.incidents.map((inc, i) => {
                              const incId = typeof inc === 'string' ? inc : inc.incidentId || JSON.stringify(inc);
                              return (
                                <div key={i} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
                                  <span className="font-mono text-xs font-bold text-cyan-400">{incId}</span>
                                  <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-[10px] text-cyan-300">
                                    Operational Incident
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Linked Threat Hunts */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                            <Crosshair className="w-4 h-4 text-purple-400" /> Linked Threat Hunts
                          </h3>
                          {isAnalystOrHigher && (
                            <button
                              onClick={() => setShowLinkHuntModal(true)}
                              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-mono"
                            >
                              <Plus className="w-3.5 h-3.5" /> Link Hunt
                            </button>
                          )}
                        </div>

                        {(!selectedCase.hunts || selectedCase.hunts.length === 0) ? (
                          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 text-center text-xs text-slate-500">
                            No threat hunts bound to this investigation container.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {selectedCase.hunts.map((h, i) => (
                              <div key={i} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
                                <span className="font-mono text-xs font-bold text-purple-400">{h}</span>
                                <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800 text-[10px] text-purple-300">
                                  Threat Hunt Binding
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB: AI INVESTIGATION ASSISTANT */}
                  {activeTab === 'ai' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-xs space-y-1">
                        <div className="font-bold text-cyan-300 flex items-center gap-2">
                          <Bot className="w-4 h-4" /> Bounded Security Copilot Investigation Engine
                        </div>
                        <p className="text-slate-300">
                          AI analyzes verified case evidence to synthesize correlation, draft remediation, and propose next investigation steps. 
                          <strong> Actions require explicit operator authorization and cannot execute autonomously.</strong>
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={aiQuery}
                          onChange={(e) => setAiQuery(e.target.value)}
                          placeholder="Ask AI to investigate this case's telemetry (e.g. Correlate open ports with SSL)..."
                          className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        />
                        <button
                          onClick={handleRunAiInvestigation}
                          disabled={aiLoading}
                          className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-2 disabled:opacity-50"
                        >
                          {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          Investigate
                        </button>
                      </div>

                      {/* AI Result Cards */}
                      {aiResult && (
                        <div className="space-y-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
                          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                            <span>Provider: <strong className="text-cyan-400">{aiResult.provider}</strong></span>
                            <span>Model: <strong className="text-slate-200">{aiResult.model}</strong></span>
                          </div>

                          <div className="space-y-2 text-xs">
                            <h4 className="font-bold text-slate-200">Synthesis Summary</h4>
                            <p className="text-slate-300">{aiResult.summary}</p>

                            <h4 className="font-bold text-slate-200 pt-2">Correlation Analysis</h4>
                            <p className="text-slate-300">{aiResult.correlation}</p>

                            <h4 className="font-bold text-slate-200 pt-2">Technical Explanation</h4>
                            <p className="text-slate-300 whitespace-pre-wrap">{aiResult.explanation}</p>

                            <h4 className="font-bold text-cyan-400 pt-2">Proposed Actions (Bounded by RBAC)</h4>
                            <div className="space-y-2 pt-1">
                              {aiResult.actionProposals?.map((act, i) => (
                                <div key={i} className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                        act.actionType === 'ANALYSIS_ONLY' ? 'bg-slate-800 text-slate-300' :
                                        act.actionType === 'USER_APPROVED_TOOL_ACTION' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                                        'bg-rose-950 text-rose-400 border border-rose-800'
                                      }`}>
                                        {act.actionType}
                                      </span>
                                      <span className="font-mono text-xs font-bold text-white">{act.tool} &gt; {act.target}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400">{act.rationale}</p>
                                  </div>

                                  {act.actionType !== 'ANALYSIS_ONLY' && (
                                    <button
                                      onClick={() => toast.success(`Action approved! Sent to operator terminal: ${act.tool} ${act.target}`)}
                                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 shrink-0"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve Action
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-slate-500">
                <FolderLock className="w-12 h-12 text-slate-700 mb-3" />
                <h3 className="text-sm font-semibold text-slate-400">No Case Selected</h3>
                <p className="text-xs text-slate-600 max-w-sm mt-1">
                  Select an investigation case from the sidebar or click "+ New Case" to start a new SOC case.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal: New Case */}
        {showNewCaseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">Create New SOC Case</h3>
                <button onClick={() => setShowNewCaseModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateCase} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 block mb-1">Case Title *</label>
                  <input
                    type="text"
                    required
                    value={newCaseData.title}
                    onChange={(e) => setNewCaseData({ ...newCaseData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                    placeholder="e.g. Suspicious DNS beaconing on gateway"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Severity</label>
                  <select
                    value={newCaseData.severity}
                    onChange={(e) => setNewCaseData({ ...newCaseData, severity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Assets (comma separated)</label>
                  <input
                    type="text"
                    value={newCaseData.assets}
                    onChange={(e) => setNewCaseData({ ...newCaseData, assets: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                    placeholder="e.g. 192.168.1.1, gateway.local"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={newCaseData.description}
                    onChange={(e) => setNewCaseData({ ...newCaseData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                    placeholder="Context, alerts, or observed anomalies..."
                  />
                </div>
                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewCaseModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-semibold hover:bg-cyan-500"
                  >
                    Create Case
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Evidence */}
        {showAddEvidenceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">Attach Raw Tool Evidence</h3>
                <button onClick={() => setShowAddEvidenceModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddEvidence} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 block mb-1">Source Tool</label>
                  <input
                    type="text"
                    value={newEvidenceData.tool}
                    onChange={(e) => setNewEvidenceData({ ...newEvidenceData, tool: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono"
                    placeholder="e.g. dig, whois, nmap, curl"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Raw Output *</label>
                  <textarea
                    rows={6}
                    required
                    value={newEvidenceData.rawOutput}
                    onChange={(e) => setNewEvidenceData({ ...newEvidenceData, rawOutput: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono text-[11px]"
                    placeholder="Paste exact unmodified tool output..."
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Raw evidence is SHA-256 hashed and stored immutably to preserve chain of custody.
                  </p>
                </div>
                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddEvidenceModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-semibold hover:bg-cyan-500"
                  >
                    Attach & Verify Hash
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Finding */}
        {showNewFindingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">Log Normalized Finding</h3>
                <button onClick={() => setShowNewFindingModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateFinding} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 block mb-1">Finding Title *</label>
                  <input
                    type="text"
                    required
                    value={newFindingData.title}
                    onChange={(e) => setNewFindingData({ ...newFindingData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                    placeholder="e.g. Expired TLS Certificate on Port 443"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-300 block mb-1">Asset *</label>
                    <input
                      type="text"
                      required
                      value={newFindingData.asset}
                      onChange={(e) => setNewFindingData({ ...newFindingData, asset: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono"
                      placeholder="e.g. example.com"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1">Severity</label>
                    <select
                      value={newFindingData.severity}
                      onChange={(e) => setNewFindingData({ ...newFindingData, severity: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Source Tool</label>
                  <input
                    type="text"
                    value={newFindingData.sourceTool}
                    onChange={(e) => setNewFindingData({ ...newFindingData, sourceTool: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono"
                    placeholder="e.g. ssl, nmap, nikto"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={newFindingData.description}
                    onChange={(e) => setNewFindingData({ ...newFindingData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                  />
                </div>
                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewFindingModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-semibold hover:bg-cyan-500"
                  >
                    Save Finding
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Dossier Export */}
        {showDossierModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white font-mono">Compiled Case Dossier Export</h3>
                </div>
                <button onClick={() => setShowDossierModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {dossierLoading ? (
                <div className="py-12 text-center text-xs font-mono text-cyan-400">
                  Compiling persisted evidence, incidents, alerts, and findings...
                </div>
              ) : dossierData ? (
                <div className="space-y-4 text-xs font-mono">
                  <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Incidents</span>
                      <span className="text-cyan-400 font-bold text-sm">{dossierData.counts?.incidents || 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Evidence Items</span>
                      <span className="text-emerald-400 font-bold text-sm">{dossierData.counts?.evidence || 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Threat Hunts</span>
                      <span className="text-purple-400 font-bold text-sm">{dossierData.counts?.hunts || 0}</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-slate-400 block font-bold">Cryptographic Evidence Integrity Summary:</span>
                    <div className="flex items-center gap-4 text-[11px]">
                      <span className="text-emerald-400">Valid Hashes: {dossierData.integritySummary?.validHashes || 0}</span>
                      <span className="text-red-400">Tamper Detected: {dossierData.integritySummary?.tamperDetected || 0}</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-48 overflow-y-auto">
                    <pre className="text-[10px] text-slate-300 whitespace-pre-wrap">{JSON.stringify(dossierData, null, 2)}</pre>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-slate-500 text-xs">No dossier compiled.</div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowDossierModal(false)}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Link Incident */}
        {showLinkIncidentModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleLinkIncident} className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-xs font-mono">
              <h3 className="text-sm font-bold text-white pb-2 border-b border-slate-800">Link Incident to Case</h3>
              <div>
                <label className="block text-slate-400 mb-1">Incident ID</label>
                <input
                  required
                  type="text"
                  value={incidentToLink}
                  onChange={(e) => setIncidentToLink(e.target.value)}
                  placeholder="e.g. INC-..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowLinkIncidentModal(false)} className="px-3 py-1.5 bg-slate-800 rounded-xl text-slate-300">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-cyan-600 rounded-xl text-white font-bold">
                  Link
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MODAL: Link Hunt */}
        {showLinkHuntModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleLinkHunt} className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-xs font-mono">
              <h3 className="text-sm font-bold text-white pb-2 border-b border-slate-800">Link Threat Hunt to Case</h3>
              <div>
                <label className="block text-slate-400 mb-1">Hunt ID</label>
                <input
                  required
                  type="text"
                  value={huntToLink}
                  onChange={(e) => setHuntToLink(e.target.value)}
                  placeholder="e.g. HUNT-..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowLinkHuntModal(false)} className="px-3 py-1.5 bg-slate-800 rounded-xl text-slate-300">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-purple-600 rounded-xl text-white font-bold">
                  Link
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
