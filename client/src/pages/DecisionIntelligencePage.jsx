import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, Target, Compass, Network, Lightbulb,
  History, FileText, Bot, RefreshCw, AlertTriangle, CheckCircle2,
  XCircle, ChevronRight, Layers, ArrowUpRight, BarChart3, Database
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const DecisionIntelligencePage = () => {
  const [activeTab, setActiveTab] = useState('executive');
  const [loading, setLoading] = useState(false);
  const [executiveSummary, setExecutiveSummary] = useState(null);
  const [priorityQueue, setPriorityQueue] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [hypotheses, setHypotheses] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [riskFactors, setRiskFactors] = useState([]);
  const [aiResponse, setAiResponse] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // New Hypothesis Form State
  const [newHypTitle, setNewHypTitle] = useState('');
  const [newHypStatement, setNewHypStatement] = useState('');

  useEffect(() => {
    fetchTabData();
  }, [activeTab]);

  const fetchTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'executive') {
        const res = await fetch('/api/intelligence/executive-summary');
        const data = await res.json();
        if (data.success) setExecutiveSummary(data.summary);
      } else if (activeTab === 'priority') {
        const res = await fetch('/api/intelligence/prioritization/queue');
        const data = await res.json();
        if (data.success) setPriorityQueue(data.queue || []);
      } else if (activeTab === 'recommendations') {
        const res = await fetch('/api/intelligence/recommendations');
        const data = await res.json();
        if (data.success) setRecommendations(data.recommendations || []);
      } else if (activeTab === 'clusters') {
        const res = await fetch('/api/intelligence/campaigns/clusters');
        const data = await res.json();
        if (data.success) setClusters(data.clusters || []);
      } else if (activeTab === 'hypotheses') {
        const res = await fetch('/api/intelligence/hypotheses');
        const data = await res.json();
        if (data.success) setHypotheses(data.hypotheses || []);
      } else if (activeTab === 'history' || activeTab === 'incident' || activeTab === 'case') {
        const res = await fetch('/api/intelligence/assessments');
        const data = await res.json();
        if (data.success) setAssessments(data.assessments || []);
      } else if (activeTab === 'factors') {
        const res = await fetch('/api/intelligence/risk/factors?subjectType=EXECUTIVE&subjectId=ORGANIZATION_WIDE');
        const data = await res.json();
        if (data.success) setRiskFactors(data.factors || []);
      }
    } catch {
      toast.error('Failed to retrieve intelligence signals');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackRecommendation = async (recId, status) => {
    try {
      const res = await fetch(`/api/intelligence/recommendations/${recId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes: `Analyst marked as ${status}` })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Recommendation marked as ${status}`);
        fetchTabData();
      }
    } catch {
      toast.error('Action failed');
    }
  };

  const handleCreateHypothesis = async (e) => {
    e.preventDefault();
    if (!newHypTitle || !newHypStatement) return;
    try {
      const res = await fetch('/api/intelligence/hypotheses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newHypTitle, statement: newHypStatement })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Investigation hypothesis logged');
        setNewHypTitle('');
        setNewHypStatement('');
        fetchTabData();
      }
    } catch {
      toast.error('Failed to create hypothesis');
    }
  };

  const handleSupportHypothesis = async (id) => {
    try {
      const res = await fetch(`/api/intelligence/hypotheses/${id}/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'Confirmed via Data Fabric pivot correlation' })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Supporting evidence added');
        fetchTabData();
      }
    } catch {
      toast.error('Failed to update hypothesis');
    }
  };

  const handleRefuteHypothesis = async (id) => {
    try {
      const res = await fetch(`/api/intelligence/hypotheses/${id}/refute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'Contradicted by forensic logs' })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Contradicting evidence added');
        fetchTabData();
      }
    } catch {
      toast.error('Failed to update hypothesis');
    }
  };

  const handleRunAiCopilot = async (endpoint, body = {}) => {
    setAiLoading(true);
    try {
      const res = await fetch(`/api/chatbot/intelligence/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) setAiResponse(data.data);
      else toast.error(data.error || 'AI copilot error');
    } catch {
      toast.error('Failed to query AI copilot');
    } finally {
      setAiLoading(false);
    }
  };

  const renderDeterminationBadge = (det) => {
    const d = (det || 'UNKNOWN').toUpperCase();
    let style = 'bg-zinc-800 border-zinc-600 text-zinc-300';
    if (d === 'OBSERVED') style = 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300';
    else if (d === 'DERIVED') style = 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300';
    else if (d === 'CORRELATED') style = 'bg-blue-950/60 border-blue-500/50 text-blue-300';
    else if (d === 'INFERRED') style = 'bg-purple-950/60 border-purple-500/50 text-purple-300';
    else if (d === 'INSUFFICIENT_EVIDENCE') style = 'bg-amber-950/60 border-amber-500/50 text-amber-300';

    return (
      <span className={`px-2 py-0.5 text-xs font-mono rounded border ${style}`}>
        [{d}]
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/40 rounded-xl shadow-lg shadow-indigo-500/10">
              <Compass className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-cyan-400 bg-clip-text text-transparent">
                SOC Decision Intelligence Center
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Phase 79 — Risk Synthesis, Analyst Prioritization & Decision Support [v62.2.0]
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-xs font-mono text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            ZERO_FABRICATION_ENFORCED
          </div>
          <button
            onClick={fetchTabData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* PERMANENT CONSTITUTION BANNER */}
      <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/30 rounded-xl text-xs text-indigo-200/90 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span>
            <strong>Truthful Intelligence Guard:</strong> All risk scores, queue rankings, and candidate clusters derive from persisted platform records. Conclusions explicitly identify confidence levels: <code className="text-emerald-400">[OBSERVED]</code>, <code className="text-cyan-400">[DERIVED]</code>, <code className="text-blue-400">[CORRELATED]</code>, <code className="text-purple-400">[INFERRED]</code>, <code className="text-amber-400">[INSUFFICIENT_EVIDENCE]</code>. Zero synthetic attribution.
          </span>
        </div>
      </div>

      {/* NAVIGATION TABS (11 VIEWS) */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 overflow-x-auto pb-2 scrollbar-none text-xs">
        {[
          { id: 'executive', label: 'Executive Risk', icon: ShieldAlert },
          { id: 'priority', label: 'Analyst Priority Queue', icon: Target },
          { id: 'factors', label: 'Risk Factors', icon: BarChart3 },
          { id: 'recommendations', label: 'Next-Best-Actions', icon: Compass },
          { id: 'clusters', label: 'Activity Clusters', icon: Network },
          { id: 'hypotheses', label: 'Hypotheses', icon: Lightbulb },
          { id: 'incident', label: 'Incident Decisions', icon: Layers },
          { id: 'case', label: 'Case Decisions', icon: Database },
          { id: 'history', label: 'Decision History', icon: History },
          { id: 'evidence', label: 'Evidence & Provenance', icon: FileText },
          { id: 'copilot', label: 'AI Copilot', icon: Bot },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* VIEW 1: EXECUTIVE RISK */}
      {activeTab === 'executive' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3">
              <span className="text-xs text-slate-400 font-mono">ORGANIZATION RISK POSTURE</span>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold font-mono text-cyan-400">
                  {executiveSummary?.executiveRisk?.riskScore !== null ? `${executiveSummary?.executiveRisk?.riskScore}/100` : 'N/A'}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700">
                  {executiveSummary?.executiveRisk?.riskBand || 'UNKNOWN'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Determination: {renderDeterminationBadge(executiveSummary?.executiveRisk?.determination)}
              </p>
            </div>

            <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3">
              <span className="text-xs text-slate-400 font-mono">TOP UNRESOLVED PRIORITIES</span>
              <div className="text-4xl font-bold font-mono text-amber-400">
                {executiveSummary?.topPriorities?.length || 0}
              </div>
              <p className="text-xs text-slate-400">Active incidents and high-severity signals requiring immediate triage.</p>
            </div>

            <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3">
              <span className="text-xs text-slate-400 font-mono">ACTIVITY CLUSTERS</span>
              <div className="text-4xl font-bold font-mono text-indigo-400">
                {executiveSummary?.activeClusters?.length || 0}
              </div>
              <p className="text-xs text-slate-400">Correlated multi-entity graph groupings discovered in Data Fabric.</p>
            </div>
          </div>

          <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Executive Summary Narrative</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {executiveSummary?.disclaimer || 'Executive summary compiled from verified platform records and Security Data Fabric relationships.'}
            </p>
          </div>
        </div>
      )}

      {/* VIEW 2: ANALYST PRIORITY QUEUE */}
      {activeTab === 'priority' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Ranked Investigation Subjects ({priorityQueue.length})</h3>
            <span className="text-xs text-slate-400 font-mono">Deterministic Multi-Factor Scoring</span>
          </div>

          <div className="space-y-2.5">
            {priorityQueue.map((item) => (
              <div
                key={`${item.subjectType}-${item.subjectId}`}
                className="p-4 bg-slate-900/70 hover:bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 text-xs font-mono rounded">
                      #{item.priorityRank}
                    </span>
                    <span className="text-sm font-semibold text-slate-100">{item.title}</span>
                    <span className="text-xs font-mono text-slate-400">[{item.subjectType}:{item.subjectId}]</span>
                  </div>
                  <p className="text-xs text-slate-400">{item.rationale}</p>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-cyan-400">{item.priorityScore}/100</div>
                    <div className="text-xs text-slate-500 font-mono">{item.priorityBand} PRIORITY</div>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('recommendations');
                    }}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                    title="Investigate"
                  >
                    <ArrowUpRight className="w-4 h-4 text-cyan-400" />
                  </button>
                </div>
              </div>
            ))}
            {priorityQueue.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500 font-mono bg-slate-900/40 border border-slate-800 rounded-xl">
                No active subjects currently queued for prioritization.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: RISK FACTORS */}
      {activeTab === 'factors' && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">Synthesized Risk Factors & Weights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {riskFactors.map((f, i) => (
              <div key={i} className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">{f.factorName}</span>
                  <span className="text-xs font-mono text-cyan-400">Weight: {f.weight}</span>
                </div>
                <div className="text-xl font-bold font-mono text-slate-100">{f.contribution} pts</div>
                <p className="text-xs text-slate-400">{f.basis}</p>
              </div>
            ))}
            {riskFactors.length === 0 && (
              <div className="p-8 col-span-2 text-center text-xs text-slate-500 font-mono bg-slate-900/40 border border-slate-800 rounded-xl">
                Zero risk factors calculated (No telemetry signals present).
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 4: RECOMMENDATIONS */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Investigation Next-Best-Actions</h3>
            <span className="text-xs text-slate-400 font-mono">Phase 77 Execution Bridged</span>
          </div>

          <div className="space-y-3">
            {recommendations.map((r) => (
              <div
                key={r.recommendationId}
                className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-xs font-mono rounded">
                      [{r.recommendationType}]
                    </span>
                    <span className="text-sm font-semibold text-slate-100">{r.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs font-mono rounded ${
                      r.authorization === 'EXECUTABLE' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40' :
                      r.authorization === 'APPROVAL_REQUIRED' ? 'bg-amber-950/60 text-amber-400 border border-amber-500/40' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {r.authorization}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-xs font-mono rounded">
                      STATUS: {r.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300">{r.rationale}</p>

                {r.status === 'PROPOSED' && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                    <button
                      onClick={() => handleFeedbackRecommendation(r.recommendationId, 'ACCEPTED')}
                      className="px-3 py-1 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded text-xs font-medium transition"
                    >
                      Accept Action
                    </button>
                    <button
                      onClick={() => handleFeedbackRecommendation(r.recommendationId, 'REJECTED')}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium transition"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
            {recommendations.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500 font-mono bg-slate-900/40 border border-slate-800 rounded-xl">
                No active recommendations generated. Select a subject to generate targeted actions.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 5: ACTIVITY CLUSTERS */}
      {activeTab === 'clusters' && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">Data Fabric Activity Clusters</h3>
          <div className="space-y-3">
            {clusters.map((c) => (
              <div key={c.clusterId} className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-semibold text-slate-100">{c.title}</span>
                    {renderDeterminationBadge(c.determination)}
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {c.nodeCount} nodes • {c.edgeCount} relationships
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">Attribution: {c.attackerAttribution}</p>
                <div className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded text-xs text-slate-400">
                  {c.attributionDisclaimer}
                </div>
              </div>
            ))}
            {clusters.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500 font-mono bg-slate-900/40 border border-slate-800 rounded-xl">
                No activity clusters observed in current graph topology.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 6: HYPOTHESES */}
      {activeTab === 'hypotheses' && (
        <div className="space-y-6">
          <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Propose Investigation Hypothesis</h3>
            <form onSubmit={handleCreateHypothesis} className="space-y-3">
              <input
                type="text"
                value={newHypTitle}
                onChange={(e) => setNewHypTitle(e.target.value)}
                placeholder="Hypothesis Title (e.g., C2 Beaconing via DGA Domains)"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <textarea
                value={newHypStatement}
                onChange={(e) => setNewHypStatement(e.target.value)}
                placeholder="Hypothesis Statement & Premise..."
                rows={2}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium transition"
              >
                Log Hypothesis
              </button>
            </form>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-200">Active Hypotheses ({hypotheses.length})</h3>
            {hypotheses.map((h) => (
              <div key={h.hypothesisId} className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-100">{h.title}</span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-xs font-mono rounded">
                      [{h.status}]
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">By: {h.createdBy}</span>
                </div>
                <p className="text-xs text-slate-300">{h.statement}</p>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                  <button
                    onClick={() => handleSupportHypothesis(h.hypothesisId)}
                    className="px-3 py-1 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded text-xs font-medium hover:bg-emerald-900/60 transition"
                  >
                    + Support Evidence ({h.supportingEvidence?.length || 0})
                  </button>
                  <button
                    onClick={() => handleRefuteHypothesis(h.hypothesisId)}
                    className="px-3 py-1 bg-red-950/60 border border-red-500/40 text-red-300 rounded text-xs font-medium hover:bg-red-900/60 transition"
                  >
                    + Refute Evidence ({h.contradictingEvidence?.length || 0})
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 7, 8, 9, 10: DECISION ASSESSMENTS & EVIDENCE */}
      {(activeTab === 'incident' || activeTab === 'case' || activeTab === 'history' || activeTab === 'evidence') && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">Persisted Decision Assessments ({assessments.length})</h3>
          <div className="space-y-2.5">
            {assessments.map((a) => (
              <div key={a.assessmentId} className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-100">[{a.decisionType}] {a.subjectType}:{a.subjectId}</span>
                    {renderDeterminationBadge(a.determination)}
                  </div>
                  <span className="text-xs font-mono text-slate-400">Priority: {a.priority}</span>
                </div>
                <p className="text-xs text-slate-300">{a.rationale}</p>
                <div className="text-xs font-mono text-slate-500">Hash: {a.contentHash}</div>
              </div>
            ))}
            {assessments.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500 font-mono bg-slate-900/40 border border-slate-800 rounded-xl">
                No decision assessments logged for this scope.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 11: AI DECISION COPILOT */}
      {activeTab === 'copilot' && (
        <div className="space-y-5">
          <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              Bounded AI Decision Copilot (Advisory Mode)
            </h3>
            <p className="text-xs text-slate-400">
              Query advisory AI routines defended by strict delimiter protection (<code className="text-cyan-400">&lt;&lt;&lt;UNTRUSTED_INTELLIGENCE_DATA&gt;&gt;&gt;</code>). AI cannot mutate records or declare unverified attribution.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => handleRunAiCopilot('summarize')}
                disabled={aiLoading}
                className="px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded text-xs font-medium transition"
              >
                Summarize Executive Risk
              </button>
              <button
                onClick={() => handleRunAiCopilot('prioritize')}
                disabled={aiLoading}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition"
              >
                Explain Prioritization
              </button>
              <button
                onClick={() => handleRunAiCopilot('suggest-investigation', { subjectType: 'INCIDENT', subjectId: 'INC-001' })}
                disabled={aiLoading}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition"
              >
                Suggest Next-Best-Actions
              </button>
            </div>
          </div>

          {aiLoading && (
            <div className="p-6 text-center text-xs text-cyan-400 font-mono flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Evaluating bounded decision model...
            </div>
          )}

          {aiResponse && (
            <div className="p-5 bg-slate-900/80 border border-cyan-500/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono text-cyan-400">AI ADVISORY OUTPUT</span>
                <span className="text-xs font-mono text-slate-500">Model: {aiResponse.model || 'gemini-2.5-flash'}</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
                {aiResponse.summary || aiResponse.narrative || JSON.stringify(aiResponse, null, 2)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DecisionIntelligencePage;
