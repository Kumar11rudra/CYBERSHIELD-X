import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import api from '../services/api';
import workflowIntegrationService, {
  isSafeExternalUrl,
  getSyncStatusBadgeClass,
  getHealthBadgeClass,
} from '../services/workflowIntegrationService';
import toast from 'react-hot-toast';

const INTEGRATION_TYPES = [
  { type: 'Jira', icon: '🎫', desc: 'Atlassian Jira bidirectional ticket synchronization & approval callbacks.' },
  { type: 'ServiceNow', icon: '📋', desc: 'ServiceNow Table API incident synchronization & approval engine.' },
  { type: 'PagerDuty', icon: '🚨', desc: 'PagerDuty incident trigger, acknowledge, and resolve dispatch.' },
  { type: 'Slack', icon: '💬', desc: 'Send rich Block Kit notifications to channels.' },
  { type: 'Teams', icon: '👥', desc: 'Send Adaptive Cards to Microsoft Teams channels.' },
  { type: 'GitHub', icon: '💻', desc: 'Create code issues in GitHub repositories.' },
  { type: 'Webhook', icon: '⚓', desc: 'Post signed JSON alerts and receive authenticated inbound callbacks.' },
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
  const [cases, setCases] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [playbooks, setPlaybooks] = useState([]);
  const [runs, setRuns] = useState([]);

  // Filters
  const [ticketFilter, setTicketFilter] = useState('ALL');
  const [approvalFilter, setApprovalFilter] = useState('ALL');

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

      const [intData, pbRes, runsRes, casesData, approvalsData, auditData] = await Promise.all([
        workflowIntegrationService.getIntegrations(),
        api.get('/playbooks', { headers }).catch(() => ({ data: [] })),
        api.get('/playbooks/runs', { headers }).catch(() => ({ data: [] })),
        workflowIntegrationService.getCases().catch(() => []),
        workflowIntegrationService.getApprovals().catch(() => []),
        workflowIntegrationService.getAuditLogs().catch(() => []),
      ]);

      setIntegrations(Array.isArray(intData) ? intData : intData?.data || []);
      setPlaybooks(pbRes.data || []);
      setRuns(runsRes.data || []);
      setCases(casesData || []);
      setApprovals(approvalsData || []);
      setAuditLogs(auditData || []);
    } catch (err) {
      console.error('Failed fetching SOAR/workflow data:', err);
      toast.error('Could not load integrations context.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time Socket.IO listener for external approval callbacks
  useEffect(() => {
    let socket = null;
    try {
      const socketUrl = window.location.origin;
      socket = io(socketUrl, { transports: ['websocket', 'polling'] });
      socket.on('approval:external_callback', (data) => {
        toast.success(`External approval callback: ${data.approvalId} -> ${data.status}`);
        loadData();
      });
    } catch (err) {
      // Socket.io unavailable in test or air-gapped environments
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [loadData]);

  // Extract all external tickets bound across cases
  const allExternalTickets = React.useMemo(() => {
    const list = [];
    (cases || []).forEach((c) => {
      if (Array.isArray(c.externalTickets)) {
        c.externalTickets.forEach((t) => {
          list.push({
            ...t,
            caseId: c.caseId,
            caseTitle: c.title,
            caseSeverity: c.severity,
            caseStatus: c.status,
          });
        });
      }
    });
    if (ticketFilter === 'ALL') return list;
    return list.filter((t) => String(t.provider || '').toUpperCase() === ticketFilter);
  }, [cases, ticketFilter]);

  // Filtered approvals
  const filteredApprovals = React.useMemo(() => {
    if (approvalFilter === 'ALL') return approvals;
    return (approvals || []).filter((a) => a.status === approvalFilter);
  }, [approvals, approvalFilter]);

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
      const res = await workflowIntegrationService.testIntegration(id);
      if (res.success) {
        toast.success('Connection test succeeded!');
      } else {
        toast.error(`Test failed: ${res.error || res.message}`);
      }
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Connection failed.');
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
      if (editingConfig._id || editingConfig.id) {
        const id = editingConfig._id || editingConfig.id;
        await workflowIntegrationService.updateIntegration(id, editingConfig);
        toast.success('Connector updated.');
      } else {
        await workflowIntegrationService.createIntegration(editingConfig);
        toast.success('Connector deployed.');
      }
      setEditingConfig(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed saving integration.');
    }
  };

  const handleDeleteConfig = async (id) => {
    if (!window.confirm('Deprovision this integration connector?')) return;
    try {
      await workflowIntegrationService.deleteIntegration(id);
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
              <span>⚡</span> CyberShield X <span className="text-[#00bfff]">External Workflow & ITSM Center</span>
            </h1>
            <p className="text-[10px] text-[#5a7fa8] mt-1 uppercase tracking-wider">
              Bidirectional Ticketing · Inbound Webhooks · HITL Approvals · Audit Trail
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'integrations', label: '🔌 Connectors' },
              { id: 'tickets', label: `🎫 External Tickets (${allExternalTickets.length})` },
              { id: 'approvals', label: `🛡️ Approvals (${approvals.length})` },
              { id: 'audit', label: '📋 Sync Audit' },
              { id: 'playbooks', label: '⚙️ Playbooks' },
              { id: 'runs', label: '📝 Automation Runs' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest border transition-all
                  ${activeTab === tab.id
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                    : 'border-[#224466]/40 text-gray-500 hover:text-white hover:border-white/20'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4" data-testid="workflow-loading">
          <div className="w-10 h-10 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-xs text-cyan-400/60 uppercase tracking-widest">Compiling Workflow Systems...</p>
        </div>
      ) : (
        <>
          {/* ============================================================ */}
          {/* TAB 1: INTEGRATION CONNECTORS                                */}
          {/* ============================================================ */}
          {activeTab === 'integrations' && (
            <div className="space-y-6" data-testid="connectors-tab">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Active Connectors</h2>
                <div className="flex flex-wrap gap-2">
                  {INTEGRATION_TYPES.map((t) => (
                    <button
                      key={t.type}
                      onClick={() => setEditingConfig({ type: t.type, name: '', config: {}, active: true })}
                      className="px-2 py-1 bg-cyan-700/20 hover:bg-cyan-600/20 border border-cyan-500/30 rounded text-[9px] font-bold uppercase text-cyan-400 tracking-wider"
                    >
                      + Add {t.type}
                    </button>
                  ))}
                </div>
              </div>

              {integrations.length === 0 ? (
                <div className="border border-dashed border-[#224466]/30 rounded-xl p-16 text-center space-y-4" data-testid="connectors-empty">
                  <p className="text-xs text-gray-500 uppercase tracking-widest">No integration connectors configured.</p>
                  <p className="text-[10px] text-gray-600">
                    Provision a connector above to enable bidirectional ticketing, alerts, and approval callbacks with Jira, ServiceNow, PagerDuty, Slack, or Teams.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="connectors-grid">
                  {integrations.map((config) => {
                    const healthClass = getHealthBadgeClass(config.healthStatus || 'Unknown');
                    const configId = config._id || config.id;
                    return (
                      <div key={configId} className="border border-[#224466]/40 bg-[#070f21]/70 rounded-xl p-5 space-y-4 flex flex-col justify-between" data-testid={`connector-card-${config.type}`}>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-2xl">{INTEGRATION_TYPES.find((i) => i.type === config.type)?.icon || '🔌'}</span>
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
                            <button
                              onClick={() => handleTestConnection(configId)}
                              disabled={testingId === configId}
                              className="flex-1 px-2.5 py-1.5 bg-black/40 border border-[#224466]/60 hover:border-[#00bfff]/40 rounded text-[9px] font-bold uppercase text-gray-400 hover:text-white disabled:opacity-40 transition-all"
                            >
                              {testingId === configId ? 'Testing...' : '🔌 Test'}
                            </button>
                            <button
                              onClick={() => setEditingConfig(config)}
                              className="flex-1 px-2.5 py-1.5 bg-[#00bfff]/10 hover:bg-[#00bfff]/20 border border-[#00bfff]/30 rounded text-[9px] font-bold uppercase text-cyan-400 transition-all"
                            >
                              ✏ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteConfig(configId)}
                              className="px-2.5 py-1.5 border border-red-500/30 hover:bg-red-500/10 rounded text-[9px] text-red-400 transition-all"
                            >
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
          {/* TAB 2: EXTERNAL TICKETS (CASE.EXTERNALTICKETS RECONCILIATION) */}
          {/* ============================================================ */}
          {activeTab === 'tickets' && (
            <div className="space-y-6" data-testid="tickets-tab">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-widest">External Ticket Synchronizations</h2>
                  <p className="text-[10px] text-gray-500">Authoritative Case bindings with Jira, ServiceNow, and PagerDuty</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 uppercase">Provider:</span>
                  <select
                    value={ticketFilter}
                    onChange={(e) => setTicketFilter(e.target.value)}
                    className="bg-black/60 border border-[#224466]/60 text-cyan-400 text-xs rounded px-2.5 py-1 font-mono focus:outline-none"
                  >
                    <option value="ALL">All Providers</option>
                    <option value="JIRA">Jira</option>
                    <option value="SERVICENOW">ServiceNow</option>
                    <option value="PAGERDUTY">PagerDuty</option>
                    <option value="GENERIC">Generic</option>
                  </select>
                </div>
              </div>

              {allExternalTickets.length === 0 ? (
                <div className="border border-dashed border-[#224466]/30 rounded-xl p-16 text-center space-y-3" data-testid="tickets-empty">
                  <p className="text-xs text-gray-500 uppercase tracking-widest">No external tickets currently bound to cases.</p>
                  <p className="text-[10px] text-gray-600 max-w-lg mx-auto">
                    When cases are dispatched to Jira, ServiceNow, or PagerDuty, or when inbound webhooks reconcile external status, tickets will automatically appear here.
                  </p>
                </div>
              ) : (
                <div className="border border-[#224466]/40 bg-[#070f21]/70 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-black/40 text-[9px] uppercase tracking-widest text-[#5a7fa8] border-b border-[#224466]/30">
                      <tr>
                        <th className="p-3">Provider</th>
                        <th className="p-3">Ticket Key / ID</th>
                        <th className="p-3">Linked Case</th>
                        <th className="p-3">External Status</th>
                        <th className="p-3">Sync Status</th>
                        <th className="p-3">Direction</th>
                        <th className="p-3">Last Synchronized</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#224466]/20 font-mono">
                      {allExternalTickets.map((t, idx) => {
                        const syncClass = getSyncStatusBadgeClass(t.syncStatus);
                        const safeUrl = isSafeExternalUrl(t.ticketUrl);
                        return (
                          <tr key={`${t.caseId}-${t.ticketKey || t.ticketId}-${idx}`} className="hover:bg-cyan-950/10">
                            <td className="p-3 font-bold text-white flex items-center gap-1.5">
                              <span>
                                {t.provider === 'JIRA' ? '🎫' : t.provider === 'SERVICENOW' ? '📋' : t.provider === 'PAGERDUTY' ? '🚨' : '⚓'}
                              </span>
                              {t.provider}
                            </td>
                            <td className="p-3 text-cyan-400 font-bold">{t.ticketKey || t.ticketId || '—'}</td>
                            <td className="p-3">
                              <span className="text-gray-300 font-semibold">{t.caseId}</span>
                              <span className="block text-[9px] text-gray-500 truncate max-w-xs">{t.caseTitle}</span>
                            </td>
                            <td className="p-3 text-gray-300">{t.externalStatus || '—'}</td>
                            <td className="p-3">
                              <span className={`text-[8px] px-2 py-0.5 rounded border font-bold uppercase ${syncClass}`}>
                                {t.syncStatus || 'UNKNOWN'}
                              </span>
                            </td>
                            <td className="p-3 text-[10px] text-gray-400">{t.syncDirection || 'BIDIRECTIONAL'}</td>
                            <td className="p-3 text-[10px] text-gray-500">
                              {t.lastSyncAt ? new Date(t.lastSyncAt).toLocaleString() : 'Never'}
                            </td>
                            <td className="p-3 text-right">
                              {safeUrl ? (
                                <a
                                  href={t.ticketUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded text-[9px] uppercase font-bold"
                                >
                                  Open ↗
                                </a>
                              ) : (
                                <span className="text-gray-600 text-[9px]">No link</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: EXTERNAL APPROVALS (PENDINGAPPROVAL LIFECYCLE)        */}
          {/* ============================================================ */}
          {activeTab === 'approvals' && (
            <div className="space-y-6" data-testid="approvals-tab">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-widest">External HITL Approvals</h2>
                  <p className="text-[10px] text-gray-500">Human-in-the-Loop decision status and external ITSM callbacks</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 uppercase">Status:</span>
                  <select
                    value={approvalFilter}
                    onChange={(e) => setApprovalFilter(e.target.value)}
                    className="bg-black/60 border border-[#224466]/60 text-cyan-400 text-xs rounded px-2.5 py-1 font-mono focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="AWAITING_APPROVAL">Awaiting Approval</option>
                    <option value="PROPOSED">Proposed</option>
                    <option value="APPROVED">Approved</option>
                    <option value="DENIED">Denied</option>
                    <option value="EXECUTING">Executing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="FAILED">Failed</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </div>
              </div>

              {filteredApprovals.length === 0 ? (
                <div className="border border-dashed border-[#224466]/30 rounded-xl p-16 text-center space-y-3" data-testid="approvals-empty">
                  <p className="text-xs text-gray-500 uppercase tracking-widest">No matching approvals found.</p>
                  <p className="text-[10px] text-gray-600">
                    Approvals generated from SOAR playbooks or external Jira/ServiceNow callbacks will be displayed here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredApprovals.map((a) => {
                    const isExternal = a.approvedBy?.role === 'EXTERNAL_ITSM';
                    const statusBg =
                      a.status === 'APPROVED' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                      a.status === 'DENIED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                      a.status === 'AWAITING_APPROVAL' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse' :
                      a.status === 'PROPOSED' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' :
                      'bg-slate-800 text-slate-400 border-slate-700';

                    return (
                      <div key={a.approvalId} className="border border-[#224466]/40 bg-[#070f21]/70 rounded-xl p-4 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#224466]/20 pb-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xs font-black text-white font-mono">{a.approvalId}</h3>
                            <span className={`text-[8px] px-2 py-0.5 rounded border font-bold uppercase ${statusBg}`}>
                              {a.status}
                            </span>
                            {isExternal && (
                              <span className="text-[8px] px-2 py-0.5 rounded border font-bold uppercase bg-blue-500/10 text-blue-300 border-blue-500/30">
                                🌐 External ITSM Callback
                              </span>
                            )}
                          </div>
                          <div className="text-[9px] text-[#5a7fa8] font-mono">
                            Action: <span className="text-white">{a.actionType}</span> · Target: <span className="text-cyan-400">{a.target}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[10px] text-gray-400">
                          <div>
                            <span className="text-[#5a7fa8] uppercase block text-[8px]">Reason:</span>
                            <span className="text-gray-300">{a.reason || '—'}</span>
                          </div>
                          <div>
                            <span className="text-[#5a7fa8] uppercase block text-[8px]">Requested By:</span>
                            <span className="text-gray-300">{a.requestedBy?.username || a.requestedBy?.userId || 'System'}</span>
                          </div>
                          <div>
                            <span className="text-[#5a7fa8] uppercase block text-[8px]">Decision Metadata:</span>
                            {a.approvedBy?.userId ? (
                              <span className="text-gray-300">
                                {a.approvedBy.username || a.approvedBy.userId} ({a.approvedBy.role})
                                {a.approvedBy.timestamp && ` · ${new Date(a.approvedBy.timestamp).toLocaleTimeString()}`}
                              </span>
                            ) : (
                              <span className="text-gray-500">Pending human review</span>
                            )}
                          </div>
                        </div>

                        {a.decisionReason && (
                          <div className="text-[9px] bg-black/40 border border-[#224466]/20 rounded p-2 text-cyan-300 font-mono">
                            Decision note: {a.decisionReason}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: SYNC AUDIT LOG (INTEGRATIONSYNCEVENT / ACTIVITY AUDIT) */}
          {/* ============================================================ */}
          {activeTab === 'audit' && (
            <div className="space-y-6" data-testid="audit-tab">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-widest">Workflow Sync Audit Trail</h2>
                  <p className="text-[10px] text-gray-500">Sanitized, append-only integration events and sync outcomes</p>
                </div>
                <button
                  onClick={loadData}
                  className="px-2.5 py-1 border border-[#224466]/40 hover:border-white/20 rounded text-[9px] uppercase tracking-widest"
                >
                  🔄 Refresh
                </button>
              </div>

              {auditLogs.length === 0 ? (
                <div className="border border-dashed border-[#224466]/30 rounded-xl p-16 text-center space-y-2" data-testid="audit-empty">
                  <p className="text-xs text-gray-500 uppercase tracking-widest">No synchronization audit events recorded.</p>
                  <p className="text-[10px] text-gray-600">Events are logged automatically when webhooks or dispatches execute.</p>
                </div>
              ) : (
                <div className="border border-[#224466]/40 bg-[#070f21]/70 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-black/40 text-[9px] uppercase tracking-widest text-[#5a7fa8] border-b border-[#224466]/30">
                      <tr>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Action / Event</th>
                        <th className="p-3">Target</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Source / Actor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#224466]/20 font-mono">
                      {auditLogs.slice(0, 50).map((log, idx) => (
                        <tr key={log._id || log.id || idx} className="hover:bg-cyan-950/10">
                          <td className="p-3 text-gray-500 text-[10px]">
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                          </td>
                          <td className="p-3 font-semibold text-white">{log.action || log.eventType || 'SYNC_EVENT'}</td>
                          <td className="p-3 text-cyan-400">{log.target || log.targetEntityId || '—'}</td>
                          <td className="p-3">
                            <span
                              className={`text-[8px] px-1.5 py-0.5 rounded border font-bold uppercase ${
                                log.status === 'SUCCESS' || log.status === 'success'
                                  ? 'bg-green-500/10 text-green-400 border-green-500/30'
                                  : log.status === 'DUPLICATE'
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              }`}
                            >
                              {log.status || 'LOGGED'}
                            </span>
                          </td>
                          <td className="p-3 text-gray-400 text-[10px]">{log.userId || log.provider || 'SYSTEM'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 5: AUTOMATION PLAYBOOKS                                  */}
          {/* ============================================================ */}
          {activeTab === 'playbooks' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Workflows & Playbooks</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleSeedTemplates}
                    disabled={seeding}
                    className="px-3 py-1.5 bg-yellow-700/20 hover:bg-yellow-600/20 border border-yellow-500/30 rounded text-[10px] font-bold uppercase text-yellow-400 tracking-widest disabled:opacity-50"
                  >
                    {seeding ? 'Seeding...' : '💡 Seed Defaults'}
                  </button>
                  <button
                    onClick={() =>
                      setEditingPlaybook({
                        name: '',
                        description: '',
                        enabled: true,
                        trigger: { event: 'vulnerability_detected', conditions: [] },
                        actions: [{ type: 'create_notification', config: {}, order: 0 }],
                      })
                    }
                    className="px-3 py-1.5 bg-cyan-700/20 hover:bg-cyan-600/20 border border-cyan-500/30 rounded text-[10px] font-bold uppercase text-cyan-400 tracking-widest"
                  >
                    + Create Playbook
                  </button>
                </div>
              </div>

              {playbooks.length === 0 ? (
                <div className="border border-dashed border-[#224466]/30 rounded-xl p-16 text-center space-y-4">
                  <p className="text-xs text-gray-500 uppercase tracking-widest">No automation playbooks configured.</p>
                  <p className="text-[10px] text-gray-600">
                    Import templates or build a custom playbook to trigger ticketing, alerts, or AI remediation on security events.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {playbooks.map((pb) => (
                    <div
                      key={pb._id}
                      className="border border-[#224466]/40 bg-[#070f21]/70 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
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
                          <span>
                            Trigger:{' '}
                            <strong className="text-white">
                              {PLAYBOOK_EVENTS.find((e) => e.event === pb.trigger?.event)?.label || pb.trigger?.event}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            Actions count: <strong className="text-white">{pb.actions?.length || 0}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Executions: <strong className="text-white">{pb.runCount || 0}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <button
                          onClick={() => handleTogglePlaybook(pb)}
                          className={`flex-1 md:flex-none px-2.5 py-1.5 border rounded text-[9px] font-bold uppercase tracking-widest transition-all ${
                            pb.enabled
                              ? 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                              : 'border-gray-500/30 text-gray-400 hover:bg-gray-500/10'
                          }`}
                        >
                          {pb.enabled ? '🟢 Active' : '⚪ Inactive'}
                        </button>
                        <button
                          onClick={() => handleManualTrigger(pb._id)}
                          className="flex-1 md:flex-none px-2.5 py-1.5 bg-black/40 border border-[#224466]/60 hover:border-[#00bfff]/40 rounded text-[9px] font-bold uppercase text-gray-400 hover:text-white transition-all"
                        >
                          ⚡ Run
                        </button>
                        <button
                          onClick={() => setEditingPlaybook(pb)}
                          className="flex-1 md:flex-none px-2.5 py-1.5 bg-cyan-700/20 hover:bg-cyan-600/20 border border-cyan-500/30 rounded text-[9px] font-bold uppercase text-cyan-400 transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePlaybook(pb._id)}
                          className="px-2.5 py-1.5 border border-red-500/30 hover:bg-red-500/10 rounded text-[9px] text-red-400 transition-all"
                        >
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
          {/* TAB 6: AUTOMATION RUNS (AUDIT TRAIL)                         */}
          {/* ============================================================ */}
          {activeTab === 'runs' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Automation Runs History</h2>
                <button
                  onClick={loadData}
                  className="px-2.5 py-1 border border-[#224466]/40 hover:border-white/20 rounded text-[9px] uppercase tracking-widest"
                >
                  🔄 Refresh
                </button>
              </div>

              {runs.length === 0 ? (
                <div className="border border-dashed border-[#224466]/30 rounded-xl p-16 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-widest">No automation runs registered.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {runs.map((run) => {
                    const statusClass =
                      HEALTH_COLORS[run.status === 'success' ? 'Healthy' : run.status === 'partial' ? 'Warning' : 'Failed'];
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
                          <div>
                            Started: <strong className="text-white">{new Date(run.startedAt).toLocaleTimeString()}</strong>
                          </div>
                          <div>
                            Actions Scheduled: <strong className="text-white">{run.actionCount}</strong>
                          </div>
                          <div>
                            Succeeded: <strong className="text-green-400">{run.successfulActions}</strong>
                          </div>
                          <div>
                            Failed: <strong className="text-red-400">{run.failedActions}</strong>
                          </div>
                        </div>

                        {run.actions && run.actions.length > 0 && (
                          <div className="space-y-1.5 pt-2">
                            <h4 className="text-[8px] text-gray-500 uppercase tracking-widest">Execution Steps</h4>
                            <div className="space-y-1">
                              {run.actions.map((act, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between text-[9px] px-2.5 py-1.5 bg-black/40 rounded border border-[#224466]/10"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-500 font-mono">{index + 1}.</span>
                                    <span className="text-white font-mono">
                                      {ACTION_TYPES.find((a) => a.type === act.type)?.label || act.type}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-gray-600 font-mono">{act.durationMs || 0}ms</span>
                                    <span
                                      className={`font-bold ${
                                        act.status === 'success'
                                          ? 'text-green-400'
                                          : act.status === 'running'
                                          ? 'text-cyan-400'
                                          : 'text-red-400'
                                      }`}
                                    >
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveConfig}
            className="bg-[#070f21] border border-[#00bfff]/20 rounded-xl w-full max-w-lg p-6 space-y-4 my-8"
          >
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">
                Configure {editingConfig.type} Connector
              </h3>
              <p className="text-[10px] text-gray-500 mt-1">
                {INTEGRATION_TYPES.find((i) => i.type === editingConfig.type)?.desc}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Configuration Name</label>
                <input
                  type="text"
                  required
                  value={editingConfig.name}
                  onChange={(e) => setEditingConfig({ ...editingConfig, name: e.target.value })}
                  placeholder="e.g. SOC Production Connector"
                  className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* Conditionally Render Fields Based on Type */}
              {editingConfig.type === 'Jira' && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Jira Base URL</label>
                    <input
                      type="text"
                      required
                      value={editingConfig.config?.baseUrl || ''}
                      onChange={(e) =>
                        setEditingConfig({
                          ...editingConfig,
                          config: { ...editingConfig.config, baseUrl: e.target.value },
                        })
                      }
                      placeholder="https://your-domain.atlassian.net"
                      className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={editingConfig.config?.email || ''}
                        onChange={(e) =>
                          setEditingConfig({
                            ...editingConfig,
                            config: { ...editingConfig.config, email: e.target.value },
                          })
                        }
                        placeholder="analyst@domain.com"
                        className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Project Key</label>
                      <input
                        type="text"
                        required
                        value={editingConfig.config?.projectKey || ''}
                        onChange={(e) =>
                          setEditingConfig({
                            ...editingConfig,
                            config: { ...editingConfig.config, projectKey: e.target.value },
                          })
                        }
                        placeholder="SEC"
                        className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">API Token</label>
                    <input
                      type="password"
                      required
                      value={editingConfig.config?.apiToken || ''}
                      onChange={(e) =>
                        setEditingConfig({
                          ...editingConfig,
                          config: { ...editingConfig.config, apiToken: e.target.value },
                        })
                      }
                      placeholder="Atlassian API Token"
                      className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Inbound Webhook Secret</label>
                    <input
                      type="password"
                      value={editingConfig.config?.webhookSecret || ''}
                      onChange={(e) =>
                        setEditingConfig({
                          ...editingConfig,
                          config: { ...editingConfig.config, webhookSecret: e.target.value },
                        })
                      }
                      placeholder="Webhook HMAC Secret Key"
                      className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {editingConfig.type === 'ServiceNow' && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">ServiceNow Instance URL</label>
                    <input
                      type="text"
                      required
                      value={editingConfig.config?.instanceUrl || ''}
                      onChange={(e) =>
                        setEditingConfig({
                          ...editingConfig,
                          config: { ...editingConfig.config, instanceUrl: e.target.value },
                        })
                      }
                      placeholder="https://dev12345.service-now.com"
                      className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Username</label>
                      <input
                        type="text"
                        required
                        value={editingConfig.config?.username || ''}
                        onChange={(e) =>
                          setEditingConfig({
                            ...editingConfig,
                            config: { ...editingConfig.config, username: e.target.value },
                          })
                        }
                        placeholder="admin"
                        className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Password</label>
                      <input
                        type="password"
                        required
                        value={editingConfig.config?.password || ''}
                        onChange={(e) =>
                          setEditingConfig({
                            ...editingConfig,
                            config: { ...editingConfig.config, password: e.target.value },
                          })
                        }
                        placeholder="ServiceNow Password"
                        className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Default Table</label>
                      <input
                        type="text"
                        value={editingConfig.config?.defaultTable || 'incident'}
                        onChange={(e) =>
                          setEditingConfig({
                            ...editingConfig,
                            config: { ...editingConfig.config, defaultTable: e.target.value },
                          })
                        }
                        placeholder="incident"
                        className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Caller ID (optional)</label>
                      <input
                        type="text"
                        value={editingConfig.config?.callerId || ''}
                        onChange={(e) =>
                          setEditingConfig({
                            ...editingConfig,
                            config: { ...editingConfig.config, callerId: e.target.value },
                          })
                        }
                        placeholder="admin"
                        className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Inbound Webhook Secret</label>
                    <input
                      type="password"
                      value={editingConfig.config?.webhookSecret || ''}
                      onChange={(e) =>
                        setEditingConfig({
                          ...editingConfig,
                          config: { ...editingConfig.config, webhookSecret: e.target.value },
                        })
                      }
                      placeholder="Shared Webhook Token / Secret"
                      className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {editingConfig.type === 'PagerDuty' && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Events API Routing Key</label>
                    <input
                      type="password"
                      value={editingConfig.config?.routingKey || ''}
                      onChange={(e) =>
                        setEditingConfig({
                          ...editingConfig,
                          config: { ...editingConfig.config, routingKey: e.target.value },
                        })
                      }
                      placeholder="32-char Routing Key (Events API v2)"
                      className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">REST API Token (optional)</label>
                      <input
                        type="password"
                        value={editingConfig.config?.apiToken || ''}
                        onChange={(e) =>
                          setEditingConfig({
                            ...editingConfig,
                            config: { ...editingConfig.config, apiToken: e.target.value },
                          })
                        }
                        placeholder="v2 REST API Token"
                        className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Service ID</label>
                      <input
                        type="text"
                        value={editingConfig.config?.serviceId || ''}
                        onChange={(e) =>
                          setEditingConfig({
                            ...editingConfig,
                            config: { ...editingConfig.config, serviceId: e.target.value },
                          })
                        }
                        placeholder="e.g. PD-SERVICE-99"
                        className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Inbound Webhook Secret</label>
                    <input
                      type="password"
                      value={editingConfig.config?.webhookSecret || ''}
                      onChange={(e) =>
                        setEditingConfig({
                          ...editingConfig,
                          config: { ...editingConfig.config, webhookSecret: e.target.value },
                        })
                      }
                      placeholder="Webhook HMAC Secret Key"
                      className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {editingConfig.type === 'Slack' && (
                <div>
                  <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Webhook URL</label>
                  <input
                    type="password"
                    required
                    value={editingConfig.config?.webhookUrl || ''}
                    onChange={(e) =>
                      setEditingConfig({
                        ...editingConfig,
                        config: { ...editingConfig.config, webhookUrl: e.target.value },
                      })
                    }
                    placeholder="https://hooks.slack.com/services/..."
                    className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              )}

              {editingConfig.type === 'Teams' && (
                <div>
                  <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Incoming Webhook URL</label>
                  <input
                    type="password"
                    required
                    value={editingConfig.config?.webhookUrl || ''}
                    onChange={(e) =>
                      setEditingConfig({
                        ...editingConfig,
                        config: { ...editingConfig.config, webhookUrl: e.target.value },
                      })
                    }
                    placeholder="https://outlook.office.com/webhook/..."
                    className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              )}

              {editingConfig.type === 'GitHub' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Repo Owner</label>
                      <input
                        type="text"
                        required
                        value={editingConfig.config?.owner || ''}
                        onChange={(e) =>
                          setEditingConfig({
                            ...editingConfig,
                            config: { ...editingConfig.config, owner: e.target.value },
                          })
                        }
                        placeholder="GitHub Username"
                        className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Repo Name</label>
                      <input
                        type="text"
                        required
                        value={editingConfig.config?.repo || ''}
                        onChange={(e) =>
                          setEditingConfig({
                            ...editingConfig,
                            config: { ...editingConfig.config, repo: e.target.value },
                          })
                        }
                        placeholder="cybershield-x"
                        className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Personal Access Token</label>
                    <input
                      type="password"
                      required
                      value={editingConfig.config?.token || ''}
                      onChange={(e) =>
                        setEditingConfig({
                          ...editingConfig,
                          config: { ...editingConfig.config, token: e.target.value },
                        })
                      }
                      placeholder="GitHub PAT (repo scope)"
                      className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {editingConfig.type === 'Webhook' && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Webhook URL</label>
                    <input
                      type="text"
                      required
                      value={editingConfig.config?.url || ''}
                      onChange={(e) =>
                        setEditingConfig({
                          ...editingConfig,
                          config: { ...editingConfig.config, url: e.target.value },
                        })
                      }
                      placeholder="https://api.your-domain.com/v1/alerts"
                      className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-4 py-1">
                    <label className="flex items-center gap-2 text-[10px] text-gray-400">
                      <input
                        type="checkbox"
                        checked={editingConfig.config?.signatureEnabled || false}
                        onChange={(e) =>
                          setEditingConfig({
                            ...editingConfig,
                            config: { ...editingConfig.config, signatureEnabled: e.target.checked },
                          })
                        }
                        className="accent-cyan-500"
                      />
                      Sign Payload with HMAC-SHA256
                    </label>
                  </div>
                  {editingConfig.config?.signatureEnabled && (
                    <div>
                      <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">HMAC Secret Key</label>
                      <input
                        type="password"
                        required
                        value={editingConfig.config?.secret || ''}
                        onChange={(e) =>
                          setEditingConfig({
                            ...editingConfig,
                            config: { ...editingConfig.config, secret: e.target.value },
                          })
                        }
                        placeholder="Secure HMAC Token"
                        className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingConfig(null)}
                className="flex-1 border border-[#224466]/40 text-gray-400 hover:text-white py-2 rounded text-xs uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-2 rounded text-xs uppercase tracking-widest"
              >
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
          <form
            onSubmit={handleSavePlaybook}
            className="bg-[#070f21] border border-[#00bfff]/20 rounded-xl w-full max-w-2xl p-6 space-y-4 my-8"
          >
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">
                {editingPlaybook._id ? 'Upgrade' : 'Create'} Playbook
              </h3>
              <p className="text-[10px] text-gray-500 mt-1">
                Configure conditions and actions to execute when a security event fires.
              </p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Playbook Name</label>
                  <input
                    type="text"
                    required
                    value={editingPlaybook.name}
                    onChange={(e) => setEditingPlaybook({ ...editingPlaybook, name: e.target.value })}
                    placeholder="e.g. Critical Alerts Escalator"
                    className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Trigger Event</label>
                  <select
                    value={editingPlaybook.trigger?.event}
                    onChange={(e) =>
                      setEditingPlaybook({
                        ...editingPlaybook,
                        trigger: { ...editingPlaybook.trigger, event: e.target.value },
                      })
                    }
                    className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  >
                    {PLAYBOOK_EVENTS.map((ev) => (
                      <option key={ev.event} value={ev.event}>
                        {ev.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Description</label>
                <input
                  type="text"
                  value={editingPlaybook.description || ''}
                  onChange={(e) => setEditingPlaybook({ ...editingPlaybook, description: e.target.value })}
                  placeholder="Summarize the automation logic..."
                  className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* Actions Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[9px] text-gray-500 uppercase tracking-widest">Ordered Actions Flow</label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingPlaybook({
                        ...editingPlaybook,
                        actions: [
                          ...(editingPlaybook.actions || []),
                          { type: 'create_notification', config: {}, order: editingPlaybook.actions?.length || 0 },
                        ],
                      })
                    }
                    className="text-[9px] text-cyan-400 hover:text-white"
                  >
                    + Add Step
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(editingPlaybook.actions || []).map((action, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-black/40 p-2.5 rounded border border-[#224466]/20">
                      <span className="text-[10px] font-mono text-gray-500">{idx + 1}.</span>
                      <select
                        value={action.type}
                        onChange={(e) => {
                          const newActions = [...editingPlaybook.actions];
                          newActions[idx].type = e.target.value;
                          setEditingPlaybook({ ...editingPlaybook, actions: newActions });
                        }}
                        className="bg-[#070f21] border border-[#224466]/40 rounded p-1 text-white text-[10px] focus:outline-none flex-1"
                      >
                        {ACTION_TYPES.map((a) => (
                          <option key={a.type} value={a.type}>
                            {a.label}
                          </option>
                        ))}
                      </select>

                      {/* If requires integration config connection */}
                      {['create_jira', 'create_github_issue', 'send_slack', 'send_teams', 'generic_webhook'].includes(
                        action.type
                      ) && (
                        <select
                          value={action.integrationId || ''}
                          required
                          onChange={(e) => {
                            const newActions = [...editingPlaybook.actions];
                            newActions[idx].integrationId = e.target.value;
                            setEditingPlaybook({ ...editingPlaybook, actions: newActions });
                          }}
                          className="bg-[#070f21] border border-[#224466]/40 rounded p-1 text-white text-[10px] focus:outline-none flex-1"
                        >
                          <option value="">Select Target Connector</option>
                          {integrations
                            .filter((c) => {
                              if (action.type === 'create_jira') return c.type === 'Jira';
                              if (action.type === 'create_github_issue') return c.type === 'GitHub';
                              if (action.type === 'send_slack') return c.type === 'Slack';
                              if (action.type === 'send_teams') return c.type === 'Teams';
                              if (action.type === 'generic_webhook') return c.type === 'Webhook';
                              return false;
                            })
                            .map((c) => (
                              <option key={c._id || c.id} value={c._id || c.id}>
                                {c.name}
                              </option>
                            ))}
                        </select>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          const newActions = (editingPlaybook.actions || []).filter((_, i) => i !== idx);
                          setEditingPlaybook({ ...editingPlaybook, actions: newActions });
                        }}
                        className="text-red-400 hover:text-red-300 text-xs px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingPlaybook(null)}
                className="flex-1 border border-[#224466]/40 text-gray-400 hover:text-white py-2 rounded text-xs uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-2 rounded text-xs uppercase tracking-widest"
              >
                Deploy Playbook
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
