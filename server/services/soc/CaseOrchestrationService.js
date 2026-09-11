/**
 * 🛡️ CyberShield X — CaseOrchestrationService (Phase 72)
 *
 * Implements unified operational container orchestration, linking Incidents,
 * Findings, Alerts, Hunts, Tasks, Evidence, Approvals, Playbook Runs, and Reports.
 * Supports parent/child case hierarchies and comprehensive case dossier compilation.
 *
 * Strict Rule: Dossier data originates purely from persisted database records (zero AI fabrication).
 */

const Case = require('../../models/Case');
const Incident = require('../../models/Incident');
const Finding = require('../../models/Finding');
const Alert = require('../../models/Alert');
const ThreatHunt = require('../../models/ThreatHunt');
const ThreatHuntExecution = require('../../models/ThreatHuntExecution');
const IncidentTask = require('../../models/IncidentTask');
const EvidenceRecord = require('../../models/EvidenceRecord');
const PendingApproval = require('../../models/PendingApproval');
const auditLogger = require('../../utils/auditLogger');
const logger = require('../../utils/logger');

class CaseOrchestrationService {
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
   * Creates or initializes a new operational case
   */
  async createCase(caseData, actor = {}) {
    const caseId = caseData.caseId || `CASE-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newCase = await Case.create({
      ...caseData,
      caseId,
      analystId: actor.id || actor.userId || 'system',
      timeline: [
        {
          action: 'CASE_CREATED',
          performedBy: actor.name || actor.username || 'SYSTEM',
          timestamp: new Date(),
          details: `Case created with severity: ${caseData.severity || 'MEDIUM'}`,
        },
      ],
    });

    await auditLogger.log({
      actor,
      action: 'CASE_CREATED',
      resource: { type: 'CASE', id: caseId },
      outcome: 'SUCCESS',
      details: { title: newCase.title, severity: newCase.severity },
    });

    return newCase;
  }

  /**
   * Links an incident into the case container
   */
  async linkIncident(caseId, incidentId, actor = {}, organizationId = null) {
    const query = { caseId };
    if (organizationId) {
      query.$or = [{ organizationId }, { organizationId: null }];
    }

    const cs = await Case.findOne(query);
    if (!cs) {
      throw new Error(`Case ${caseId} not found`);
    }

    const inc = await Incident.findOne({ incidentId });
    if (!inc) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    if (!Array.isArray(cs.incidents)) cs.incidents = [];
    const alreadyLinked = cs.incidents.some((id) => (typeof id === 'string' ? id === incidentId : id.incidentId === incidentId));
    if (!alreadyLinked) {
      cs.incidents.push(incidentId);
      cs.timeline.push({
        action: 'INCIDENT_LINKED',
        performedBy: actor.name || actor.username || 'ANALYST',
        timestamp: new Date(),
        details: `Linked Incident ${incidentId} (${inc.title})`,
      });
      await cs.save();
    }

    await auditLogger.log({
      actor,
      action: 'CASE_INCIDENT_LINKED',
      resource: { type: 'CASE', id: caseId },
      outcome: 'SUCCESS',
      details: { incidentId },
    });

    return cs;
  }

  /**
   * Links a threat hunt into the case container
   */
  async linkHunt(caseId, huntId, actor = {}, organizationId = null) {
    const query = { caseId };
    if (organizationId) {
      query.$or = [{ organizationId }, { organizationId: null }];
    }

    const cs = await Case.findOne(query);
    if (!cs) {
      throw new Error(`Case ${caseId} not found`);
    }

    if (!Array.isArray(cs.hunts)) cs.hunts = [];
    if (!cs.hunts.includes(huntId)) {
      cs.hunts.push(huntId);
      cs.timeline.push({
        action: 'HUNT_LINKED',
        performedBy: actor.name || actor.username || 'ANALYST',
        timestamp: new Date(),
        details: `Linked Threat Hunt ${huntId}`,
      });
      await cs.save();
    }

    return cs;
  }

  /**
   * Links parent/child case relationships
   */
  async linkParentChild(parentCaseId, childCaseId, actor = {}, organizationId = null) {
    if (parentCaseId === childCaseId) {
      throw new Error('Case cannot be its own parent');
    }

    const parent = await Case.findOne({ caseId: parentCaseId });
    if (!parent) throw new Error(`Parent case ${parentCaseId} not found`);

    const child = await Case.findOne({ caseId: childCaseId });
    if (!child) throw new Error(`Child case ${childCaseId} not found`);

    child.parentCaseId = parentCaseId;
    child.timeline.push({
      action: 'PARENT_CASE_LINKED',
      performedBy: actor.name || 'SYSTEM',
      timestamp: new Date(),
      details: `Linked as child to parent case ${parentCaseId}`,
    });
    await child.save();

    if (!Array.isArray(parent.childCases)) parent.childCases = [];
    if (!parent.childCases.includes(childCaseId)) {
      parent.childCases.push(childCaseId);
      parent.timeline.push({
        action: 'CHILD_CASE_LINKED',
        performedBy: actor.name || 'SYSTEM',
        timestamp: new Date(),
        details: `Linked child case ${childCaseId}`,
      });
      await parent.save();
    }

    return { parent, child };
  }

  /**
   * Compiles complete case dossier from persisted records
   */
  async compileDossier(caseId, organizationId = null) {
    const query = { caseId };
    if (organizationId) {
      query.$or = [{ organizationId }, { organizationId: null }];
    }

    const cs = await Case.findOne(query).lean();
    if (!cs) {
      throw new Error(`Case ${caseId} not found`);
    }

    const orgFilter = organizationId ? { $or: [{ organizationId }, { organizationId: null }] } : {};

    // 1. Incidents
    const incIds = Array.isArray(cs.incidents)
      ? cs.incidents.map((i) => (typeof i === 'string' ? i : i.incidentId)).filter(Boolean)
      : [];
    const incidents = incIds.length > 0 ? await Incident.find({ incidentId: { $in: incIds } }).lean() : [];

    // 2. Findings
    const findingIds = Array.isArray(cs.findings)
      ? cs.findings.map((f) => (typeof f === 'string' ? f : f.findingId)).filter(Boolean)
      : [];
    const findings = findingIds.length > 0 ? await Finding.find({ findingId: { $in: findingIds } }).lean() : [];

    // 3. Alerts
    const alerts = await Alert.find({ ...orgFilter, $or: [{ caseId }, { incidentId: { $in: incIds } }] }).limit(50).lean();

    // 4. Threat Hunts
    const huntIds = Array.isArray(cs.hunts) ? cs.hunts : [];
    const hunts = huntIds.length > 0 ? await ThreatHunt.find({ huntId: { $in: huntIds } }).lean() : [];
    const huntExecutions = huntIds.length > 0 ? await ThreatHuntExecution.find({ huntId: { $in: huntIds } }).lean() : [];

    // 5. Evidence Records
    const evidence = await EvidenceRecord.find({
      ...orgFilter,
      $or: [{ caseId }, { incidentId: { $in: incIds } }],
    }).lean();

    // 6. Tasks
    const tasks = await IncidentTask.find({
      ...orgFilter,
      $or: [{ caseId }, { incidentId: { $in: incIds } }],
    }).lean();

    // 7. Approvals
    const approvals = await PendingApproval.find({
      ...orgFilter,
      $or: [{ incidentId: { $in: incIds } }],
    }).lean();

    // 8. Aggregated IOCs from linked incidents & alerts
    const iocSet = new Map();
    for (const inc of incidents) {
      if (Array.isArray(inc.iocs)) {
        for (const ioc of inc.iocs) {
          iocSet.set(`${ioc.type}:${ioc.value}`, ioc);
        }
      }
    }

    // 9. Response History from Incidents
    const responseHistory = [];
    for (const inc of incidents) {
      if (Array.isArray(inc.responseActions)) {
        for (const act of inc.responseActions) {
          responseHistory.push({
            incidentId: inc.incidentId,
            ...act,
          });
        }
      }
    }

    // 10. Dossier assembly
    const dossier = {
      compiledAt: new Date().toISOString(),
      caseDetails: {
        caseId: cs.caseId,
        title: cs.title,
        description: cs.description,
        severity: cs.severity,
        status: cs.status,
        analystId: cs.analystId,
        parentCaseId: cs.parentCaseId,
        childCases: cs.childCases || [],
        createdAt: cs.createdAt,
        updatedAt: cs.updatedAt,
      },
      counts: {
        incidents: incidents.length,
        findings: findings.length,
        alerts: alerts.length,
        hunts: hunts.length,
        evidence: evidence.length,
        tasks: tasks.length,
        approvals: approvals.length,
        iocs: iocSet.size,
        responseActions: responseHistory.length,
      },
      incidents,
      findings,
      alerts,
      threatHunts: hunts,
      threatHuntExecutions: huntExecutions,
      iocs: Array.from(iocSet.values()),
      evidence,
      tasks,
      approvals,
      timeline: cs.timeline || [],
      responseHistory,
      postmortem: cs.closure?.postmortem || incidents.map((i) => i.closure).filter((c) => c?.rootCause),
      integritySummary: {
        totalEvidenceItems: evidence.length,
        validHashes: evidence.filter((e) => e.integrityStatus === 'VALID').length,
        tamperDetected: evidence.filter((e) => e.integrityStatus === 'TAMPER_DETECTED').length,
      },
    };

    return dossier;
  }
}

module.exports = new CaseOrchestrationService();
