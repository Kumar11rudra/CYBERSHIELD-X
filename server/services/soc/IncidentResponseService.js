/**
 * 🛡️ CyberShield X — IncidentResponseService (Phase 72)
 *
 * Implements the core 14-state incident lifecycle state machine, real timestamp SLA engine,
 * deterministic 6-factor priority engine, ownership management, response action lifecycle,
 * independent verification decoupling, post-incident review, and detection gap feedback loops.
 */

const Incident = require('../../models/Incident');
const IncidentTask = require('../../models/IncidentTask');
const EvidenceRecord = require('../../models/EvidenceRecord');
const ThreatHunt = require('../../models/ThreatHunt');
const DetectionRule = require('../../models/DetectionRule');
const PendingApproval = require('../../models/PendingApproval');
const safePlaybookAutomationService = require('./SafePlaybookAutomationService');
const auditLogger = require('../../utils/auditLogger');
const logger = require('../../utils/logger');

// Strict 14-State Transition Graph
const LEGAL_TRANSITIONS = {
  DETECTED: ['TRIAGING', 'CANCELLED'],
  TRIAGING: ['INVESTIGATING', 'CANCELLED'],
  INVESTIGATING: ['CONTAINMENT_PENDING', 'CONTAINED', 'CANCELLED'],
  CONTAINMENT_PENDING: ['CONTAINED', 'FAILED'],
  CONTAINED: ['ERADICATION_PENDING', 'ERADICATING', 'RECOVERING'],
  ERADICATION_PENDING: ['ERADICATING', 'FAILED'],
  ERADICATING: ['RECOVERING', 'CONTAINED', 'FAILED'],
  RECOVERING: ['VALIDATION', 'RESOLVED', 'FAILED'],
  VALIDATION: ['RESOLVED', 'RECOVERING', 'FAILED'],
  RESOLVED: ['CLOSED', 'REOPENED'],
  CLOSED: ['REOPENED'],
  REOPENED: ['TRIAGING', 'INVESTIGATING'],
  CANCELLED: ['REOPENED'],
  FAILED: ['INVESTIGATING', 'RECOVERING'],
};

class IncidentResponseService {
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
   * Calculates deterministic 6-factor business priority
   */
  calculatePriority({
    assetCriticality = 'MEDIUM',
    incidentSeverity = 'MEDIUM',
    exploitability = 50,
    confidence = 75,
    businessImpact = 'MEDIUM',
    activeCompromise = false,
  }) {
    const assetWeights = { CRITICAL: 30, HIGH: 20, MEDIUM: 10, LOW: 5 };
    const severityWeights = { CRITICAL: 30, HIGH: 20, MEDIUM: 10, LOW: 5, INFO: 2, INFORMATIONAL: 2 };
    const impactWeights = { CRITICAL: 10, HIGH: 8, MEDIUM: 5, LOW: 2 };

    const wAsset = assetWeights[String(assetCriticality).toUpperCase()] || 10;
    const wSev = severityWeights[String(incidentSeverity).toUpperCase()] || 10;
    const wExploit = Math.min(15, Math.max(0, (Number(exploitability) || 50) * 0.15));
    const wConf = Math.min(10, Math.max(0, (Number(confidence) || 75) * 0.10));
    const wImpact = impactWeights[String(businessImpact).toUpperCase()] || 5;
    const wActive = activeCompromise ? 15 : 0;

    const calculatedScore = Math.min(100, Math.round(wAsset + wSev + wExploit + wConf + wImpact + wActive));

    let level = 'MEDIUM';
    if (calculatedScore >= 85) level = 'CRITICAL';
    else if (calculatedScore >= 65) level = 'HIGH';
    else if (calculatedScore >= 40) level = 'MEDIUM';
    else if (calculatedScore >= 20) level = 'LOW';
    else level = 'INFORMATIONAL';

    return {
      level,
      factors: {
        assetCriticality,
        incidentSeverity,
        exploitability: Number(exploitability) || 50,
        confidence: Number(confidence) || 75,
        businessImpact,
        activeCompromise: Boolean(activeCompromise),
      },
      calculatedScore,
    };
  }

  /**
   * Calculates SLA deadlines from creation time and priority
   */
  calculateSLADeadlines(priorityLevel = 'MEDIUM', createdAt = new Date()) {
    const base = new Date(createdAt).getTime();
    const durations = {
      CRITICAL: { ack: 15 * 60, inv: 60 * 60, cont: 2 * 3600, res: 4 * 3600 },
      HIGH: { ack: 30 * 60, inv: 2 * 3600, cont: 4 * 3600, res: 8 * 3600 },
      MEDIUM: { ack: 60 * 60, inv: 4 * 3600, cont: 8 * 3600, res: 24 * 3600 },
      LOW: { ack: 2 * 3600, inv: 8 * 3600, cont: 16 * 3600, res: 48 * 3600 },
      INFORMATIONAL: { ack: 4 * 3600, inv: 12 * 3600, cont: 24 * 3600, res: 72 * 3600 },
    };

    const norm = String(priorityLevel).toUpperCase();
    const d = durations[norm] || durations.MEDIUM;

    return {
      policyId: `SLA-POLICY-${norm}`,
      acknowledgedAt: null,
      acknowledgementDeadline: new Date(base + d.ack * 1000),
      investigationDeadline: new Date(base + d.inv * 1000),
      containmentDeadline: new Date(base + d.cont * 1000),
      resolutionDeadline: new Date(base + d.res * 1000),
      status: 'ON_TRACK',
      breachedAt: null,
      pausedAt: null,
      pausedDurationMs: 0,
    };
  }

  /**
   * Dynamically evaluates real timestamp SLA status for an incident
   */
  evaluateSLAStatus(incident) {
    if (!incident || !incident.sla) return 'ON_TRACK';

    const status = incident.status;
    if (status === 'RESOLVED' || status === 'CLOSED') {
      return 'COMPLETED';
    }
    if (incident.sla.pausedAt) {
      return 'PAUSED';
    }

    const now = Date.now();
    let activeDeadline = null;

    if (!incident.sla.acknowledgedAt && incident.sla.acknowledgementDeadline) {
      activeDeadline = new Date(incident.sla.acknowledgementDeadline).getTime();
    } else if (['DETECTED', 'TRIAGING', 'INVESTIGATING'].includes(status) && incident.sla.investigationDeadline) {
      activeDeadline = new Date(incident.sla.investigationDeadline).getTime();
    } else if (['CONTAINMENT_PENDING', 'CONTAINED', 'ERADICATION_PENDING', 'ERADICATING'].includes(status) && incident.sla.containmentDeadline) {
      activeDeadline = new Date(incident.sla.containmentDeadline).getTime();
    } else if (incident.sla.resolutionDeadline) {
      activeDeadline = new Date(incident.sla.resolutionDeadline).getTime();
    }

    if (!activeDeadline) return 'ON_TRACK';

    if (now > activeDeadline) {
      return 'BREACHED';
    }

    const createdAt = new Date(incident.createdAt || Date.now()).getTime();
    const totalDuration = activeDeadline - createdAt;
    const elapsed = now - createdAt;

    if (totalDuration > 0 && elapsed / totalDuration >= 0.75) {
      return 'AT_RISK';
    }

    return 'ON_TRACK';
  }

  /**
   * Enforces server-side state machine transition across all 14 states
   */
  async transitionState(incidentId, toState, {
    actor = {},
    reason = '',
    evidenceRef = null,
    organizationId = null,
  } = {}) {
    const normTarget = String(toState).toUpperCase();
    const query = { incidentId };
    if (organizationId) {
      query.$or = [{ organizationId }, { organizationId: null }];
    }

    const incident = await Incident.findOne(query);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    const currentState = incident.status;
    const allowed = LEGAL_TRANSITIONS[currentState] || [];

    if (!allowed.includes(normTarget)) {
      throw new Error(
        `Illegal transition: Cannot transition incident ${incidentId} from ${currentState} to ${normTarget}. Allowed transitions: [${allowed.join(', ')}]`
      );
    }

    // High/Critical Incident Postmortem requirement check on CLOSED
    if (normTarget === 'CLOSED') {
      const isHighSev = ['HIGH', 'CRITICAL'].includes(incident.severity);
      if (isHighSev && (!incident.closure?.rootCause || !incident.closure?.lessonsLearned)) {
        throw new Error(
          `Cannot close ${incident.severity} incident without completing mandatory postmortem (rootCause and lessonsLearned are required)`
        );
      }
    }

    const previousState = currentState;
    incident.status = normTarget;

    // Acknowledgement stamp
    if (currentState === 'DETECTED' && normTarget === 'TRIAGING' && !incident.sla.acknowledgedAt) {
      incident.sla.acknowledgedAt = new Date();
    }

    // Reopen history handling
    if (normTarget === 'REOPENED') {
      incident.reopenHistory.push({
        reopenedAt: new Date(),
        reopenedBy: {
          id: actor.id || actor.userId || null,
          name: actor.name || actor.username || 'ANALYST',
        },
        reopenReason: reason || 'Reopened with new evidence',
        triggeringEvidenceId: evidenceRef || null,
      });
    }

    // Timeline record
    incident.timeline.push({
      timestamp: new Date(),
      eventType: 'STATUS_CHANGE',
      description: `State transitioned from ${previousState} to ${normTarget}. Reason: ${reason || 'Operational progression'}`,
      actor: actor.name || actor.username || 'ANALYST',
      evidenceRef: evidenceRef || null,
    });

    // Update SLA status
    incident.sla.status = this.evaluateSLAStatus(incident);

    await incident.save();

    this.emitRealTimeEvent('incident:transitioned', {
      incidentId,
      previousState,
      newState: normTarget,
      actor: actor.username || actor.name,
      reason,
      slaStatus: incident.sla.status,
    });

    await auditLogger.log({
      actor,
      action: 'INCIDENT_TRANSITIONED',
      resource: { type: 'INCIDENT', id: incidentId },
      outcome: 'SUCCESS',
      details: { previousState, newState: normTarget, reason, evidenceRef },
    });

    return incident;
  }

  /**
   * Incident Assignment Operations (assign, reassign, claim, unassign)
   */
  async assignIncident(incidentId, {
    primaryAnalyst = null,
    backupAnalyst = null,
    team = 'SOC-Tier1',
    escalationOwner = null,
    actor = {},
    organizationId = null,
  } = {}) {
    const query = { incidentId };
    if (organizationId) {
      query.$or = [{ organizationId }, { organizationId: null }];
    }

    const incident = await Incident.findOne(query);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    const prevAnalyst = incident.assignment?.primaryAnalyst?.name || 'Unassigned';

    incident.assignment = {
      primaryAnalyst: primaryAnalyst
        ? {
            id: primaryAnalyst.id || primaryAnalyst.userId || null,
            name: primaryAnalyst.name || primaryAnalyst.username || 'Analyst',
            email: primaryAnalyst.email || null,
          }
        : { id: null, name: null, email: null },
      backupAnalyst: backupAnalyst
        ? {
            id: backupAnalyst.id || backupAnalyst.userId || null,
            name: backupAnalyst.name || backupAnalyst.username || null,
          }
        : { id: null, name: null },
      team: team || incident.assignment?.team || 'SOC-Tier1',
      escalationOwner: escalationOwner
        ? {
            id: escalationOwner.id || escalationOwner.userId || null,
            name: escalationOwner.name || escalationOwner.username || null,
          }
        : { id: null, name: null },
      assignedAt: new Date(),
      assignedBy: {
        id: actor.id || actor.userId || null,
        name: actor.name || actor.username || 'SYSTEM',
      },
    };

    incident.timeline.push({
      timestamp: new Date(),
      eventType: 'ANALYZED',
      description: `Ownership assigned to ${incident.assignment.primaryAnalyst.name || 'Unassigned'} (team: ${incident.assignment.team}). Previous: ${prevAnalyst}`,
      actor: actor.name || actor.username || 'SYSTEM',
    });

    await incident.save();

    this.emitRealTimeEvent('incident:assigned', {
      incidentId,
      assignedTo: incident.assignment.primaryAnalyst,
      team: incident.assignment.team,
      assignedBy: actor.username || actor.name,
    });

    await auditLogger.log({
      actor,
      action: 'INCIDENT_ASSIGNED',
      resource: { type: 'INCIDENT', id: incidentId },
      outcome: 'SUCCESS',
      details: {
        primaryAnalyst: incident.assignment.primaryAnalyst,
        team: incident.assignment.team,
      },
    });

    return incident;
  }

  /**
   * Claim incident ownership
   */
  async claimIncident(incidentId, actor = {}, organizationId = null) {
    return this.assignIncident(incidentId, {
      primaryAnalyst: {
        id: actor.id || actor.userId,
        name: actor.name || actor.username,
        email: actor.email || null,
      },
      actor,
      organizationId,
    });
  }

  /**
   * Unassign incident
   */
  async unassignIncident(incidentId, actor = {}, organizationId = null) {
    return this.assignIncident(incidentId, {
      primaryAnalyst: null,
      backupAnalyst: null,
      actor,
      organizationId,
    });
  }

  /**
   * Proposes a response action on an incident
   */
  async proposeResponseAction(incidentId, {
    actionType,
    playbookId = null,
    target,
    parameters = {},
    riskClass = 'USER_APPROVED',
    reason,
    actor = {},
    organizationId = null,
  }) {
    const query = { incidentId };
    if (organizationId) {
      query.$or = [{ organizationId }, { organizationId: null }];
    }

    const incident = await Incident.findOne(query);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    const actionId = `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const needsApproval = ['USER_APPROVED', 'PRIVILEGED'].includes(riskClass);

    let approvalId = null;
    if (needsApproval) {
      const approval = await safePlaybookAutomationService.proposeAction({
        incidentId,
        playbookId,
        actionType,
        riskLevel: riskClass,
        target,
        tool: parameters?.tool || null,
        parameters,
        reason: reason || `Automated response action proposed for incident ${incidentId}`,
        requestedBy: actor,
        organizationId,
      });
      approvalId = approval.approvalId;
    }

    const actionRecord = {
      actionId,
      playbookId,
      type: actionType,
      target,
      parameters,
      riskClass,
      status: needsApproval ? 'AWAITING_APPROVAL' : 'PROPOSED',
      verificationStatus: 'UNVERIFIED',
      verificationDetails: '',
      requestedAt: new Date(),
      executionId: approvalId,
    };

    incident.responseActions.push(actionRecord);
    incident.timeline.push({
      timestamp: new Date(),
      eventType: 'RESPONDED',
      description: `Response action proposed: ${actionType} on target ${target} (${riskClass})`,
      actor: actor.name || actor.username || 'ANALYST',
      evidenceRef: actionId,
    });

    await incident.save();

    this.emitRealTimeEvent('response:requested', {
      incidentId,
      actionId,
      actionType,
      target,
      riskClass,
      status: actionRecord.status,
    });

    return actionRecord;
  }

  /**
   * Executes an approved response action
   * NOTE: Command exit code 0 != Security Verification! Verification remains UNVERIFIED.
   */
  async executeResponseAction(incidentId, actionId, actor = {}, organizationId = null) {
    const query = { incidentId };
    if (organizationId) {
      query.$or = [{ organizationId }, { organizationId: null }];
    }

    const incident = await Incident.findOne(query);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    const action = incident.responseActions.find((a) => a.actionId === actionId);
    if (!action) {
      throw new Error(`Response action ${actionId} not found on incident ${incidentId}`);
    }

    action.status = 'EXECUTING';
    await incident.save();

    this.emitRealTimeEvent('response:executing', { incidentId, actionId });

    let execResult = null;
    let isSuccess = false;

    try {
      if (action.executionId && action.executionId.startsWith('APPR-')) {
        // Delegate to SafePlaybookAutomationService
        const res = await safePlaybookAutomationService.approveAndExecuteAction(
          action.executionId,
          actor,
          'Executed via Incident Command Center'
        );
        execResult = res.executionResult || res;
        isSuccess = res.status === 'COMPLETED';
      } else {
        // Direct safe simulated execution
        execResult = { message: `Executed ${action.type} against ${action.target}` };
        isSuccess = true;
      }

      // Re-fetch fresh incident document to prevent Mongoose VersionError caused by concurrent safePlaybookAutomationService save
      const freshIncident = await Incident.findOne(query);
      if (!freshIncident) {
        throw new Error(`Incident ${incidentId} not found`);
      }

      const targetAction =
        freshIncident.responseActions.find(
          (a) =>
            a.actionId === actionId ||
            a.executionId === actionId ||
            (action.executionId && (a.actionId === action.executionId || a.executionId === action.executionId))
        ) || freshIncident.responseActions[freshIncident.responseActions.length - 1];

      if (targetAction) {
        targetAction.status = isSuccess ? 'SUCCEEDED' : 'FAILED';
        targetAction.completedAt = new Date();
        targetAction.result = execResult;
        targetAction.approvedBy = actor.username || actor.name || 'OPERATOR';
        targetAction.approvedAt = new Date();
        // Crucial: verificationStatus remains UNVERIFIED
        targetAction.verificationStatus = 'UNVERIFIED';
      }

      freshIncident.timeline.push({
        timestamp: new Date(),
        eventType: 'RESPONDED',
        description: `Response action ${targetAction?.type || action.type} executed with status: ${targetAction?.status || (isSuccess ? 'SUCCEEDED' : 'FAILED')}. (Awaiting independent security verification)`,
        actor: actor.name || actor.username || 'OPERATOR',
        evidenceRef: actionId,
      });

      await freshIncident.save();

      this.emitRealTimeEvent('response:completed', {
        incidentId,
        actionId,
        status: targetAction?.status || (isSuccess ? 'SUCCEEDED' : 'FAILED'),
        verificationStatus: 'UNVERIFIED',
      });

      return targetAction || action;
    } catch (execErr) {
      try {
        const freshIncident = await Incident.findOne(query);
        if (freshIncident) {
          const targetAction = freshIncident.responseActions.find(
            (a) => a.actionId === actionId || a.executionId === actionId
          );
          if (targetAction) {
            targetAction.status = 'FAILED';
            targetAction.completedAt = new Date();
            targetAction.result = { error: execErr.message };
            await freshIncident.save();
          }
        }
      } catch (_) {}

      this.emitRealTimeEvent('response:completed', {
        incidentId,
        actionId,
        status: 'FAILED',
        error: execErr.message,
      });

      throw execErr;
    }
  }

  /**
   * Independently verifies response action remediation with follow-up evidence
   */
  async verifyResponseAction(incidentId, actionId, {
    verificationMethod = 'DIAGNOSTIC_TOOL',
    evidenceId = null,
    result = 'PASS',
    notes = '',
    verifier = {},
    organizationId = null,
  }) {
    const validResults = ['PASS', 'FAIL', 'INCONCLUSIVE'];
    if (!validResults.includes(result)) {
      throw new Error(`Verification result must be one of: [${validResults.join(', ')}]`);
    }

    const query = { incidentId };
    if (organizationId) {
      query.$or = [{ organizationId }, { organizationId: null }];
    }

    const incident = await Incident.findOne(query);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    const action = incident.responseActions.find((a) => a.actionId === actionId);
    if (!action) {
      throw new Error(`Response action ${actionId} not found on incident ${incidentId}`);
    }

    action.verificationStatus = result;
    action.verificationDetails = `Method: ${verificationMethod}. Evidence: ${evidenceId || 'N/A'}. Details: ${notes}`;
    action.verifiedAt = new Date();
    action.verifiedBy = verifier.name || verifier.username || 'INDEPENDENT_VERIFIER';

    incident.timeline.push({
      timestamp: new Date(),
      eventType: 'ANALYZED',
      description: `Response action ${action.type} verification completed: ${result} by ${action.verifiedBy}`,
      actor: action.verifiedBy,
      evidenceRef: evidenceId || actionId,
    });

    await incident.save();

    this.emitRealTimeEvent('response:verified', {
      incidentId,
      actionId,
      verificationStatus: result,
      verifier: action.verifiedBy,
    });

    await auditLogger.log({
      actor: verifier,
      action: 'RESPONSE_VERIFIED',
      resource: { type: 'INCIDENT', id: incidentId },
      outcome: result === 'PASS' ? 'SUCCESS' : 'WARN',
      details: { actionId, verificationStatus: result, evidenceId, notes },
    });

    return action;
  }

  /**
   * Structured closure with mandatory post-incident review for High/Critical incidents
   */
  async closeIncident(incidentId, {
    rootCause = '',
    impact = '',
    containmentSummary = '',
    eradicationSummary = '',
    recoveryVerification = '',
    evidenceSummary = '',
    lessonsLearned = '',
    detectionGaps = '',
    followUpHunts = [],
    followUpTasks = [],
    actor = {},
    organizationId = null,
  }) {
    const query = { incidentId };
    if (organizationId) {
      query.$or = [{ organizationId }, { organizationId: null }];
    }

    const incident = await Incident.findOne(query);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    const isHighSev = ['HIGH', 'CRITICAL'].includes(incident.severity);
    if (isHighSev) {
      if (!rootCause || !impact || !containmentSummary || !lessonsLearned) {
        throw new Error(
          `Closing ${incident.severity} incident requires complete post-incident review: rootCause, impact, containmentSummary, and lessonsLearned are mandatory.`
        );
      }
    }

    incident.closure = {
      closedAt: new Date(),
      closedBy: {
        id: actor.id || actor.userId || null,
        name: actor.name || actor.username || 'ANALYST',
      },
      rootCause,
      impact,
      containmentSummary,
      eradicationSummary,
      recoveryVerification,
      evidenceSummary,
      lessonsLearned,
      detectionGaps,
      followUpHunts: Array.isArray(followUpHunts) ? followUpHunts : [],
      followUpTasks: Array.isArray(followUpTasks) ? followUpTasks : [],
      postIncidentReviewRequired: isHighSev,
      postIncidentReviewCompleted: Boolean(rootCause && lessonsLearned),
    };

    await incident.save();

    return this.transitionState(incidentId, 'CLOSED', {
      actor,
      reason: `Incident closed after resolution and postmortem review`,
      organizationId,
    });
  }

  /**
   * Reopens a closed or cancelled incident with real triggering evidence
   */
  async reopenIncident(incidentId, {
    reason,
    triggeringEvidenceId,
    actor = {},
    organizationId = null,
  }) {
    if (!reason || !reason.trim()) {
      throw new Error('Reopen reason is required');
    }
    if (!triggeringEvidenceId) {
      throw new Error('Triggering evidence reference is required to reopen an incident');
    }

    return this.transitionState(incidentId, 'REOPENED', {
      actor,
      reason,
      evidenceRef: triggeringEvidenceId,
      organizationId,
    });
  }

  /**
   * Generates feedback candidate hunt & detection rule from detection gaps
   */
  async generateDetectionGapFeedback(incidentId, actor = {}, organizationId = null) {
    const query = { incidentId };
    if (organizationId) {
      query.$or = [{ organizationId }, { organizationId: null }];
    }

    const incident = await Incident.findOne(query);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    const gaps = incident.closure?.detectionGaps || `Detection gap observed in incident ${incidentId} (${incident.classification?.tactic || 'ATTACK'})`;
    const huntId = `HUNT-GAP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Candidate Hunt in DRAFT
    const hunt = await ThreatHunt.create({
      huntId,
      name: `Hunt: ${incident.title.substring(0, 50)} Detection Gap`,
      description: `Generated from incident ${incidentId} post-incident review. Gaps: ${gaps}`,
      hypothesis: `Adversaries utilizing ${incident.classification?.tactic || 'ATTACK'} tactics in ${incident.classification?.environment || 'Production'} may evade current static signatures.`,
      category: 'BEHAVIORAL',
      structuredQuery: {
        entity: 'finding',
        conditions: [
          {
            field: 'severity',
            operator: 'in',
            value: ['HIGH', 'CRITICAL'],
          },
        ],
        booleanLogic: 'AND',
      },
      dataSources: ['FINDINGS', 'ALERTS', 'INCIDENTS'],
      status: 'DRAFT', // Never auto-activated!
      createdBy: actor.name || actor.username || 'INCIDENT_FEEDBACK_ENGINE',
      organizationId,
    });

    // Candidate Detection Rule in DRAFT
    const ruleId = `RULE-GAP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const rule = await DetectionRule.create({
      ruleId,
      name: `Detection Rule: ${incident.title.substring(0, 50)} Gap`,
      description: `Draft detection rule addressing detection gap from incident ${incidentId}`,
      severity: incident.severity || 'MEDIUM',
      category: incident.classification?.attackCategory || 'MALWARE',
      tactic: incident.classification?.tactic || 'OTHER',
      enabled: false, // Never auto-activated! Requires operator approval.
      status: 'DRAFT',
      organizationId,
    });

    incident.timeline.push({
      timestamp: new Date(),
      eventType: 'ANALYZED',
      description: `Detection gap feedback generated candidate Hunt (${huntId}) and candidate Rule (${ruleId}) in DRAFT status`,
      actor: actor.name || actor.username || 'FEEDBACK_ENGINE',
      evidenceRef: huntId,
    });
    await incident.save();

    return {
      hunt,
      rule,
    };
  }

  /**
   * Incident Task Operations
   */
  async createTask({
    incidentId,
    caseId = null,
    title,
    description = '',
    priority = 'MEDIUM',
    assignee = {},
    dueAt = null,
    dependencies = [],
    checklist = [],
    createdBy = {},
    organizationId = null,
  }) {
    if (!title || !incidentId) {
      throw new Error('Title and incidentId are required to create a task');
    }

    const taskId = `TASK-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const task = await IncidentTask.create({
      taskId,
      incidentId,
      caseId,
      title,
      description,
      priority,
      assignee: {
        id: assignee.id || assignee.userId || null,
        name: assignee.name || assignee.username || 'Unassigned',
      },
      dueAt,
      dependencies: Array.isArray(dependencies) ? dependencies : [],
      checklist: Array.isArray(checklist)
        ? checklist.map((item, idx) => ({
            itemId: `item_${idx}`,
            text: typeof item === 'string' ? item : item.text,
            completed: Boolean(item.completed),
          }))
        : [],
      createdBy: {
        id: createdBy.id || createdBy.userId || null,
        name: createdBy.name || createdBy.username || 'SYSTEM',
      },
      organizationId,
    });

    this.emitRealTimeEvent('incident:task-updated', {
      taskId,
      incidentId,
      status: 'TODO',
      action: 'CREATED',
    });

    return task;
  }

  async updateTask(taskId, updates = {}, actor = {}, organizationId = null) {
    const query = { taskId };
    if (organizationId) {
      query.$or = [{ organizationId }, { organizationId: null }];
    }

    const task = await IncidentTask.findOne(query);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Dependency check if updating to DONE
    if (updates.status === 'DONE' && Array.isArray(task.dependencies) && task.dependencies.length > 0) {
      const depTasks = await IncidentTask.find({ taskId: { $in: task.dependencies } });
      const unresolved = depTasks.filter((d) => d.status !== 'DONE');
      if (unresolved.length > 0) {
        throw new Error(
          `Cannot mark task ${taskId} as DONE. Unresolved dependencies: [${unresolved.map((u) => u.taskId).join(', ')}]`
        );
      }
    }

    if (updates.status === 'DONE' && task.status !== 'DONE') {
      task.completedBy = {
        id: actor.id || actor.userId || null,
        name: actor.name || actor.username || 'SYSTEM',
      };
      task.completedAt = new Date();
    }

    Object.assign(task, updates);
    await task.save();

    this.emitRealTimeEvent('incident:task-updated', {
      taskId,
      incidentId: task.incidentId,
      status: task.status,
      action: 'UPDATED',
    });

    return task;
  }
}

module.exports = new IncidentResponseService();
