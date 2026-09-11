/**
 * 🛡️ CyberShield X — ThreatHuntExecutionService (Phase 71)
 *
 * Orchestrates asynchronous hunt execution, measurable progress broadcasting,
 * cancellation, evidence promotion to Finding/Incident, and feedback loop
 * to candidate Detection Rules in DRAFT status.
 */

const crypto = require('crypto');
const ThreatHunt = require('../../models/ThreatHunt');
const ThreatHuntExecution = require('../../models/ThreatHuntExecution');
const Finding = require('../../models/Finding');
const Incident = require('../../models/Incident');
const DetectionRule = require('../../models/DetectionRule');
const threatHuntQueryEngine = require('./ThreatHuntQueryEngine');
const auditLogger = require('../../utils/auditLogger');
const logger = require('../../utils/logger');

class ThreatHuntExecutionService {
  constructor() {
    this.activeExecutions = new Map(); // executionId -> Promise/AbortController
    this.io = null;
  }

  setIO(ioInstance) {
    this.io = ioInstance;
  }

  _getIO(req) {
    if (this.io) return this.io;
    if (req && req.app && typeof req.app.get === 'function') {
      return req.app.get('io');
    }
    return null;
  }

  _broadcast(eventName, payload, customIO = null) {
    const io = customIO || this.io;
    if (!io) return;
    try {
      io.emit(eventName, payload);
    } catch (err) {
      logger.warn(`Failed to broadcast ${eventName}: ${err.message}`);
    }
  }

  /**
   * Triggers an asynchronous threat hunt execution
   * @param {Object} params - { huntId, user, organizationId, customIO }
   * @returns {Promise<Object>} Execution record
   */
  async triggerHuntExecution({ huntId, user, organizationId = null, customIO = null }) {
    const hunt = await ThreatHunt.findOne({
      huntId,
      ...(organizationId ? { $or: [{ organizationId }, { organizationId: null }] } : {}),
    });

    if (!hunt) {
      throw new Error(`ThreatHunt not found: ${huntId}`);
    }

    const executionId = `HEX-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const startedAt = new Date();

    // 1. Create initial RUNNING execution record
    const resolvedTime = threatHuntQueryEngine.resolveTimeRange(hunt.timeRange);

    const execution = await ThreatHuntExecution.create({
      executionId,
      huntId: hunt.huntId,
      huntName: hunt.name,
      organizationId: hunt.organizationId || organizationId,
      triggeredBy: user?.username || user?.email || 'ANALYST',
      triggerType: 'MANUAL',
      status: 'RUNNING',
      startedAt,
      resolvedTimeRange: resolvedTime,
      querySnapshot: hunt.structuredQuery,
      dataSourcesQueried: hunt.dataSources,
      resultCount: 0,
      evidence: [],
    });

    // Update parent hunt status
    await ThreatHunt.updateOne(
      { huntId: hunt.huntId },
      {
        $set: { status: 'RUNNING', lastExecutionId: executionId },
        $inc: { executionCount: 1 },
      }
    );

    this._broadcast(
      'hunt:started',
      {
        executionId,
        huntId: hunt.huntId,
        huntName: hunt.name,
        startedAt,
        status: 'RUNNING',
      },
      customIO
    );

    auditLogger.logEvent({
      action: 'THREAT_HUNT_EXECUTION_STARTED',
      actor: user?.username || 'ANALYST',
      actorRole: user?.role || 'analyst',
      organizationId: hunt.organizationId || organizationId,
      details: { huntId: hunt.huntId, executionId, query: hunt.structuredQuery },
    });

    // 2. Execute query asynchronously
    const executePromise = (async () => {
      try {
        const result = await threatHuntQueryEngine.executeQuery({
          structuredQuery: hunt.structuredQuery,
          dataSources: hunt.dataSources,
          timeRange: hunt.timeRange,
          organizationId: hunt.organizationId || organizationId,
        });

        const completedAt = new Date();
        const durationMs = completedAt.getTime() - startedAt.getTime();
        const finalStatus = result.matched ? 'MATCHED' : 'NO_MATCH';

        // Check if cancelled before writing
        const currentRec = await ThreatHuntExecution.findOne({ executionId });
        if (currentRec && currentRec.status === 'CANCELLED') {
          return;
        }

        const updatedExecution = await ThreatHuntExecution.findOneAndUpdate(
          { executionId },
          {
            $set: {
              status: finalStatus,
              completedAt,
              durationMs,
              resultCount: result.resultCount,
              evidence: result.evidence,
              resolvedTimeRange: result.resolvedTimeRange,
            },
          },
          { new: true }
        );

        await ThreatHunt.updateOne(
          { huntId: hunt.huntId },
          { $set: { status: finalStatus } }
        );

        this._broadcast(
          'hunt:completed',
          {
            executionId,
            huntId: hunt.huntId,
            huntName: hunt.name,
            status: finalStatus,
            resultCount: result.resultCount,
            durationMs,
          },
          customIO
        );

        auditLogger.logEvent({
          action: 'THREAT_HUNT_EXECUTION_COMPLETED',
          actor: user?.username || 'ANALYST',
          actorRole: user?.role || 'analyst',
          organizationId: hunt.organizationId || organizationId,
          details: { huntId: hunt.huntId, executionId, finalStatus, resultCount: result.resultCount },
        });

        return updatedExecution;
      } catch (err) {
        const completedAt = new Date();
        const durationMs = completedAt.getTime() - startedAt.getTime();

        await ThreatHuntExecution.updateOne(
          { executionId },
          {
            $set: {
              status: 'FAILED',
              completedAt,
              durationMs,
              error: { message: err.message },
            },
          }
        );

        await ThreatHunt.updateOne(
          { huntId: hunt.huntId },
          { $set: { status: 'FAILED' } }
        );

        this._broadcast(
          'hunt:failed',
          {
            executionId,
            huntId: hunt.huntId,
            error: err.message,
          },
          customIO
        );

        logger.error(`Threat hunt execution failed: ${err.message}`);
      } finally {
        this.activeExecutions.delete(executionId);
      }
    })();

    this.activeExecutions.set(executionId, executePromise);
    return execution;
  }

  /**
   * Cancels a running hunt execution
   * @param {string} executionId
   * @param {Object} user
   * @param {Object} customIO
   * @returns {Promise<Object>} Cancelled execution record
   */
  async cancelExecution(executionId, user, customIO = null) {
    const execution = await ThreatHuntExecution.findOne({ executionId });
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    if (execution.status !== 'RUNNING') {
      throw new Error(`Execution cannot be cancelled in state: ${execution.status}`);
    }

    const completedAt = new Date();
    const durationMs = completedAt.getTime() - execution.startedAt.getTime();

    const cancelled = await ThreatHuntExecution.findOneAndUpdate(
      { executionId },
      {
        $set: {
          status: 'CANCELLED',
          completedAt,
          durationMs,
        },
      },
      { new: true }
    );

    await ThreatHunt.updateOne(
      { huntId: execution.huntId },
      { $set: { status: 'CANCELLED' } }
    );

    this.activeExecutions.delete(executionId);

    this._broadcast(
      'hunt:cancelled',
      { executionId, huntId: execution.huntId, status: 'CANCELLED' },
      customIO
    );

    auditLogger.logEvent({
      action: 'THREAT_HUNT_EXECUTION_CANCELLED',
      actor: user?.username || 'ANALYST',
      actorRole: user?.role || 'analyst',
      organizationId: execution.organizationId,
      details: { executionId, huntId: execution.huntId },
    });

    return cancelled;
  }

  /**
   * Promotes observed hunt evidence to a new Finding with immutable lineage
   * @param {Object} params - { executionId, evidenceId, title, severity, user }
   * @returns {Promise<Object>} Promoted Finding
   */
  async promoteEvidenceToFinding({ executionId, evidenceId, title, severity = 'MEDIUM', user }) {
    const execution = await ThreatHuntExecution.findOne({ executionId });
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    const evidence = execution.evidence.find((e) => e.evidenceId === evidenceId);
    if (!evidence) {
      throw new Error(`Evidence item not found: ${evidenceId}`);
    }

    const findingId = `FIND-HUNT-${Date.now().toString().slice(-6)}`;
    const finding = await Finding.create({
      findingId,
      title: title || `Threat Hunt Finding: ${evidence.title}`,
      description: `Promoted from Threat Hunt [${execution.huntName}] (${execution.huntId}). Summary: ${evidence.summary}`,
      severity: severity.toUpperCase(),
      asset: evidence.sourceId || 'THREAT_HUNT_ASSET',
      affectedAsset: evidence.sourceId || 'THREAT_HUNT_ASSET',
      sourceTool: 'threat-hunting-workbench',
      executionId: execution.executionId,
      rawEvidence: {
        huntId: execution.huntId,
        executionId: execution.executionId,
        evidenceId: evidence.evidenceId,
        sourceEntity: evidence.sourceEntity,
        sourceId: evidence.sourceId,
        matchDetails: evidence.matchDetails,
        raw: evidence.rawEvidenceRef,
        promotedAt: new Date(),
        promotedBy: user?.username || 'ANALYST',
      },
      organizationId: execution.organizationId,
    });

    // Record promotion on execution record
    await ThreatHuntExecution.updateOne(
      { executionId },
      {
        $push: {
          promotedFindings: {
            id: findingId,
            promotedAt: new Date(),
            promotedBy: user?.username || 'ANALYST',
          },
        },
      }
    );

    auditLogger.logEvent({
      action: 'THREAT_HUNT_EVIDENCE_PROMOTED_TO_FINDING',
      actor: user?.username || 'ANALYST',
      actorRole: user?.role || 'analyst',
      organizationId: execution.organizationId,
      details: { executionId, evidenceId, findingId },
    });

    return finding;
  }

  /**
   * Promotes observed hunt evidence to an Incident with attack-chain linkage
   * @param {Object} params - { executionId, evidenceId, title, severity, user }
   * @returns {Promise<Object>} Promoted Incident
   */
  async promoteEvidenceToIncident({ executionId, evidenceId, title, severity = 'HIGH', user }) {
    const execution = await ThreatHuntExecution.findOne({ executionId });
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    const evidence = execution.evidence.find((e) => e.evidenceId === evidenceId);
    if (!evidence) {
      throw new Error(`Evidence item not found: ${evidenceId}`);
    }

    const incidentId = `INC-HUNT-${Date.now().toString().slice(-6)}`;
    const incident = await Incident.create({
      incidentId,
      title: title || `Threat Hunt Incident: ${evidence.title}`,
      description: `Elevated from Threat Hunt [${execution.huntName}] (${execution.huntId}) on execution ${execution.executionId}.`,
      severity: severity.toUpperCase(),
      status: 'DETECTED',
      affectedAssets: [evidence.sourceId || 'THREAT_HUNT_ASSET'],
      timeline: [
        {
          timestamp: new Date(),
          eventType: 'OBSERVED',
          description: `Incident created from Threat Hunt execution [${execution.executionId}]. Matched evidence: ${evidence.title}`,
          actor: user?.username || 'ANALYST',
        },
      ],
      organizationId: execution.organizationId,
    });

    // Record promotion on execution record
    await ThreatHuntExecution.updateOne(
      { executionId },
      {
        $push: {
          promotedIncidents: {
            id: incidentId,
            promotedAt: new Date(),
            promotedBy: user?.username || 'ANALYST',
          },
        },
      }
    );

    auditLogger.logEvent({
      action: 'THREAT_HUNT_EVIDENCE_PROMOTED_TO_INCIDENT',
      actor: user?.username || 'ANALYST',
      actorRole: user?.role || 'analyst',
      organizationId: execution.organizationId,
      details: { executionId, evidenceId, incidentId },
    });

    return incident;
  }

  /**
   * Creates a candidate Detection Rule based on the verified hunt query pattern
   * Strictly adheres to Phase 70 governance: Starts in DRAFT status, enabled: false,
   * requiring testing and human operator approval before activation.
   * @param {Object} params - { huntId, executionId, user }
   * @returns {Promise<Object>} Candidate Detection Rule
   */
  async draftDetectionFromHunt({ huntId, executionId, user }) {
    const hunt = await ThreatHunt.findOne({ huntId });
    if (!hunt) {
      throw new Error(`Hunt not found: ${huntId}`);
    }

    const ruleId = `RULE-HUNT-${Date.now().toString().slice(-6)}`;
    const rule = await DetectionRule.create({
      ruleId,
      name: `Detection Candidate: ${hunt.name}`,
      description: `Candidate detection rule generated from verified Threat Hunt [${hunt.name}] (${hunt.huntId}). Hypothesis: ${hunt.hypothesis}`,
      severity: 'MEDIUM',
      category: hunt.category || 'suspicious_activity',
      status: 'DRAFT',
      enabled: false, // Inactive until approved
      version: 1,
      author: user?.username || 'ANALYST',
      isAiGenerated: false,
      aiDraft: false,
      conditions: hunt.structuredQuery?.conditions || [
        { field: 'severity', operator: 'equals', value: 'HIGH' },
      ],
      affectedEntityTypes: ['finding', 'alert'],
      tags: ['threat-hunt-feedback', hunt.category?.toLowerCase() || 'custom'],
      responsePolicy: {
        actionType: 'ALERT',
        requiresApproval: true,
      },
      organizationId: hunt.organizationId,
    });

    if (executionId) {
      await ThreatHuntExecution.updateOne(
        { executionId },
        { $set: { detectionCandidateId: ruleId } }
      );
    }

    auditLogger.logEvent({
      action: 'DETECTION_RULE_DRAFTED_FROM_HUNT',
      actor: user?.username || 'ANALYST',
      actorRole: user?.role || 'analyst',
      organizationId: hunt.organizationId,
      details: { huntId: hunt.huntId, executionId, ruleId },
    });

    return rule;
  }
}

module.exports = new ThreatHuntExecutionService();
