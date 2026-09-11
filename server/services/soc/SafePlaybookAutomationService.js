/**
 * 🛡️ CyberShield X — SafePlaybookAutomationService (Phase 70)
 *
 * Implements deterministic SOAR playbooks and human-in-the-loop approval gates.
 * Action classes:
 * - LOW_RISK: Automated benign actions (create case/alert, enrich IOC)
 * - USER_APPROVED: Predefined diagnostic tools requiring operator approval
 * - PRIVILEGED: Administrative operations requiring ADMIN clearance
 *
 * Strict Guardrails: Prohibits arbitrary shell commands or untrusted scripts.
 * AI recommendations MUST pass human authorization before execution.
 */

const PendingApproval = require('../../models/PendingApproval');
const Incident = require('../../models/Incident');
const hostEnvironmentService = require('../HostEnvironmentService');
const auditLogger = require('../../utils/auditLogger');
const logger = require('../../utils/logger');

class SafePlaybookAutomationService {
  constructor() {
    this.io = null;
  }

  setSocketIO(io) {
    this.io = io;
  }

  emitRealTimeEvent(eventName, payload) {
    if (!this.io) return;
    try {
      this.io.emit(eventName, {
        eventId: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        ...payload,
      });
    } catch (err) {
      logger.warn(`Failed to emit Socket.IO event ${eventName}: ${err.message}`);
    }
  }

  /**
   * Proposes an automated or diagnostic action requiring human approval
   * @param {Object} params
   * @returns {Promise<Object>} Created PendingApproval record
   */
  async proposeAction({
    incidentId = null,
    playbookId = null,
    actionType,
    riskLevel = 'USER_APPROVED',
    target,
    tool = null,
    parameters = {},
    reason,
    evidenceRef = null,
    requestedBy = {},
    organizationId = null,
    expiresInHours = 24,
  }) {
    if (!target || !actionType || !reason) {
      throw new Error('Target, actionType, and reason are required to propose an action');
    }

    const approvalId = `APPR-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    const doc = {
      approvalId,
      incidentId,
      playbookId,
      actionType,
      riskLevel,
      target,
      tool,
      parameters,
      requestedBy: {
        userId: requestedBy.userId || requestedBy.id || 'AI_ASSISTANT',
        username: requestedBy.username || 'Security Copilot',
        role: requestedBy.role || 'ANALYST',
      },
      status: 'AWAITING_APPROVAL',
      reason,
      evidenceRef,
      expiresAt,
      organizationId,
    };

    const approval = await PendingApproval.create(doc);

    this.emitRealTimeEvent('approval:new', {
      approvalId,
      incidentId,
      actionType,
      riskLevel,
      target,
      tool,
      reason,
      expiresAt,
    });

    await auditLogger.log({
      actor: doc.requestedBy,
      action: 'ACTION_PROPOSED',
      resource: { type: 'APPROVAL', id: approvalId },
      outcome: 'SUCCESS',
      details: { actionType, riskLevel, target, tool, reason },
    });

    return approval;
  }

  /**
   * Evaluates and executes an approved action
   * @param {string} approvalId
   * @param {Object} approver - { userId, username, role }
   * @param {string} [decisionReason]
   * @returns {Promise<Object>} Execution result
   */
  async approveAndExecuteAction(approvalId, approver, decisionReason = '') {
    const approval = await PendingApproval.findOne({ approvalId });
    if (!approval) {
      throw new Error(`Pending approval ${approvalId} not found`);
    }

    if (approval.status !== 'AWAITING_APPROVAL' && approval.status !== 'PROPOSED') {
      throw new Error(`Approval is not in awaiting state (current: ${approval.status})`);
    }

    if (new Date() > new Date(approval.expiresAt)) {
      approval.status = 'EXPIRED';
      await approval.save();
      throw new Error(`Approval ${approvalId} has expired`);
    }

    // Role-based privilege gating
    const approverRole = String(approver.role || 'OPERATOR').toUpperCase();
    if (approval.riskLevel === 'PRIVILEGED' && approverRole !== 'ADMIN') {
      throw new Error('Privileged actions require ADMIN role authorization');
    }

    approval.status = 'EXECUTING';
    approval.approvedBy = {
      userId: approver.userId || approver.id || 'operator',
      username: approver.username || 'operator',
      role: approverRole,
      timestamp: new Date(),
      decisionReason,
    };
    await approval.save();

    let executionResult = null;
    let executionSuccess = false;

    try {
      // Execute through registered execution targets ONLY (No shell strings allowed)
      const normAction = String(approval.actionType || '').toUpperCase();
      if (normAction.includes('DIAGNOSTIC') || normAction.includes('TOOL') || approval.tool) {
        const toolName = approval.tool || 'whois';
        const target = approval.target;
        const args = approval.parameters?.args || [];

        // Check tool allowlist in HostEnvironmentService
        const result = await hostEnvironmentService.executeNativeTool(
          toolName,
          target,
          args,
          `exec_appr_${Date.now()}`,
          approver.userId || 'operator'
        );

        executionResult = result;
        executionSuccess = true;
        approval.executionId = result.executionId;
      } else if (normAction.includes('ENRICH') || normAction.includes('IOC')) {
        const iocService = require('./IOCNormalizationService');
        const enriched = await iocService.enrichIndicator(approval.target);
        executionResult = enriched;
        executionSuccess = true;
      } else {
        // Generic low-risk simulated benign action
        executionResult = { message: `Completed action ${approval.actionType} on ${approval.target}` };
        executionSuccess = true;
      }

      approval.status = executionSuccess ? 'COMPLETED' : 'FAILED';
      approval.result = executionResult;
      approval.executionResult = executionResult;
      await approval.save();

      // If tied to an incident, update its timeline
      if (approval.incidentId) {
        try {
          const incident = await Incident.findOne({ incidentId: approval.incidentId });
          if (incident) {
            const existingAction = incident.responseActions.find(
              (a) => a.actionId === approval.approvalId || a.executionId === approval.approvalId
            );
            if (existingAction) {
              existingAction.status = approval.status;
              existingAction.executionId = approval.executionId || existingAction.executionId;
              existingAction.approvedAt = approval.approvedBy?.timestamp || new Date();
              existingAction.approvedBy = approver.username || approver.name || 'operator';
              existingAction.completedAt = new Date();
              existingAction.result = executionResult;
            } else {
              incident.responseActions.push({
                actionId: approval.approvalId,
                playbookId: approval.playbookId,
                type: approval.actionType,
                status: approval.status,
                executionId: approval.executionId,
                requestedAt: approval.createdAt,
                approvedAt: approval.approvedBy?.timestamp || new Date(),
                approvedBy: approver.username,
                completedAt: new Date(),
                result: executionResult,
              });
            }

            incident.timeline.push({
              timestamp: new Date(),
              eventType: 'RESPONDED',
              description: `Approved action ${approval.actionType} executed (${approval.status}) by ${approver.username}`,
              actor: approver.username,
              evidenceRef: approval.executionId || null,
            });

            await incident.save();
            this.emitRealTimeEvent('incident:update', { incidentId: incident.incidentId });
          }
        } catch (incErr) {
          logger.warn(`Failed to update incident timeline for approval ${approvalId}: ${incErr.message}`);
        }
      }

      this.emitRealTimeEvent('approval:complete', {
        approvalId,
        status: approval.status,
        actionType: approval.actionType,
        executionId: approval.executionId,
      });

      await auditLogger.log({
        actor: approver,
        action: 'ACTION_EXECUTED',
        resource: { type: 'APPROVAL', id: approvalId },
        outcome: executionSuccess ? 'SUCCESS' : 'FAILURE',
        details: { actionType: approval.actionType, target: approval.target, executionId: approval.executionId },
      });

      return {
        ...(approval.toObject ? approval.toObject() : approval),
        approvalId,
        status: approval.status,
        executionResult,
      };
    } catch (execErr) {
      approval.status = 'FAILED';
      approval.result = { error: execErr.message };
      await approval.save();

      await auditLogger.log({
        actor: approver,
        action: 'ACTION_FAILED',
        resource: { type: 'APPROVAL', id: approvalId },
        outcome: 'FAILURE',
        details: { error: execErr.message },
      });

      throw execErr;
    }
  }

  /**
   * Denies a proposed action
   * @param {string} approvalId
   * @param {Object} actor - { userId, username, role }
   * @param {string} denialReason
   * @returns {Promise<Object>}
   */
  async denyAction(approvalId, actor, denialReason = 'Action denied by operator') {
    const approval = await PendingApproval.findOne({ approvalId });
    if (!approval) {
      throw new Error(`Pending approval ${approvalId} not found`);
    }

    approval.status = 'DENIED';
    approval.decisionReason = denialReason;
    approval.approvedBy = {
      userId: actor.userId || actor.id,
      username: actor.username,
      role: actor.role,
      timestamp: new Date(),
      decisionReason: denialReason,
    };
    await approval.save();

    this.emitRealTimeEvent('approval:deny', {
      approvalId,
      status: 'DENIED',
      deniedBy: actor.username,
    });

    await auditLogger.log({
      actor,
      action: 'ACTION_DENIED',
      resource: { type: 'APPROVAL', id: approvalId },
      outcome: 'SUCCESS',
      details: { denialReason },
    });

    return approval;
  }
}

module.exports = new SafePlaybookAutomationService();
