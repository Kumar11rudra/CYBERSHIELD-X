import React, { useState, useEffect } from 'react';
import {
  Zap, ShieldCheck, GitPullRequest, CheckCircle2, XCircle, AlertTriangle,
  FileText, Activity, RefreshCw, Play, Lock, ChevronRight, CornerUpLeft,
  Bot, Clock, Database, Check, Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AutomationCenterPage = () => {
  const [activeTab, setActiveTab] = useState('validations');
  const [loading, setLoading] = useState(false);
  const [posture, setPosture] = useState(null);
  const [validations, setValidations] = useState([]);
  const [drifts, setDrifts] = useState([]);
  const [playbooks, setPlaybooks] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [health, setHealth] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'validations') {
        const res = await fetch('/api/automation/validations/posture');
        const data = await res.json();
        if (data.success) setPosture(data.posture);

        const histRes = await fetch('/api/automation/validations/history');
        const histData = await histRes.json();
        if (histData.success) setValidations(histData.validations);
      } else if (activeTab === 'drift') {
        const res = await fetch('/api/automation/drift');
        const data = await res.json();
        if (data.success) setDrifts(data.drifts);
      } else if (activeTab === 'playbooks' || activeTab === 'approvals') {
        const res = await fetch('/api/automation/playbooks');
        const data = await res.json();
        if (data.success) setPlaybooks(data.playbooks);
      } else if (activeTab === 'executions' || activeTab === 'remediation' || activeTab === 'evidence') {
        const res = await fetch('/api/automation/executions');
        const data = await res.json();
        if (data.success) setExecutions(data.executions);
      } else if (activeTab === 'health') {
        const res = await fetch('/api/automation/health');
        const data = await res.json();
        if (data.success) setHealth(data.health);
      }
    } catch (err) {
      toast.error('Failed to load automation data');
    } finally {
      setLoading(false);
    }
  };

  const runValidationProbes = async () => {
    try {
      const res = await fetch('/api/automation/validations/run', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success('Control validation completed');
        fetchData();
      }
    } catch (err) {
      toast.error('Validation probe failed');
    }
  };

  const runDriftDetection = async () => {
    try {
      const res = await fetch('/api/automation/drift/run', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(`Drift scan complete. Detected: ${data.result.totalDriftsDetected}`);
        fetchData();
      }
    } catch (err) {
      toast.error('Drift scan failed');
    }
  };

  const fetchAiCopilot = async (endpoint, body = {}) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/chatbot/automation/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setAiAnalysis(data.data);
        toast.success('AI copilot advisory ready');
      }
    } catch (err) {
      toast.error('AI copilot request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <Zap className="w-8 h-8 text-cyan-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Automation Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800">
              v62.0.0 Certified
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Enterprise Security Operations Automation, Continuous Control Validation & Approval-Aware Drift Remediation
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={runValidationProbes}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg border border-slate-700 text-sm font-medium transition"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Validate Controls</span>
          </button>
          <button
            onClick={runDriftDetection}
            className="flex items-center space-x-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Scan Drift</span>
          </button>
        </div>
      </div>

      {/* Operational Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-800 space-x-2 pb-2">
        {[
          { id: 'validations', label: 'Control Validation', icon: ShieldCheck },
          { id: 'drift', label: 'Security Drift', icon: AlertTriangle },
          { id: 'playbooks', label: 'Playbook Library', icon: FileText },
          { id: 'approvals', label: 'Approvals', icon: GitPullRequest },
          { id: 'executions', label: 'Executions', icon: Play },
          { id: 'remediation', label: 'Remediation', icon: CheckCircle2 },
          { id: 'evidence', label: 'Evidence', icon: Database },
          { id: 'health', label: 'Automation Health', icon: Activity },
          { id: 'copilot', label: 'AI Copilot', icon: Bot },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex items-center justify-center space-x-3">
          <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
          <span>Synchronizing telemetry...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: Control Validation */}
          {activeTab === 'validations' && (
            <div className="space-y-6">
              {posture && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                    <p className="text-slate-400 text-xs font-medium uppercase">Total Controls Evaluated</p>
                    <p className="text-3xl font-bold text-white mt-1">{posture.totalEvaluated}</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                    <p className="text-slate-400 text-xs font-medium uppercase">Passed Controls</p>
                    <p className="text-3xl font-bold text-emerald-400 mt-1">{posture.pass}</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                    <p className="text-slate-400 text-xs font-medium uppercase">Failed Controls</p>
                    <p className="text-3xl font-bold text-rose-400 mt-1">{posture.fail}</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                    <p className="text-slate-400 text-xs font-medium uppercase">Not Configured / Unknown</p>
                    <p className="text-3xl font-bold text-amber-400 mt-1">{posture.unknown}</p>
                  </div>
                </div>
              )}

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Control Validation History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
                      <tr>
                        <th className="p-3">Validation ID</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Source → Target</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Evaluated At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {validations.map((v) => (
                        <tr key={v.validationId} className="hover:bg-slate-850">
                          <td className="p-3 font-mono text-cyan-400">{v.validationId}</td>
                          <td className="p-3">{v.controlType}</td>
                          <td className="p-3 text-slate-400">{v.source} → {v.target}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              v.status === 'PASS' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                              v.status === 'FAIL' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                              'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}>
                              {v.status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400">{new Date(v.evaluatedAt).toLocaleString()}</td>
                        </tr>
                      ))}
                      {validations.length === 0 && (
                        <tr>
                          <td colSpan="5" className="p-6 text-center text-slate-500">No control validations recorded yet. Click "Validate Controls" to execute live evaluation.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Security Drift */}
          {activeTab === 'drift' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Active Security Configuration Drift</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="p-3">Drift ID</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Source</th>
                      <th className="p-3">Severity</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Detected At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {drifts.map((d) => (
                      <tr key={d.driftId} className="hover:bg-slate-850">
                        <td className="p-3 font-mono text-amber-400">{d.driftId}</td>
                        <td className="p-3">{d.driftType}</td>
                        <td className="p-3 text-slate-400">{d.sourceRecord}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            d.severity === 'HIGH' || d.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-400' : 'bg-amber-950 text-amber-400'
                          }`}>
                            {d.severity}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-200">{d.status}</td>
                        <td className="p-3 text-slate-400">{new Date(d.detectedAt).toLocaleString()}</td>
                      </tr>
                    ))}
                    {drifts.length === 0 && (
                      <tr>
                        <td colSpan="6" className="p-6 text-center text-slate-500">No active security drift detected. Configuration aligns with baseline.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Playbook Library */}
          {activeTab === 'playbooks' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Automation Playbook Library</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {playbooks.map((pb) => (
                  <div key={pb.playbookId} className="bg-slate-950 border border-slate-800 p-5 rounded-lg space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-white text-base">{pb.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{pb.playbookId} • v{pb.version}</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                        pb.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        pb.status === 'APPROVED' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {pb.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">{pb.description}</p>
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                      <span>Required Role: {pb.requiredRole}</span>
                      <span>Steps: {pb.steps?.length || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Approvals */}
          {activeTab === 'approvals' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Playbook Approval Queue</h3>
              <div className="space-y-4">
                {playbooks.filter(p => p.status === 'REVIEW' || p.status === 'DRAFT').map(pb => (
                  <div key={pb.playbookId} className="bg-slate-950 border border-slate-800 p-4 rounded-lg flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-semibold">{pb.name}</h4>
                      <p className="text-xs text-slate-400">ID: {pb.playbookId} • Category: {pb.category} • Status: {pb.status}</p>
                    </div>
                    <button
                      onClick={async () => {
                        await fetch(`/api/automation/playbooks/${pb.playbookId}/approve`, { method: 'POST' });
                        toast.success('Playbook approved');
                        fetchData();
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition"
                    >
                      Approve & Bind SHA-256
                    </button>
                  </div>
                ))}
                {playbooks.filter(p => p.status === 'REVIEW' || p.status === 'DRAFT').length === 0 && (
                  <p className="text-center text-slate-500 py-6">No playbooks currently pending approval.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: Executions */}
          {activeTab === 'executions' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Automation Execution Log</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="p-3">Execution ID</th>
                      <th className="p-3">Playbook</th>
                      <th className="p-3">Trigger</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Started At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {executions.map((e) => (
                      <tr key={e.executionId} className="hover:bg-slate-850">
                        <td className="p-3 font-mono text-cyan-400">{e.executionId}</td>
                        <td className="p-3">{e.playbookId}</td>
                        <td className="p-3">{e.triggerType}</td>
                        <td className="p-3 font-semibold">{e.status}</td>
                        <td className="p-3 text-slate-400">{e.startedAt ? new Date(e.startedAt).toLocaleString() : 'N/A'}</td>
                      </tr>
                    ))}
                    {executions.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-6 text-center text-slate-500">No automation executions recorded.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: Remediation */}
          {activeTab === 'remediation' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Post-Action Remediation Verification</h3>
              <p className="text-sm text-slate-400">
                Server-side post-action verification ensures no drift item is marked REMEDIATED until expected state is confirmed on the target object.
              </p>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg text-xs text-slate-300 space-y-2">
                <p className="font-semibold text-cyan-400">Verification Invariants:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li>Deterministic server-side re-query of underlying target object.</li>
                  <li>Truthful status report: REMEDIATED only on exact match; REMEDIATION_FAILED otherwise.</li>
                  <li>Supports deterministic inverse rollback for actions with inverse steps.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 7: Evidence */}
          {activeTab === 'evidence' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Execution Evidence & Cryptographic References</h3>
              <div className="space-y-3">
                {executions.map(e => (
                  <div key={e.executionId} className="bg-slate-950 border border-slate-800 p-4 rounded-lg">
                    <p className="text-sm font-semibold text-cyan-400">{e.executionId} • IdempotencyKey: {e.idempotencyKey}</p>
                    <div className="mt-2 text-xs font-mono text-slate-400 space-y-1">
                      {e.evidenceReferences?.map((ref, idx) => (
                        <p key={idx}>Ref: {ref}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: Automation Health */}
          {activeTab === 'health' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              <h3 className="text-lg font-semibold text-white">Automation Engine Health Telemetry</h3>
              {health && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <p className="text-xs text-slate-400 uppercase">Success Rate</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">{health.successRate}%</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <p className="text-xs text-slate-400 uppercase">Total Executions</p>
                    <p className="text-2xl font-bold text-white mt-1">{health.totalExecutions}</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <p className="text-xs text-slate-400 uppercase">Failed / Rolled Back</p>
                    <p className="text-2xl font-bold text-rose-400 mt-1">{health.failed + health.rolledBack}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 9: AI Copilot */}
          {activeTab === 'copilot' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                    <Bot className="w-5 h-5 text-cyan-400" />
                    <span>Bounded AI Automation Copilot</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Advisory guidance enclosed in UNTRUSTED_AUTOMATION_DATA boundaries.</p>
                </div>
                <button
                  onClick={() => fetchAiCopilot('summarize')}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold transition"
                >
                  Generate Posture Summary
                </button>
              </div>

              {aiAnalysis && (
                <div className="bg-slate-950 border border-cyan-900/50 p-5 rounded-lg space-y-3">
                  <h4 className="font-bold text-cyan-400 text-sm">Advisory Analysis</h4>
                  <p className="text-sm text-slate-300">{aiAnalysis.summary}</p>
                  <div className="p-3 bg-slate-900 rounded text-xs text-slate-400 font-mono">
                    {aiAnalysis.aiBoundary?.disclaimer}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AutomationCenterPage;
