/**
 * 🛡️ CyberShield X — ReliabilityCorrelationService (Phase 76)
 *
 * Evidence-based cross-signal correlation between platform reliability anomalies
 * and existing SOC incidents, audit events, or operational spikes.
 * Adheres to Permanent Constitution: Zero fabricated root causes.
 * Classifications: CORRELATED, TEMPORALLY_ASSOCIATED, INSUFFICIENT_EVIDENCE, NO_CORRELATION_FOUND.
 */

const ServiceHealthSnapshot = require('../../models/ServiceHealthSnapshot');
const Incident = require('../../models/Incident');
const AuditEvent = require('../../models/AuditEvent');
const Finding = require('../../models/Finding');

class ReliabilityCorrelationService {
  /**
   * Correlates recent service health degradation events with SOC incidents.
   */
  async correlateHealthWithIncidents(windowMinutes = 60, organizationId = null) {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

    // 1. Fetch degraded or unhealthy service snapshots
    const degradedSnapshots = await ServiceHealthSnapshot.find({
      status: { $in: ['DEGRADED', 'UNHEALTHY'] },
      observedAt: { $gte: windowStart },
      ...(organizationId ? { organizationId } : {}),
    })
      .sort({ observedAt: -1 })
      .limit(50)
      .lean();

    // 2. Fetch SOC incidents in window
    const recentIncidents = await Incident.find({
      createdAt: { $gte: windowStart },
      ...(organizationId ? { organizationId } : {}),
    })
      .select('incidentId title severity status createdAt')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // 3. Fetch audit events in window (e.g. policy changes, break glass, admin executions)
    const auditEvents = await AuditEvent.find({
      timestamp: { $gte: windowStart },
      ...(organizationId ? { organizationId } : {}),
    })
      .select('action userId details timestamp')
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    if (degradedSnapshots.length === 0 && recentIncidents.length === 0) {
      return {
        verdict: 'NO_CORRELATION_FOUND',
        confidence: 'HIGH',
        narrative: 'No degraded subsystem snapshots or concurrent security incidents were observed in the evaluation window.',
        correlations: [],
        evaluatedWindowMinutes: windowMinutes,
      };
    }

    const correlations = [];

    for (const snap of degradedSnapshots) {
      const snapTime = new Date(snap.observedAt).getTime();

      // Find incidents within 15 minutes of snapshot
      const relatedIncidents = recentIncidents.filter((inc) => {
        const incTime = new Date(inc.createdAt).getTime();
        return Math.abs(incTime - snapTime) <= 15 * 60 * 1000;
      });

      // Find audit events within 10 minutes of snapshot
      const relatedAudits = auditEvents.filter((aud) => {
        const audTime = new Date(aud.timestamp).getTime();
        return Math.abs(audTime - snapTime) <= 10 * 60 * 1000;
      });

      let relationship = 'NO_CORRELATION_FOUND';
      if (relatedIncidents.length > 0 && relatedAudits.length > 0) {
        relationship = 'CORRELATED';
      } else if (relatedIncidents.length > 0 || relatedAudits.length > 0) {
        relationship = 'TEMPORALLY_ASSOCIATED';
      }

      correlations.push({
        serviceId: snap.serviceId,
        serviceName: snap.serviceName,
        degradationStatus: snap.status,
        observedAt: snap.observedAt,
        relationship,
        associatedIncidents: relatedIncidents.map((i) => ({
          incidentId: i.incidentId,
          title: i.title,
          severity: i.severity,
          createdAt: i.createdAt,
        })),
        associatedAuditActions: relatedAudits.map((a) => ({
          action: a.action,
          timestamp: a.timestamp,
        })),
        evidence: snap.evidenceReferences || [],
      });
    }

    // Determine overall verdict
    const relationships = correlations.map((c) => c.relationship);
    let verdict = 'NO_CORRELATION_FOUND';
    if (relationships.includes('CORRELATED')) {
      verdict = 'CORRELATED';
    } else if (relationships.includes('TEMPORALLY_ASSOCIATED')) {
      verdict = 'TEMPORALLY_ASSOCIATED';
    }

    return {
      verdict,
      evaluatedWindowMinutes: windowMinutes,
      totalDegradations: degradedSnapshots.length,
      totalConcurrentIncidents: recentIncidents.length,
      totalConcurrentAuditEvents: auditEvents.length,
      correlations,
      disclaimer: 'Correlations represent observed temporal proximity and do not establish unverified causal root causes.',
    };
  }
}

module.exports = new ReliabilityCorrelationService();
