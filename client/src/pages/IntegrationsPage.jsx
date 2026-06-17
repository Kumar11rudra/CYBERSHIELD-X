import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';

const INTEGRATION_TYPES = [
  { type: 'Slack', icon: '💬', desc: 'Send rich Block Kit notifications to channels.' },
  { type: 'Teams', icon: '👥', desc: 'Send Adaptive Cards to Microsoft Teams channels.' },
  { type: 'Jira', icon: '🎫', desc: 'Automatically file bugs in Atlassian Jira Cloud.' },
  { type: 'GitHub', icon: '💻', desc: 'Create code issues in GitHub repositories.' },
  { type: 'Webhook', icon: '⚓', desc: 'Post signed JSON alerts to custom URL endpoints.' },
];

const PLAYBOOK_EVENTS = [
  { event: 'vulnerability_detected', label: 'Vulnerability Detected' },
  { event: 'sla_breached', label: 'SLA Deadline Breached' },
  { event: 'critical_ioc', label: 'Critical IOC Correlation' },
  { event: 'ssl_expired', label: 'SSL Certificate Expired' },
  { event: 'scan_completed', label: 'Scan Completed' },
  { event: 'manual', label: 'Manual Trigger Only' },
];

const ACTION_TYPES = [
  { type: 'send_slack', label: '💬 Send Slack Alert' },
  { type: 'send_teams', label: '👥 Send Teams Alert' },
  { type: 'create_jira', label: '🎫 Create Jira Issue' },
  { type: 'create_github_issue', label: '💻 Create GitHub Issue' },
  { type: 'generic_webhook', label: '⚓ Dispatch Generic Webhook' },
  { type: 'send_email', label: '📧 Send Notification Email' },
  { type: 'create_notification', label: '🔔 Create Local Alert' },
  { type: 'create_audit_entry', label: '📝 Create Audit Entry' },
  { type: 'ai_remediation', label: '🧠 Generate AI Remediation Plan' },
];

const HEALTH_COLORS = {
  Healthy: 'text-green-400 bg-green-500/10 border-green-500/30',
  Warning: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  Failed: 'text-red-400 bg-red-500/10 border-red-500/30',
  Unknown: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
};

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState('integrations');
  const [loading, setLoading] = useState(true);

  // Lists
  const [integrations, setIntegrations] = useState([]);
  const [playbooks, setPlaybooks] = useState([]);
  const [runs, setRuns] = useState([]);

  // Modals & Editing
  const [editingConfig, setEditingConfig] = useState(null);
  const [editingPlaybook, setEditingPlaybook] = useState(null);
  const [testingId, setTestingId] = useState(null);
  const [seeding, setSeeding] = useState(false);

  // Load Data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const orgId = localStorage.getItem('activeOrgId');
      const headers = orgId ? { 'x-organization-id': orgId } : {};

      const [intRes, pbRes, runsRes] = await Promise.all([
        api.get('/integrations', { headers }),
        api.get('/playbooks', { headers }),
        api.get('/playbooks/runs', { headers }),
      ]);

      setIntegrations(intRes.data || []);
      setPlaybooks(pbRes.data || []);
      setRuns(runsRes.data || []);
    } catch (err) {
      console.error('Failed fetching SOAR data:', err);
      toast.error('Could not load integrations context.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Seeding default templates
  const handleSeedTemplates = async () => {
    setSeeding(true);
    try {
      const orgId = localStorage.getItem('activeOrgId');
      const headers = orgId ? { 'x-organization-id': orgId } : {};
      await api.post('/playbooks/seed-templates', {}, { headers });
      toast.success('Default playbooks seeded successfully!');
      loadData();
    } catch (err) {
      toast.error('Failed seeding templates.');
    } finally {
      setSeeding(false);
    }
  };

  // Connection Testing
  const handleTestConnection = async (id) => {
    setTestingId(id);
    try {
      const orgId = localStorage.getItem('activeOrgId');
      const headers = orgId ? { 'x-organization-id': orgId } : {};
      const res = await api.post('/integrations/test', { id }, { headers });
      if (res.data.success) {
        toast.success('Connection test succeeded!');
      } else {
        toast.error(`Test failed: ${res.data.error}`);
      }
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Connection failed.');
    } finally {
      setTestingId(null);
    }
  };

  // Playbook CRUD operations
  const handleSavePlaybook = async (e) => {
    e.preventDefault();
    try {
      const orgId = localStorage.getItem('activeOrgId');
      const headers = orgId ? { 'x-organization-id': orgId } : {};

      if (editingPlaybook._id) {
        await api.put(`/playbooks/${editingPlaybook._id}`, editingPlaybook, { headers });
        toast.success('Playbook upgraded successfully.');
      } else {
        await api.post('/playbooks', editingPlaybook, { headers });
        toast.success('Playbook deployed.');
      }
      setEditingPlaybook(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed saving playbook.');
    }
  };

  const handleDeletePlaybook = async (id) => {
    if (!window.confirm('Delete this playbook automation?')) return;
    try {
      const orgId = localStorage.getItem('activeOrgId');
      const headers = orgId ? { 'x-organization-id': orgId } : {};
      await api.delete(`/playbooks/${id}`, { headers });
      toast.success('Playbook deprecated.');
      loadData();
    } catch (err) {
      toast.error('Failed to deprecate playbook.');
    }
  };

  const handleTogglePlaybook = async (pb) => {
    try {
      const orgId = localStorage.getItem('activeOrgId');
      const headers = orgId ? { 'x-organization-id': orgId } : {};
      await api.put(`/playbooks/${pb._id}`, { ...pb, enabled: !pb.enabled }, { headers });
      toast.success(`Playbook ${!pb.enabled ? 'activated' : 'deactivated'}.`);
      loadData();
    } catch (err) {
      toast.error('Failed to toggle playbook.');
    }
  };

  const handleManualTrigger = async (id) => {
    try {
      const orgId = localStorage.getItem('activeOrgId');
      const headers = orgId ? { 'x-organization-id': orgId } : {};
      await api.post(`/playbooks/${id}/trigger`, {}, { headers });
      toast.success('Manual trigger execution scheduled.');
      loadData();
    } catch (err) {
      toast.error('Manual trigger failed.');
    }
  };

  // Integration Config CRUD operations
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      const orgId = localStorage.getItem('activeOrgId');
      const headers = orgId ? { 'x-organization-id': orgId } : {};

      if (editingConfig._id) {
        await api.put(`/integrations/${editingConfig._id}`, editingConfig, { headers });
        toast.success('Connector updated.');
      } else {
        await api.post('/integrations', editingConfig, { headers });
        toast.success('Connector deployed.');
      }
      setEditingConfig(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed saving integration.');
    }
  };

  const handleDeleteConfig = async (id) => {
    if (!window.confirm('Deprovision this integration connector?')) return;
    try {
      const orgId = localStorage.getItem('activeOrgId');
      const headers = orgId ? { 'x-organization-id': orgId } : {};
      await api.delete(`/integrations/${id}`, { headers });
      toast.success('Connector deprovisioned.');
      loadData();
    } catch (err) {
      toast.error('Failed to deprovision connector.');
    }
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-8 font-mono text-[#e0e6ff] space-y-6 relative z-10">
      {/* Page Header */}
      <div className="border border-[#00bfff]/20 bg-[#070f21]/80 rounded-xl p-5 shadow-[0_0_24px_rgba(0,191,255,0.06)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-black tracking-widest text-white uppercase flex items-center gap-2">
              <span>⚡</span> CyberShield X <span className="text-[#00bfff]">SOAR Engine</span>
            </h1>
            <p className="text-[10px] text-[#5a7fa8] mt-1 uppercase tracking-wider">
              Automated Workflows · External Connections · Health Tracking
            </p>
          </div>
          <div className="flex gap-2">
            {['integrations', 'playbooks', 'runs'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest border transition-all
                  ${activeTab === tab
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                    : 'border-[#224466]/40 text-gray-500 hover:text-white hover:border-white/20'
                  }`}
              >
                {tab === 'integrations' ? '🔌 Integrations' : tab === 'playbooks' ? '⚙️ Playbooks' : '📝 Automation Runs'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-10 h-10 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-xs text-cyan-400/60 uppercase tracking-widest">Compiling Automation Systems...</p>
        </div>
      ) : (
        <>
          {/* ============================================================ */}
          {/* TAB 1: INTEGRATION CONNECTORS                                */}
          {/* ============================================================ */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Active Connectors</h2>
                <div className="flex gap-2">
                  {INTEGRATION_TYPES.map(t => (
                    <button key={t.type} onClick={() => setEditingConfig({ type: t.type, name: '', config: {}, active: true })}
                      className="px-2 py-1 bg-cyan-700/20 hover:bg-cyan-600/20 border border-cyan-500/30 rounded text-[9px] font-bold uppercase text-cyan-400 tracking-wider">
                      + Add {t.type}
                    </button>
                  ))}
                </div>
              </div>

              {integrations.length === 0 ? (
                <div className="border border-dashed border-[#224466]/30 rounded-xl p-16 text-center space-y-4">
                  <p className="text-xs text-gray-500 uppercase tracking-widest">No integration configurations configured.</p>
                  <p className="text-[10px] text-gray-600">Provision a connector above to feed ticketing, alerts and AI reports directly to Jira, GitHub, Slack or Teams.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {integrations.map(config => {
                    const healthClass = HEALTH_COLORS[config.healthStatus] || HEALTH_COLORS.Unknown;
                    return (
                      <div key={config._id} className="border border-[#224466]/40 bg-[#070f21]/70 rounded-xl p-5 space-y-4 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-2xl">{INTEGRATION_TYPES.find(i => i.type === config.type)?.icon || '🔌'}</span>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded border font-bold uppercase ${healthClass}`}>
                              {config.healthStatus || 'Unknown'}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-xs font-black text-white">{config.name}</h3>
                            <p className="text-[9px] text-cyan-400 mt-0.5 font-mono">{config.type}</p>
                          </div>
                          {config.lastError && (
                            <p className="text-[8px] text-red-400 bg-red-950/20 border border-red-900/30 rounded p-1.5 font-mono truncate">
                              Err: {config.lastError}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2 pt-4 border-t border-[#224466]/20">
                          <div className="flex justify-between text-[8px] text-gray-600 uppercase font-mono">
                            <span>Last Test:</span>
                            <span>{config.lastTestedAt ? new Date(config.lastTestedAt).toLocaleDateString() : 'Never'}</span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleTestConnection(config._id)} disabled={testingId === config._id}
                              className="flex-1 px-2.5 py-1.5 bg-black/40 border border-[#224466]/60 hover:border-[#00bfff]/40 rounded text-[9px] font-bold uppercase text-gray-400 hover:text-white disabled:opacity-40 transition-all">
                              {testingId === config._id ? 'Testing...' : '🔌 Test'}
                            </button>
                            <button onClick={() => setEditingConfig(config)}
                              className="flex-1 px-2.5 py-1.5 bg-[#00bfff]/10 hover:bg-[#00bfff]/20 border border-[#00bfff]/30 rounded text-[9px] font-bold uppercase text-cyan-400 transition-all">
                              ✏ Edit
                            </button>
                            <button onClick={() => handleDeleteConfig(config._id)}
                              className="px-2.5 py-1.5 border border-red-500/30 hover:bg-red-500/10 rounded text-[9px] text-red-400 transition-all">
                              🗑
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: AUTOMATION PLAYBOOKS                                  */}
          {/* ============================================================ */}
          {activeTab === 'playbooks' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Workflows & Playbooks</h2>
                <div className="flex gap-2">
                  <button onClick={handleSeedTemplates} disabled={seeding}
                    className="px-3 py-1.5 bg-yellow-700/20 hover:bg-yellow-600/20 border border-yellow-500/30 rounded text-[10px] font-bold uppercase text-yellow-400 tracking-widest disabled:opacity-50">
                    {seeding ? 'Seeding...' : '💡 Seed Defaults'}
                  </button>
                  <button onClick={() => setEditingPlaybook({ name: '', description: '', enabled: true, trigger: { event: 'vulnerability_detected', conditions: [] }, actions: [{ type: 'create_notification', config: {}, order: 0 }] })}
                    className="px-3 py-1.5 bg-cyan-700/20 hover:bg-cyan-600/20 border border-cyan-500/30 rounded text-[10px] font-bold uppercase text-cyan-400 tracking-widest">
                    + Create Playbook
                  </button>
                </div>
              </div>

              {playbooks.length === 0 ? (
                <div className="border border-dashed border-[#224466]/30 rounded-xl p-16 text-center space-y-4">
                  <p className="text-xs text-gray-500 uppercase tracking-widest">No automation playbooks configured.</p>
                  <p className="text-[10px] text-gray-600">Import templates or build a custom playbook to trigger ticketing, alerts, or AI remediation on security events.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {playbooks.map(pb => (
                    <div key={pb._id} className="border border-[#224466]/40 bg-[#070f21]/70 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xs font-black text-white">{pb.name}</h3>
                          <span className="text-[8px] bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-1.5 py-0.5 rounded font-mono">
                            v{pb.version || 1}
                          </span>
                          {!pb.enabled && (
                            <span className="text-[8px] bg-gray-500/10 border border-gray-500/30 text-gray-400 px-1.5 py-0.5 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 max-w-2xl">{pb.description || 'No description provided.'}</p>
                        <div className="flex flex-wrap items-center gap-3 text-[9px] text-[#5a7fa8] pt-1">
                          <span>Trigger: <strong className="text-white">{PLAYBOOK_EVENTS.find(e => e.event === pb.trigger?.event)?.label || pb.trigger?.event}</strong></span>
                          <span>•</span>
                          <span>Actions count: <strong className="text-white">{pb.actions?.length || 0}</strong></span>
                          <span>•</span>
                          <span>Executions: <strong className="text-white">{pb.runCount || 0}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <button onClick={() => handleTogglePlaybook(pb)}
                          className={`flex-1 md:flex-none px-2.5 py-1.5 border rounded text-[9px] font-bold uppercase tracking-widest transition-all
                            ${pb.enabled 
                              ? 'border-green-500/30 text-green-400 hover:bg-green-500/10' 
                              : 'border-gray-500/30 text-gray-400 hover:bg-gray-500/10'
                            }`}
                        >
                          {pb.enabled ? '🟢 Active' : '⚪ Inactive'}
                        </button>
                        <button onClick={() => handleManualTrigger(pb._id)}
                          className="flex-1 md:flex-none px-2.5 py-1.5 bg-black/40 border border-[#224466]/60 hover:border-[#00bfff]/40 rounded text-[9px] font-bold uppercase text-gray-400 hover:text-white transition-all">
                          ⚡ Run
                        </button>
                        <button onClick={() => setEditingPlaybook(pb)}
                          className="flex-1 md:flex-none px-2.5 py-1.5 bg-cyan-700/20 hover:bg-cyan-600/20 border border-cyan-500/30 rounded text-[9px] font-bold uppercase text-cyan-400 transition-all">
                          Edit
                        </button>
                        <button onClick={() => handleDeletePlaybook(pb._id)}
                          className="px-2.5 py-1.5 border border-red-500/30 hover:bg-red-500/10 rounded text-[9px] text-red-400 transition-all">
                          🗑
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: AUTOMATION RUNS (AUDIT TRAIL)                         */}
          {/* ============================================================ */}
          {activeTab === 'runs' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Automation Runs History</h2>
                <button onClick={loadData} className="px-2.5 py-1 border border-[#224466]/40 hover:border-white/20 rounded text-[9px] uppercase tracking-widest">
                  🔄 Refresh
                </button>
              </div>

              {runs.length === 0 ? (
                <div className="border border-dashed border-[#224466]/30 rounded-xl p-16 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-widest">No automation runs registered.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {runs.map(run => {
                    const statusClass = HEALTH_COLORS[run.status === 'success' ? 'Healthy' : run.status === 'partial' ? 'Warning' : 'Failed'];
                    return (
                      <div key={run._id} className="border border-[#224466]/40 bg-[#070f21]/70 rounded-xl p-4 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#224466]/20 pb-2">
                          <div className="space-y-0.5">
                            <h3 className="text-xs font-black text-white">{run.playbookId?.name || 'Deleted Playbook'}</h3>
                            <p className="text-[8px] text-gray-500 font-mono">Run ID: {run._id} · Event: {run.trigger?.event}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] text-[#5a7fa8]">{run.durationMs}ms</span>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded border font-bold uppercase ${statusClass}`}>
                              {run.status}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[9px] text-[#5a7fa8]">
                          <div>Started: <strong className="text-white">{new Date(run.startedAt).toLocaleTimeString()}</strong></div>
                          <div>Actions Scheduled: <strong className="text-white">{run.actionCount}</strong></div>
                          <div>Succeeded: <strong className="text-green-400">{run.successfulActions}</strong></div>
                          <div>Failed: <strong className="text-red-400">{run.failedActions}</strong></div>
                        </div>

                        {run.actions && run.actions.length > 0 && (
                          <div className="space-y-1.5 pt-2">
                            <h4 className="text-[8px] text-gray-500 uppercase tracking-widest">Execution Steps</h4>
                            <div className="space-y-1">
                              {run.actions.map((act, index) => (
                                <div key={index} className="flex items-center justify-between text-[9px] px-2.5 py-1.5 bg-black/40 rounded border border-[#224466]/10">
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-500 font-mono">{index + 1}.</span>
                                    <span className="text-white font-mono">{ACTION_TYPES.find(a => a.type === act.type)?.label || act.type}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-gray-600 font-mono">{act.durationMs || 0}ms</span>
                                    <span className={`font-bold ${act.status === 'success' ? 'text-green-400' : act.status === 'running' ? 'text-cyan-400' : 'text-red-400'}`}>
                                      {act.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* MODAL: CONNECTOR ADD / EDIT                                  */}
      {/* ============================================================ */}
      {editingConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form onSubmit={handleSaveConfig} className="bg-[#070f21] border border-[#00bfff]/20 rounded-xl w-full max-w-lg p-6 space-y-4">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Configure {editingConfig.type} Connector</h3>
              <p className="text-[10px] text-gray-500 mt-1">{INTEGRATION_TYPES.find(i => i.type === editingConfig.type)?.desc}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Configuration Name</label>
                <input type="text" required value={editingConfig.name} onChange={e => setEditingConfig({ ...editingConfig, name: e.target.value })}
                  placeholder="e.g. SOC Team Alerts Channel" className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none" />
              </div>

              {/* Conditionally Render Fields Based on Type */}
              {editingConfig.type === 'Slack' && (
                <div>
                  <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Webhook URL</label>
                  <input type="password" required value={editingConfig.config?.webhookUrl || ''} onChange={e => setEditingConfig({ ...editingConfig, config: { ...editingConfig.config, webhookUrl: e.target.value } })}
                    placeholder="https://hooks.slack.com/services/..." className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none" />
                </div>
              )}

              {editingConfig.type === 'Teams' && (
                <div>
                  <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Incoming Webhook URL</label>
                  <input type="password" required value={editingConfig.config?.webhookUrl || ''} onChange={e => setEditingConfig({ ...editingConfig, config: { ...editingConfig.config, webhookUrl: e.target.value } })}
                    placeholder="https://outlook.office.com/webhook/..." className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none" />
                </div>
              )}

              {editingConfig.type === 'Jira' && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Jira Base URL</label>
                    <input type="text" required value={editingConfig.config?.baseUrl || ''} onChange={e => setEditingConfig({ ...editingConfig, config: { ...editingConfig.config, baseUrl: e.target.value } })}
                      placeholder="https://your-domain.atlassian.net" className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Email</label>
                      <input type="email" required value={editingConfig.config?.email || ''} onChange={e => setEditingConfig({ ...editingConfig, config: { ...editingConfig.config, email: e.target.value } })}
                        placeholder="analyst@domain.com" className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Project Key</label>
                      <input type="text" required value={editingConfig.config?.projectKey || ''} onChange={e => setEditingConfig({ ...editingConfig, config: { ...editingConfig.config, projectKey: e.target.value } })}
                        placeholder="SEC" className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">API Token</label>
                    <input type="password" required value={editingConfig.config?.apiToken || ''} onChange={e => setEditingConfig({ ...editingConfig, config: { ...editingConfig.config, apiToken: e.target.value } })}
                      placeholder="Atlassian API Token" className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none" />
                  </div>
                </div>
              )}

              {editingConfig.type === 'GitHub' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Repo Owner</label>
                      <input type="text" required value={editingConfig.config?.owner || ''} onChange={e => setEditingConfig({ ...editingConfig, config: { ...editingConfig.config, owner: e.target.value } })}
                        placeholder="GitHub Username" className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Repo Name</label>
                      <input type="text" required value={editingConfig.config?.repo || ''} onChange={e => setEditingConfig({ ...editingConfig, config: { ...editingConfig.config, repo: e.target.value } })}
                        placeholder="cybershield-x" className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Personal Access Token</label>
                    <input type="password" required value={editingConfig.config?.token || ''} onChange={e => setEditingConfig({ ...editingConfig, config: { ...editingConfig.config, token: e.target.value } })}
                      placeholder="GitHub PAT (repo scope)" className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none" />
                  </div>
                </div>
              )}

              {editingConfig.type === 'Webhook' && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Webhook URL</label>
                    <input type="text" required value={editingConfig.config?.url || ''} onChange={e => setEditingConfig({ ...editingConfig, config: { ...editingConfig.config, url: e.target.value } })}
                      placeholder="https://api.your-domain.com/v1/alerts" className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none" />
                  </div>
                  <div className="flex items-center gap-4 py-1">
                    <label className="flex items-center gap-2 text-[10px] text-gray-400">
                      <input type="checkbox" checked={editingConfig.config?.signatureEnabled || false} onChange={e => setEditingConfig({ ...editingConfig, config: { ...editingConfig.config, signatureEnabled: e.target.checked } })}
                        className="accent-cyan-500" />
                      Sign Payload with HMAC-SHA256
                    </label>
                  </div>
                  {editingConfig.config?.signatureEnabled && (
                    <div>
                      <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">HMAC Secret Key</label>
                      <input type="password" required value={editingConfig.config?.secret || ''} onChange={e => setEditingConfig({ ...editingConfig, config: { ...editingConfig.config, secret: e.target.value } })}
                        placeholder="Secure HMAC Token" className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none" />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditingConfig(null)} className="flex-1 border border-[#224466]/40 text-gray-400 hover:text-white py-2 rounded text-xs uppercase tracking-widest">
                Cancel
              </button>
              <button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-2 rounded text-xs uppercase tracking-widest">
                Deploy Connector
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: PLAYBOOK ADD / EDIT                                   */}
      {/* ============================================================ */}
      {editingPlaybook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <form onSubmit={handleSavePlaybook} className="bg-[#070f21] border border-[#00bfff]/20 rounded-xl w-full max-w-2xl p-6 space-y-4 my-8">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">{editingPlaybook._id ? 'Upgrade' : 'Create'} Playbook</h3>
              <p className="text-[10px] text-gray-500 mt-1">Configure conditions and actions to execute when a security event fires.</p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Playbook Name</label>
                  <input type="text" required value={editingPlaybook.name} onChange={e => setEditingPlaybook({ ...editingPlaybook, name: e.target.value })}
                    placeholder="e.g. Critical Alerts Escalator" className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Trigger Event</label>
                  <select value={editingPlaybook.trigger?.event} onChange={e => setEditingPlaybook({ ...editingPlaybook, trigger: { ...editingPlaybook.trigger, event: e.target.value } })}
                    className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none">
                    {PLAYBOOK_EVENTS.map(ev => <option key={ev.event} value={ev.event}>{ev.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Description</label>
                <input type="text" value={editingPlaybook.description || ''} onChange={e => setEditingPlaybook({ ...editingPlaybook, description: e.target.value })}
                  placeholder="Summarize the automation logic..." className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none" />
              </div>

              {/* Actions Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[9px] text-gray-500 uppercase tracking-widest">Ordered Actions Flow</label>
                  <button type="button" onClick={() => setEditingPlaybook({ ...editingPlaybook, actions: [...(editingPlaybook.actions || []), { type: 'create_notification', config: {}, order: editingPlaybook.actions?.length || 0 }] })}
                    className="text-[9px] text-cyan-400 hover:text-white">+ Add Step</button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(editingPlaybook.actions || []).map((action, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-black/40 p-2.5 rounded border border-[#224466]/20">
                      <span className="text-[10px] font-mono text-gray-500">{idx + 1}.</span>
                      <select value={action.type} onChange={e => {
                        const newActions = [...editingPlaybook.actions];
                        newActions[idx].type = e.target.value;
                        setEditingPlaybook({ ...editingPlaybook, actions: newActions });
                      }}
                        className="bg-[#070f21] border border-[#224466]/40 rounded p-1 text-white text-[10px] focus:outline-none flex-1">
                        {ACTION_TYPES.map(a => <option key={a.type} value={a.type}>{a.label}</option>)}
                      </select>

                      {/* If requires integration config connection */}
                      {['create_jira', 'create_github_issue', 'send_slack', 'send_teams', 'generic_webhook'].includes(action.type) && (
                        <select value={action.integrationId || ''} required onChange={e => {
                          const newActions = [...editingPlaybook.actions];
                          newActions[idx].integrationId = e.target.value;
                          setEditingPlaybook({ ...editingPlaybook, actions: newActions });
                        }}
                          className="bg-[#070f21] border border-[#224466]/40 rounded p-1 text-white text-[10px] focus:outline-none flex-1">
                          <option value="">Select Target Connector</option>
                          {integrations.filter(c => {
                            if (action.type === 'create_jira') return c.type === 'Jira';
                            if (action.type === 'create_github_issue') return c.type === 'GitHub';
                            if (action.type === 'send_slack') return c.type === 'Slack';
                            if (action.type === 'send_teams') return c.type === 'Teams';
                            if (action.type === 'generic_webhook') return c.type === 'Webhook';
                            return false;
                          }).map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                          ))}
                        </select>
                      )}

                      <button type="button" onClick={() => {
                        const newActions = (editingPlaybook.actions || []).filter((_, i) => i !== idx);
                        setEditingPlaybook({ ...editingPlaybook, actions: newActions });
                      }} className="text-red-400 hover:text-red-300 text-xs px-1">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditingPlaybook(null)} className="flex-1 border border-[#224466]/40 text-gray-400 hover:text-white py-2 rounded text-xs uppercase tracking-widest">
                Cancel
              </button>
              <button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-2 rounded text-xs uppercase tracking-widest">
                Deploy Playbook
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
