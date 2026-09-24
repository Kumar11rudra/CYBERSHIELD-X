import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { ExternalLink, ShieldCheck, Clock } from 'lucide-react';

export default function ApprovalCenterPage() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('AWAITING_APPROVAL');
  const [riskFilter, setRiskFilter] = useState('');
  const [selectedApproval, setSelectedApproval] = useState(null);

  // Modal states
  const [actionModal, setActionModal] = useState({ open: false, type: 'APPROVE', item: null, reason: '' });
  const [proposeModal, setProposeModal] = useState(false);
  const [newProposal, setNewProposal] = useState({
    actionType: 'run_diagnostic_tool',
    riskLevel: 'USER_APPROVED',
    target: '192.168.1.100',
    tool: 'ping',
    parameters: '{"count": 4}',
    reason: 'Validate host reachability during triage',
  });

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (riskFilter) params.append('riskLevel', riskFilter);

      const res = await axios.get(`/api/approvals?${params.toString()}`);
      if (res.data?.success) {
        const list = res.data.data.approvals || [];
        setApprovals(list);
        if (list.length > 0 && (!selectedApproval || !list.some(a => a.approvalId === selectedApproval.approvalId))) {
          setSelectedApproval(list[0]);
        } else if (list.length === 0) {
          setSelectedApproval(null);
        }
      }
    } catch {
      toast.error('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [statusFilter, riskFilter]);

  // Socket.IO real-time listener for external approval callbacks
  useEffect(() => {
    let socket;
    try {
      let token = null;
      let organizationId = null;
      try {
        token = localStorage.getItem('cybershield_token') || localStorage.getItem('token');
      } catch {}
      try {
        organizationId = localStorage.getItem('cybershield.active.orgId') || localStorage.getItem('activeOrgId');
      } catch {}

      const socketUrl = typeof window !== 'undefined' && window.location ? window.location.origin : 'http://localhost:3001';

      socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        auth: {
          token,
          organizationId,
        },
        withCredentials: true,
        reconnectionAttempts: 3,
        timeout: 5000,
      });

      socket.on('approval:external_callback', (data) => {
        if (data?.approvalId) {
          toast.success(`External workflow callback: ${data.approvalId} -> ${data.status || 'UPDATED'}`);
          fetchApprovals();
        }
      });

      socket.on('approval:status_changed', () => {
        fetchApprovals();
      });
    } catch {
      // Graceful fallback to HTTP refresh
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!actionModal.item) return;

    try {
      if (actionModal.type === 'APPROVE') {
        const res = await axios.post(`/api/approvals/${actionModal.item.approvalId}/approve`, {
          decisionReason: actionModal.reason || 'Approved by operator',
        });
        if (res.data?.success) {
          toast.success(`Action ${actionModal.item.approvalId} approved and submitted for execution`);
        }
      } else {
        const res = await axios.post(`/api/approvals/${actionModal.item.approvalId}/deny`, {
          reason: actionModal.reason || 'Denied by operator',
        });
        if (res.data?.success) {
          toast.success(`Action ${actionModal.item.approvalId} denied`);
        }
      }
      setActionModal({ open: false, type: 'APPROVE', item: null, reason: '' });
      fetchApprovals();
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${actionModal.type.toLowerCase()} action`);
    }
  };

  const handleCreateProposal = async (e) => {
    e.preventDefault();
    try {
      let parsedParams = {};
      try {
        parsedParams = JSON.parse(newProposal.parameters || '{}');
      } catch {
        toast.error('Parameters must be valid JSON');
        return;
      }

      const res = await axios.post('/api/approvals', {
        actionType: newProposal.actionType,
        riskLevel: newProposal.riskLevel,
        target: newProposal.target,
        tool: newProposal.tool,
        parameters: parsedParams,
        reason: newProposal.reason,
      });

      if (res.data?.success) {
        toast.success('Action proposal created successfully');
        setProposeModal(false);
        fetchApprovals();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create action proposal');
    }
  };

  const getRiskBadge = (risk) => {
    switch (risk) {
      case 'PRIVILEGED':
        return <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">PRIVILEGED</span>;
      case 'USER_APPROVED':
        return <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">USER_APPROVED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">LOW_RISK</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PROPOSED':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-700/40 text-slate-300 border border-slate-600/40">PROPOSED</span>;
      case 'AWAITING_APPROVAL':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/50 animate-pulse">AWAITING APPROVAL</span>;
      case 'APPROVED':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40">APPROVED</span>;
      case 'EXECUTING':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 animate-pulse">EXECUTING</span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">COMPLETED</span>;
      case 'DENIED':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">DENIED</span>;
      case 'FAILED':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-600/20 text-red-400 border border-red-600/40">FAILED</span>;
      case 'EXPIRED':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-600/20 text-slate-400 border border-slate-600/40">EXPIRED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400">
              HUMAN-IN-THE-LOOP APPROVAL CENTER
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded">
              GATE ENFORCED
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Zero autonomous execution of privileged operations. Every sensitive remediation requires human operator authorization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setProposeModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold rounded shadow-lg shadow-cyan-900/30 transition"
          >
            + Propose Action
          </button>
          <button
            onClick={fetchApprovals}
            className="px-3 py-2 bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 text-sm rounded font-medium transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/80 p-4 rounded-lg border border-slate-800">
        <div>
          <label className="text-xs text-slate-400 uppercase font-semibold block mb-1">Status Gate</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-sm rounded px-3 py-2 text-slate-200 focus:border-amber-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PROPOSED">Proposed</option>
            <option value="AWAITING_APPROVAL">Awaiting Approval (Active)</option>
            <option value="APPROVED">Approved</option>
            <option value="EXECUTING">Executing</option>
            <option value="COMPLETED">Completed</option>
            <option value="DENIED">Denied</option>
            <option value="FAILED">Failed</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-400 uppercase font-semibold block mb-1">Risk Classification</label>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-sm rounded px-3 py-2 text-slate-200 focus:border-amber-500 focus:outline-none"
          >
            <option value="">All Risk Levels</option>
            <option value="LOW_RISK">LOW_RISK</option>
            <option value="USER_APPROVED">USER_APPROVED</option>
            <option value="PRIVILEGED">PRIVILEGED</option>
          </select>
        </div>

        <div className="md:col-span-2 flex items-end justify-end">
          <div className="text-xs text-slate-500 font-mono">
            Canonical Execution Architecture: <span className="text-cyan-400">HOST_NATIVE</span> | <span className="text-cyan-400">CYBERSHIELD_API_ENGINE</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Approvals List */}
        <div className="lg:col-span-5 space-y-3">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading pending approval queue...</div>
          ) : approvals.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 rounded-lg border border-slate-800 text-slate-400">
              <p className="text-base font-semibold">No approvals found</p>
              <p className="text-xs text-slate-500 mt-1">No action requests match the selected filters.</p>
            </div>
          ) : (
            approvals.map((app) => {
              const isSelected = selectedApproval?.approvalId === app.approvalId;
              return (
                <div
                  key={app.approvalId}
                  onClick={() => setSelectedApproval(app)}
                  className={`p-4 rounded-lg border cursor-pointer transition ${
                    isSelected
                      ? 'bg-slate-900 border-amber-500/60 shadow-lg shadow-amber-950/20'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs text-cyan-400 font-bold">{app.approvalId}</span>
                    {getStatusBadge(app.status)}
                  </div>

                  <div className="flex items-center justify-between text-sm font-semibold text-slate-200">
                    <span className="truncate">{app.actionType}</span>
                    {getRiskBadge(app.riskLevel)}
                  </div>

                  {(app.approvedBy?.role === 'EXTERNAL_ITSM' || app.decidedBy?.role === 'EXTERNAL_ITSM') && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-mono text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/30">
                      <ShieldCheck className="w-3 h-3 text-indigo-400 shrink-0" />
                      <span className="truncate">External ITSM Decision ({app.approvedBy?.username || app.decidedBy?.username || 'Webhook'})</span>
                    </div>
                  )}

                  <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
                    <span>Target: <span className="text-slate-300 font-mono">{app.target}</span></span>
                    {app.tool && <span>Tool: <span className="text-slate-300 font-mono">{app.tool}</span></span>}
                  </div>

                  <div className="text-xs text-slate-500 mt-2 truncate">
                    Reason: {app.reason}
                  </div>

                  <div className="text-[10px] text-slate-500 mt-2 flex justify-between border-t border-slate-800/80 pt-2">
                    <span>Requested by: {app.requestedBy?.username || 'system'}</span>
                    <span>{new Date(app.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Approval Detail View */}
        <div className="lg:col-span-7">
          {selectedApproval ? (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-100">{selectedApproval.actionType}</h2>
                    {getRiskBadge(selectedApproval.riskLevel)}
                  </div>
                  <p className="text-xs font-mono text-cyan-400 mt-1">{selectedApproval.approvalId}</p>
                </div>
                <div>{getStatusBadge(selectedApproval.status)}</div>
              </div>

              {/* Action Buttons for Awaiting Approval */}
              {selectedApproval.status === 'AWAITING_APPROVAL' && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-amber-300">Operator Review Required</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Verify action parameters, target reach, and potential operational impact before approving.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => setActionModal({ open: true, type: 'DENY', item: selectedApproval, reason: '' })}
                      className="flex-1 sm:flex-initial px-4 py-2 bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold rounded transition"
                    >
                      DENY
                    </button>
                    <button
                      onClick={() => setActionModal({ open: true, type: 'APPROVE', item: selectedApproval, reason: '' })}
                      className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded shadow-lg shadow-emerald-950/50 transition"
                    >
                      APPROVE & EXECUTE
                    </button>
                  </div>
                </div>
              )}

              {/* Action Context Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
                <div>
                  <span className="text-slate-500 block uppercase">Target Entity</span>
                  <span className="font-mono text-slate-200 text-sm">{selectedApproval.target}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase">Registered Tool</span>
                  <span className="font-mono text-cyan-400 text-sm">{selectedApproval.tool || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase">Requested By</span>
                  <span className="text-slate-300">{selectedApproval.requestedBy?.username} ({selectedApproval.requestedBy?.role || 'OPERATOR'})</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase">Incident Link</span>
                  <span className="font-mono text-slate-300">{selectedApproval.incidentId || 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase">Created</span>
                  <span className="text-slate-400">{new Date(selectedApproval.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase">Expires</span>
                  <span className="text-slate-400">
                    {selectedApproval.expiresAt ? new Date(selectedApproval.expiresAt).toLocaleString() : 'No expiration'}
                  </span>
                </div>
              </div>

              {/* Justification / Reason */}
              <div>
                <h3 className="text-xs uppercase text-slate-400 font-bold mb-2">Operator / AI Justification</h3>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded text-sm text-slate-300">
                  {selectedApproval.reason || 'No justification provided'}
                </div>
              </div>

              {/* Tool Parameters */}
              <div>
                <h3 className="text-xs uppercase text-slate-400 font-bold mb-2">Execution Parameters</h3>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded font-mono text-xs text-emerald-400 overflow-x-auto">
                  {JSON.stringify(selectedApproval.parameters || {}, null, 2)}
                </pre>
              </div>

              {/* Execution Outcome or Decision Rationale */}
              {selectedApproval.decidedBy && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                  <h3 className="text-xs uppercase text-slate-400 font-bold">Decision Audit Record</h3>
                  <div className="text-xs text-slate-300 flex justify-between">
                    <span>Decided By: <strong className="text-white">{selectedApproval.decidedBy?.username}</strong></span>
                    <span>At: {selectedApproval.decidedAt ? new Date(selectedApproval.decidedAt).toLocaleString() : ''}</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Rationale: <span className="italic text-slate-300">"{selectedApproval.decisionReason}"</span>
                  </p>
                </div>
              )}

              {/* External Workflow Callback Attribution */}
              {(selectedApproval.approvedBy?.role === 'EXTERNAL_ITSM' || selectedApproval.decidedBy?.role === 'EXTERNAL_ITSM') && (
                <div className="p-4 bg-indigo-950/40 border border-indigo-500/40 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-xs uppercase font-bold text-indigo-300 tracking-wider">
                        External ITSM Callback Recorded
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded">
                      EXTERNAL DISPATCH
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 flex flex-wrap gap-4">
                    <span>External Actor: <strong className="text-white">{selectedApproval.approvedBy?.username || selectedApproval.decidedBy?.username || 'External ITSM Operator'}</strong></span>
                    <span>Provider: <span className="text-cyan-400 font-mono">{selectedApproval.provider || 'ITSM / Alert Provider'}</span></span>
                    <span>At: {new Date(selectedApproval.approvedBy?.timestamp || selectedApproval.decidedAt || selectedApproval.updatedAt).toLocaleString()}</span>
                  </div>
                  {(selectedApproval.approvedBy?.decisionReason || selectedApproval.decisionReason) && (
                    <p className="text-xs text-slate-400 pt-1 border-t border-indigo-900/50">
                      External Reason: <span className="italic text-slate-200">"{selectedApproval.approvedBy?.decisionReason || selectedApproval.decisionReason}"</span>
                    </p>
                  )}
                </div>
              )}

              {/* Execution Result */}
              {selectedApproval.executionResult && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                  <h3 className="text-xs uppercase text-slate-400 font-bold flex items-center justify-between">
                    <span>Execution Output</span>
                    <span className="font-mono text-[10px] text-cyan-400">
                      ID: {selectedApproval.executionResult.executionId || selectedApproval.executionId || 'N/A'}
                    </span>
                  </h3>
                  <pre className="p-3 bg-black/80 rounded border border-slate-800/80 font-mono text-xs text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {typeof selectedApproval.executionResult.output === 'object'
                      ? JSON.stringify(selectedApproval.executionResult.output, null, 2)
                      : selectedApproval.executionResult.output || 'No output recorded'}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-12 text-center text-slate-500">
              Select an action request from the queue to inspect parameters and grant or deny approval.
            </div>
          )}
        </div>
      </div>

      {/* Decision Modal (Approve or Deny) */}
      {actionModal.open && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-100">
              {actionModal.type === 'APPROVE' ? 'Approve & Trigger Execution' : 'Deny Action Request'}
            </h3>
            <p className="text-xs text-slate-400">
              Action: <strong className="text-slate-200">{actionModal.item?.actionType}</strong> on target{' '}
              <strong className="text-cyan-400">{actionModal.item?.target}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                Decision Rationale / Justification
              </label>
              <textarea
                value={actionModal.reason}
                onChange={(e) => setActionModal({ ...actionModal, reason: e.target.value })}
                rows={3}
                placeholder={
                  actionModal.type === 'APPROVE'
                    ? 'State reasons for approving this remediation action...'
                    : 'State reasons for rejecting this remediation action...'
                }
                className="w-full bg-slate-950 border border-slate-800 text-sm rounded p-3 text-slate-200 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActionModal({ open: false, type: 'APPROVE', item: null, reason: '' })}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDecisionSubmit}
                className={`px-4 py-2 text-white text-sm font-bold rounded transition ${
                  actionModal.type === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                Confirm {actionModal.type === 'APPROVE' ? 'Approval' : 'Denial'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Propose Action Modal */}
      {proposeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateProposal} className="bg-slate-900 border border-slate-700 rounded-lg max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Propose Bounded Remediation Action</h3>
            <p className="text-xs text-slate-400">
              Create a supervised action proposal requiring human-in-the-loop authorization before execution.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Action Type</label>
                <select
                  value={newProposal.actionType}
                  onChange={(e) => setNewProposal({ ...newProposal, actionType: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-sm rounded px-3 py-2 text-slate-200"
                >
                  <option value="run_diagnostic_tool">run_diagnostic_tool</option>
                  <option value="create_case">create_case</option>
                  <option value="create_alert">create_alert</option>
                  <option value="quarantine_item">quarantine_item</option>
                  <option value="enrich_ioc">enrich_ioc</option>
                  <option value="case_escalation">case_escalation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Risk Level</label>
                <select
                  value={newProposal.riskLevel}
                  onChange={(e) => setNewProposal({ ...newProposal, riskLevel: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-sm rounded px-3 py-2 text-slate-200"
                >
                  <option value="LOW_RISK">LOW_RISK</option>
                  <option value="USER_APPROVED">USER_APPROVED</option>
                  <option value="PRIVILEGED">PRIVILEGED</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Target Entity / Host</label>
                <input
                  type="text"
                  value={newProposal.target}
                  onChange={(e) => setNewProposal({ ...newProposal, target: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-sm rounded px-3 py-2 text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Registered Tool</label>
                <input
                  type="text"
                  value={newProposal.tool}
                  onChange={(e) => setNewProposal({ ...newProposal, tool: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-sm rounded px-3 py-2 text-slate-200 font-mono"
                  placeholder="e.g. ping, whois, curl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Parameters (JSON)</label>
              <textarea
                value={newProposal.parameters}
                onChange={(e) => setNewProposal({ ...newProposal, parameters: e.target.value })}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 text-xs font-mono rounded p-3 text-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Operator Reason</label>
              <input
                type="text"
                value={newProposal.reason}
                onChange={(e) => setNewProposal({ ...newProposal, reason: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-sm rounded px-3 py-2 text-slate-200"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProposeModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold rounded transition"
              >
                Submit Proposal
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
