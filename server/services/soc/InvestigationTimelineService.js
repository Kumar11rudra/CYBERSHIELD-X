/**
 * 🛡️ CyberShield X — InvestigationTimelineService (Phase 71)
 *
 * Constructs evidence-backed investigation timelines by aggregating disparate
 * platform records across Hunts, Detections, Alerts, Findings, IOCs, Incidents,
 * Approvals, and Terminal Executions.
 *
 * Strict Rule: Zero synthetic timeline events. Every entry maps directly
 * to an authenticated, persisted database record.
 */

const ThreatHuntExecution = require('../../models/ThreatHuntExecution');
const Alert = require('../../models/Alert');
const Finding = require('../../models/Finding');
const Incident = require('../../models/Incident');
const IncidentTask = require('../../models/IncidentTask');
const EvidenceRecord = require('../../models/EvidenceRecord');
const PendingApproval = require('../../models/PendingApproval');
const TerminalHistory = require('../../models/TerminalHistory');
const IOCRecord = require('../../models/IOCRecord');
const logger = require('../../utils/logger');

class InvestigationTimelineService {
  /**
   * Builds an aggregated investigation timeline
   * @param {Object} filterOptions
   * @returns {Promise<Array>} Chronological list of timeline events
   */
  async buildTimeline({
    organizationId = null,
    incidentId = null,
    startDate = null,
    endDate = null,
    severity = null,
    entityTypes = null,
    limit = 50,
  } = {}) {
    const events = [];
    const cappedLimit = Math.min(Math.max(1, Number(limit) || 50), 200);

    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : now;

    const orgFilter = organizationId
      ? { $or: [{ organizationId }, { organizationId: null }] }
      : {};

    const timeFilter = { createdAt: { $gte: start, $lte: end } };

    // 1. Hunt Executions
    if (!entityTypes || entityTypes.includes('HUNT_EXECUTION')) {
      try {
        const hunts = await ThreatHuntExecution.find({
          ...orgFilter,
          startedAt: { $gte: start, $lte: end },
        })
          .sort({ startedAt: -1 })
          .limit(cappedLimit)
          .lean();

        for (const h of hunts) {
          events.push({
            eventId: `TL-HUNT-${h.executionId}`,
            sourceEntity: 'ThreatHuntExecution',
            sourceId: h.executionId,
            timestamp: h.startedAt || h.createdAt,
            eventType: 'HUNT_EXECUTION',
            severity: h.resultCount > 0 ? 'HIGH' : 'INFO',
            title: `Hunt Executed: ${h.huntName}`,
            details: `Status: ${h.status}, Observed Matches: ${h.resultCount}, Duration: ${h.durationMs}ms`,
            actor: h.triggeredBy || 'ANALYST',
            organizationId: h.organizationId,
          });
        }
      } catch (err) {
        logger.warn(`Timeline hunt fetch failed: ${err.message}`);
      }
    }

    // 2. Alerts
    if (!entityTypes || entityTypes.includes('ALERT')) {
      try {
        const alertQuery = { ...orgFilter, ...timeFilter };
        if (severity) alertQuery.severity = severity.toUpperCase();

        const alerts = await Alert.find(alertQuery)
          .sort({ createdAt: -1 })
          .limit(cappedLimit)
          .lean();

        for (const a of alerts) {
          events.push({
            eventId: `TL-ALERT-${a.alertId}`,
            sourceEntity: 'Alert',
            sourceId: a.alertId,
            timestamp: a.createdAt,
            eventType: 'ALERT_GENERATED',
            severity: a.severity || 'MEDIUM',
            title: `SOC Alert: ${a.title}`,
            details: a.description || `Category: ${a.category}, Asset: ${a.asset || 'N/A'}`,
            actor: a.source || 'SYSTEM',
            organizationId: a.organizationId,
          });
        }
      } catch (err) {
        logger.warn(`Timeline alert fetch failed: ${err.message}`);
      }
    }

    // 3. Findings
    if (!entityTypes || entityTypes.includes('FINDING')) {
      try {
        const findingQuery = { ...orgFilter, ...timeFilter };
        if (severity) findingQuery.severity = severity.toUpperCase();

        const findings = await Finding.find(findingQuery)
          .sort({ createdAt: -1 })
          .limit(cappedLimit)
          .lean();

        for (const f of findings) {
          events.push({
            eventId: `TL-FIND-${f.findingId}`,
            sourceEntity: 'Finding',
            sourceId: f.findingId,
            timestamp: f.createdAt,
            eventType: 'FINDING_RECORDED',
            severity: f.severity || 'MEDIUM',
            title: `Finding: ${f.title}`,
            details: f.description || `Tool: ${f.sourceTool}, Asset: ${f.asset || 'N/A'}`,
            actor: f.sourceTool || 'SYSTEM',
            organizationId: f.organizationId,
          });
        }
      } catch (err) {
        logger.warn(`Timeline finding fetch failed: ${err.message}`);
      }
    }

    // 4. Incidents & Incident Sub-Events
    if (!entityTypes || entityTypes.includes('INCIDENT')) {
      try {
        const incQuery = { ...orgFilter, ...timeFilter };
        if (incidentId) incQuery.incidentId = incidentId;
        if (severity) incQuery.severity = severity.toUpperCase();

        const incidents = await Incident.find(incQuery)
          .sort({ createdAt: -1 })
          .limit(cappedLimit)
          .lean();

        for (const inc of incidents) {
          events.push({
            eventId: `TL-INC-${inc.incidentId}`,
            sourceEntity: 'Incident',
            sourceId: inc.incidentId,
            timestamp: inc.createdAt,
            eventType: 'INCIDENT_UPDATE',
            severity: inc.severity || 'HIGH',
            title: `Incident: ${inc.title}`,
            details: `Status: ${inc.status}, Risk Score: ${inc.riskScore}/100, Priority: ${inc.priority?.level || 'MEDIUM'}, Assets: ${inc.affectedAssets?.join(', ') || 'none'}`,
            actor: 'INCIDENT_ENGINE',
            organizationId: inc.organizationId,
          });

          // Include inline timeline events from the incident if any
          if (Array.isArray(inc.timeline)) {
            for (const item of inc.timeline) {
              events.push({
                eventId: `TL-INC-ITEM-${inc.incidentId}-${item.timestamp ? new Date(item.timestamp).getTime() : Math.random()}`,
                sourceEntity: 'IncidentItem',
                sourceId: inc.incidentId,
                timestamp: item.timestamp || inc.createdAt,
                eventType: item.eventType || 'OBSERVED',
                severity: inc.severity,
                title: `[${inc.incidentId}] ${item.description}`,
                details: `Actor: ${item.actor || 'SYSTEM'}${item.evidenceRef ? ` | Ref: ${item.evidenceRef}` : ''}`,
                actor: item.actor || 'SYSTEM',
                organizationId: inc.organizationId,
              });
            }
          }

          // Include response action events from the incident
          if (Array.isArray(inc.responseActions)) {
            for (const act of inc.responseActions) {
              events.push({
                eventId: `TL-ACT-${inc.incidentId}-${act.actionId}`,
                sourceEntity: 'IncidentResponseAction',
                sourceId: act.actionId,
                timestamp: act.completedAt || act.requestedAt || inc.createdAt,
                eventType: 'RESPONDED',
                severity: act.riskClass === 'PRIVILEGED' ? 'HIGH' : 'MEDIUM',
                title: `Response Action: ${act.type} (${act.status})`,
                details: `Target: ${act.target}, Verification: ${act.verificationStatus || 'UNVERIFIED'}`,
                actor: act.approvedBy || 'OPERATOR',
                organizationId: inc.organizationId,
              });
            }
          }

          // Include reopen events
          if (Array.isArray(inc.reopenHistory)) {
            for (const ro of inc.reopenHistory) {
              events.push({
                eventId: `TL-REOPEN-${inc.incidentId}-${new Date(ro.reopenedAt).getTime()}`,
                sourceEntity: 'IncidentReopen',
                sourceId: inc.incidentId,
                timestamp: ro.reopenedAt,
                eventType: 'STATUS_CHANGE',
                severity: 'HIGH',
                title: `Incident ${inc.incidentId} Reopened`,
                details: `Reason: ${ro.reopenReason}, Triggering Evidence: ${ro.triggeringEvidenceId || 'None'}`,
                actor: ro.reopenedBy?.name || 'ANALYST',
                organizationId: inc.organizationId,
              });
            }
          }
        }
      } catch (err) {
        logger.warn(`Timeline incident fetch failed: ${err.message}`);
      }
    }

    // 5. Incident Tasks (Phase 72)
    if (!entityTypes || entityTypes.includes('TASK')) {
      try {
        const taskQuery = { ...orgFilter, ...timeFilter };
        if (incidentId) taskQuery.incidentId = incidentId;

        const tasks = await IncidentTask.find(taskQuery)
          .sort({ createdAt: -1 })
          .limit(cappedLimit)
          .lean();

        for (const t of tasks) {
          events.push({
            eventId: `TL-TASK-${t.taskId}`,
            sourceEntity: 'IncidentTask',
            sourceId: t.taskId,
            timestamp: t.updatedAt || t.createdAt,
            eventType: 'TASK_ACTIVITY',
            severity: t.priority === 'HIGH' ? 'MEDIUM' : 'INFO',
            title: `Task: ${t.title} [${t.status}]`,
            details: `Incident: ${t.incidentId}, Assignee: ${t.assignee?.name || 'Unassigned'}, Due: ${t.dueAt ? new Date(t.dueAt).toLocaleDateString() : 'None'}`,
            actor: t.completedBy?.name || t.createdBy?.name || 'ANALYST',
            organizationId: t.organizationId,
          });
        }
      } catch (err) {
        logger.warn(`Timeline task fetch failed: ${err.message}`);
      }
    }

    // 6. Evidence Records (Phase 72)
    if (!entityTypes || entityTypes.includes('EVIDENCE')) {
      try {
        const evidenceQuery = { ...orgFilter, ...timeFilter };
        if (incidentId) evidenceQuery.incidentId = incidentId;

        const evidences = await EvidenceRecord.find(evidenceQuery)
          .sort({ timestamp: -1 })
          .limit(cappedLimit)
          .lean();

        for (const ev of evidences) {
          events.push({
            eventId: `TL-EVID-${ev.evidenceId}`,
            sourceEntity: 'EvidenceRecord',
            sourceId: ev.evidenceId,
            timestamp: ev.timestamp || ev.createdAt,
            eventType: 'EVIDENCE_RECORDED',
            severity: ev.integrityStatus === 'TAMPER_DETECTED' ? 'CRITICAL' : 'INFO',
            title: `Evidence ${ev.evidenceId} [${ev.integrityStatus}]`,
            details: `Source: ${ev.sourceEntity} (${ev.sourceId || 'N/A'}), SHA-256: ${ev.hash.substring(0, 16)}...`,
            actor: ev.collector?.name || 'SYSTEM',
            organizationId: ev.organizationId,
          });
        }
      } catch (err) {
        logger.warn(`Timeline evidence fetch failed: ${err.message}`);
      }
    }

    // 7. Approvals
    if (!entityTypes || entityTypes.includes('APPROVAL')) {
      try {
        const approvals = await PendingApproval.find({ ...orgFilter, ...timeFilter })
          .sort({ createdAt: -1 })
          .limit(cappedLimit)
          .lean();

        for (const app of approvals) {
          events.push({
            eventId: `TL-APP-${app.approvalId || app._id}`,
            sourceEntity: 'PendingApproval',
            sourceId: String(app.approvalId || app._id),
            timestamp: app.createdAt,
            eventType: 'APPROVAL_DECISION',
            severity: app.riskLevel === 'PRIVILEGED' ? 'HIGH' : 'MEDIUM',
            title: `Approval Gate: ${app.actionType}`,
            details: `Status: ${app.status}, Target: ${app.targetAsset || app.target || 'N/A'}`,
            actor: app.decidedBy || 'OPERATOR_GATE',
            organizationId: app.organizationId,
          });
        }
      } catch (err) {
        logger.warn(`Timeline approval fetch failed: ${err.message}`);
      }
    }

    // 8. Terminal Executions
    if (!entityTypes || entityTypes.includes('TERMINAL_JOB')) {
      try {
        const jobs = await TerminalHistory.find({
          ...orgFilter,
          timestamp: { $gte: start, $lte: end },
        })
          .sort({ timestamp: -1 })
          .limit(cappedLimit)
          .lean();

        for (const j of jobs) {
          events.push({
            eventId: `TL-JOB-${j.executionId}`,
            sourceEntity: 'TerminalHistory',
            sourceId: j.executionId,
            timestamp: j.timestamp,
            eventType: 'TERMINAL_EXECUTION',
            severity: j.exitCode === 0 ? 'INFO' : 'MEDIUM',
            title: `Tool Execution: ${j.tool}`,
            details: `Target: ${j.target}, ExitCode: ${j.exitCode}, Duration: ${j.durationMs}ms`,
            actor: j.executedBy || 'OPERATOR',
            organizationId: j.organizationId,
          });
        }
      } catch (err) {
        logger.warn(`Timeline terminal job fetch failed: ${err.message}`);
      }
    }

    // Sort chronologically descending
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return events.slice(0, cappedLimit);
  }
}

module.exports = new InvestigationTimelineService();
