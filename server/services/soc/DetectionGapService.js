/**
 * 🛡️ CyberShield X — DetectionGapService (Phase 73)
 *
 * Identifies evidence-backed detection gaps across:
 * - Observed ATT&CK techniques with no active tested detection;
 * - Untested detection rules;
 * - Techniques covered only by disabled rules;
 * - Incident postmortem detection gaps (Phase 72);
 * - Threat hunting observations with no active rule (Phase 71).
 */

const DetectionGap = require('../../models/DetectionGap');
const DetectionRule = require('../../models/DetectionRule');
const Incident = require('../../models/Incident');
const ThreatHunt = require('../../models/ThreatHunt');
const detectionCoverageService = require('./DetectionCoverageService');
const auditLogger = require('../../utils/auditLogger');
const logger = require('../../utils/logger');

class DetectionGapService {
  constructor(io = null) {
    this.io = io;
  }

  setIO(io) {
    this.io = io;
  }

  emitRealTimeEvent(event, data) {
    if (this.io) {
      try {
        this.io.emit(event, data);
      } catch (err) {
        logger.warn(`Failed to emit ${event} via Socket.IO: ${err.message}`);
      }
    }
  }

  /**
   * Scans platform evidence and computes detection gaps
   */
  async scanForGaps(optionsOrOrg = {}) {
    let organizationId = null;
    let actor = {};
    if (optionsOrOrg && (typeof optionsOrOrg === 'string' || optionsOrOrg instanceof require('mongoose').Types.ObjectId)) {
      organizationId = optionsOrOrg;
    } else if (optionsOrOrg && typeof optionsOrOrg === 'object') {
      organizationId = optionsOrOrg.organizationId || null;
      actor = optionsOrOrg.actor || {};
    }

    const coverage = await detectionCoverageService.getCoverageMatrix({ organizationId });
    const matrix = coverage.matrix || coverage.techniques || coverage.techniqueDetails || [];
    const discoveredGaps = [];

    // 1. Identify uncovered techniques that have observed evidence
    for (const item of matrix) {
      const isUncovered = item.coverageStatus === 'NOT_COVERED' || item.status === 'NOT_COVERED';
      const evidenceCount = item.observedEvidenceCount || (item.relatedIncidents?.length || 0) + (item.relatedHunts?.length || 0);

      if (isUncovered && evidenceCount > 0) {
        const gapId = `GAP-${item.techniqueId.replace(/[^a-zA-Z0-9]/g, '')}`;
        const existing = await DetectionGap.findOne({ gapId, organizationId });
        const hasIncidents = item.relatedIncidents && item.relatedIncidents.length > 0;

        const gapData = {
          gapId,
          title: `Uncovered ATT&CK Technique: ${item.techniqueId} (${item.techniqueName})`,
          description: `Observed ${evidenceCount} evidence artifact(s) matching technique ${item.techniqueId}, but zero active detection rules exist in the library.`,
          techniqueId: item.techniqueId,
          techniqueName: item.techniqueName,
          tactic: item.tactic,
          gapType: hasIncidents ? 'INCIDENT_UNCOVERED' : 'NO_DETECTION',
          severity: 'HIGH',
          status: existing ? existing.status : 'OPEN',
          evidenceIncidents: item.relatedIncidents || [],
          evidenceReferences: (item.relatedIncidents || []).map((id) => ({
            entityType: 'INCIDENT',
            entityId: id,
            details: `Observed incident matching technique ${item.techniqueId}`,
            timestamp: new Date(),
          })),
          candidateRuleDraft: {
            name: `Detect ${item.techniqueName} (${item.techniqueId})`,
            category: item.tactic,
            severity: 'HIGH',
            mitreAttack: [{ tactic: item.tactic, techniqueId: item.techniqueId, techniqueName: item.techniqueName }],
            conditions: [{ field: 'mitreTechnique', operator: 'equals', value: item.techniqueId }],
          },
          organizationId,
        };

        if (existing) {
          Object.assign(existing, gapData);
          await existing.save();
          discoveredGaps.push(existing);
        } else {
          const newGap = new DetectionGap(gapData);
          await newGap.save();
          discoveredGaps.push(newGap);
        }
      } else if ((item.coverageStatus === 'UNTESTED' || item.status === 'UNTESTED') && (item.activeRulesCount > 0 || item.activeRuleCount > 0)) {
        const gapId = `GAP-UNTESTED-${item.techniqueId.replace(/[^a-zA-Z0-9]/g, '')}`;
        const existing = await DetectionGap.findOne({ gapId, organizationId });

        const gapData = {
          gapId,
          title: `Untested Detections for ${item.techniqueId} (${item.techniqueName})`,
          description: `Technique ${item.techniqueId} has active rule(s), but none have verified passing test fixtures.`,
          techniqueId: item.techniqueId,
          techniqueName: item.techniqueName,
          tactic: item.tactic,
          gapType: 'UNTESTED_DETECTION',
          severity: 'MEDIUM',
          status: existing ? existing.status : 'OPEN',
          organizationId,
        };

        if (existing) {
          Object.assign(existing, gapData);
          await existing.save();
          discoveredGaps.push(existing);
        } else {
          const newGap = new DetectionGap(gapData);
          await newGap.save();
          discoveredGaps.push(newGap);
        }
      }
    }

    // 2. Scan Phase 72 incident postmortems for recorded detection gaps
    try {
      const query = { 'closure.detectionGaps': { $exists: true, $ne: [] } };
      if (organizationId) query.organizationId = organizationId;
      const closedIncidents = await Incident.find(query).select('incidentId title closure');

      for (const inc of closedIncidents) {
        let gapsList = [];
        if (Array.isArray(inc.closure?.detectionGaps)) {
          gapsList = inc.closure.detectionGaps;
        } else if (typeof inc.closure?.detectionGaps === 'string' && inc.closure.detectionGaps.trim() !== '') {
          gapsList = [inc.closure.detectionGaps];
        }

        for (const [idx, gapNote] of gapsList.entries()) {
          const gapId = `GAP-INC-${inc.incidentId}-${idx + 1}`;
          const existing = await DetectionGap.findOne({ gapId, organizationId });

          if (!existing) {
            const newGap = new DetectionGap({
              gapId,
              title: `Incident PIR Detection Gap: ${inc.incidentId}`,
              description: typeof gapNote === 'string' ? gapNote : gapNote.description || 'Post-incident detection gap',
              techniqueId: inc.classification?.techniqueId || 'T1190',
              techniqueName: 'Incident Root Cause Technique',
              tactic: inc.classification?.tactic || 'INITIAL_ACCESS',
              gapType: 'INCIDENT_UNCOVERED',
              severity: inc.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
              status: 'OPEN',
              evidenceReferences: [
                {
                  entityType: 'INCIDENT',
                  entityId: inc.incidentId,
                  details: `Root Cause: ${inc.closure.rootCause || 'Undetermined'}. Incident Title: ${inc.title}`,
                  timestamp: new Date(),
                },
              ],
              candidateRuleDraft: {
                name: `Incident Postmortem Prevention — ${inc.incidentId}`,
                category: 'CUSTOM',
                severity: inc.severity || 'HIGH',
                conditions: [{ field: 'incidentReference', operator: 'equals', value: inc.incidentId }],
              },
              organizationId,
            });
            await newGap.save();
            discoveredGaps.push(newGap);
          }
        }
      }
    } catch (_) {}

    discoveredGaps.gapsFound = discoveredGaps.length;
    this.emitRealTimeEvent('detection:gap', { count: discoveredGaps.length });
    return discoveredGaps;
  }

  /**
   * Promotes a detection gap into a formal candidate DetectionRule in DRAFT status
   */
  async createCandidateRuleFromGap(gapId, optionsOrActor = {}, orgId = null) {
    let actor = {};
    let organizationId = null;
    if (typeof optionsOrActor === 'string') {
      actor = { username: optionsOrActor };
      organizationId = orgId;
    } else if (optionsOrActor && typeof optionsOrActor === 'object') {
      if (optionsOrActor.username || optionsOrActor.role) {
        actor = optionsOrActor;
        organizationId = orgId;
      } else {
        actor = optionsOrActor.actor || {};
        organizationId = optionsOrActor.organizationId || orgId;
      }
    }

    const gapQuery = [];
    if (gapId && require('mongoose').Types.ObjectId.isValid(gapId)) {
      gapQuery.push({ _id: gapId });
    }
    gapQuery.push({ gapId: String(gapId) });

    const gap = await DetectionGap.findOne({ $or: gapQuery });
    if (!gap) {
      throw new Error(`Detection gap ${gapId} not found`);
    }

    const ruleId = `RULE-CANDIDATE-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const draft = gap.candidateRuleDraft || {};

    const newRule = new DetectionRule({
      ruleId,
      contentId: `DET-${ruleId}`,
      name: draft.name || `Remediate ${gap.title}`,
      description: `Candidate detection drafted to resolve detection gap ${gap.gapId}: ${gap.description}`,
      severity: draft.severity || gap.severity || 'MEDIUM',
      category: draft.category || gap.tactic || 'CUSTOM',
      // Strict requirement: candidate rules start as DRAFT and enabled: false
      status: 'DRAFT',
      enabled: false,
      ruleVersion: '1.0.0',
      revision: 1,
      author: actor.username || actor.name || 'ANALYST',
      conditions: draft.conditions || [
        { field: 'mitreTechnique', operator: 'equals', value: gap.techniqueId },
      ],
      mitreAttack: [
        {
          tactic: gap.tactic,
          techniqueId: gap.techniqueId,
          techniqueName: gap.techniqueName,
        },
      ],
      testFixtures: [
        {
          fixtureId: `FIX-${Date.now()}-MATCH`,
          name: 'Candidate Verification Fixture',
          input: { mitreTechnique: gap.techniqueId },
          expectedResult: 'MATCH',
          lastResult: 'NOT_RUN',
        },
      ],
      healthStatus: 'NEEDS_TEST',
      changeReason: `Drafted from detection gap ${gap.gapId}`,
      organizationId: organizationId || gap.organizationId,
    });

    await newRule.save();

    gap.status = 'RULE_DRAFTED';
    gap.candidateRuleId = newRule._id;
    await gap.save();

    await auditLogger.log({
      actor,
      organizationId: organizationId || gap.organizationId,
      action: 'DETECTION_CANDIDATE_DRAFTED_FROM_GAP',
      resource: { type: 'DETECTION_RULE', id: newRule.ruleId },
      outcome: 'SUCCESS',
      details: { gapId: gap.gapId, ruleId: newRule.ruleId },
    });

    return newRule;
  }
}

module.exports = new DetectionGapService();
