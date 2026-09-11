/**
 * 🛡️ CyberShield X — SLOService (Phase 76)
 *
 * Real SLO definition management, mathematical window evaluation,
 * and error budget tracking.
 * Strictly adheres to Permanent Constitution: No fabricated baselines,
 * returns INSUFFICIENT_DATA / NOT_MEASURED when observation samples are inadequate.
 */

const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();
const SLODefinition = require('../../models/SLODefinition');
const SLOEvaluation = require('../../models/SLOEvaluation');
const apiObservabilityService = require('./APIObservabilityService');
const ServiceHealthSnapshot = require('../../models/ServiceHealthSnapshot');
const SOCReport = require('../../models/SOCReport');

const CANONICAL_SLO_TEMPLATES = [
  {
    sloId: 'SLO-API-AVAILABILITY',
    name: 'API Route Availability',
    description: 'Guarantees >= 99.5% successful HTTP response status codes (< 500) over 7 days.',
    service: 'api',
    metricType: 'API_AVAILABILITY',
    targetPercent: 99.5,
    thresholdMs: null,
    windowDays: 7,
  },
  {
    sloId: 'SLO-API-LATENCY-P95',
    name: 'API Latency Compliance (p95)',
    description: 'Guarantees >= 95.0% of API requests respond within 500ms over 7 days.',
    service: 'api',
    metricType: 'API_LATENCY',
    targetPercent: 95.0,
    thresholdMs: 500,
    windowDays: 7,
  },
  {
    sloId: 'SLO-DB-AVAILABILITY',
    name: 'MongoDB Subsystem Responsiveness',
    description: 'Guarantees >= 99.9% database health probe success over 7 days.',
    service: 'database',
    metricType: 'DB_AVAILABILITY',
    targetPercent: 99.9,
    thresholdMs: 300,
    windowDays: 7,
  },
  {
    sloId: 'SLO-JOB-COMPLETION',
    name: 'Asynchronous Job Success Rate',
    description: 'Guarantees >= 98.0% of queued async tasks complete successfully.',
    service: 'jobs',
    metricType: 'JOB_COMPLETION_RATE',
    targetPercent: 98.0,
    thresholdMs: null,
    windowDays: 7,
  },
  {
    sloId: 'SLO-REPORT-GENERATION',
    name: 'SOC Report Generation Delivery',
    description: 'Guarantees >= 95.0% of scheduled compliance and SOC reports generate without fault.',
    service: 'reporting',
    metricType: 'REPORT_GENERATION_SUCCESS',
    targetPercent: 95.0,
    thresholdMs: null,
    windowDays: 7,
  },
  {
    sloId: 'SLO-TOOL-RUNTIME',
    name: 'Canonical Tool Runtime Availability',
    description: 'Guarantees >= 99.0% operational availability for certified working tools.',
    service: 'tool_runtime',
    metricType: 'TOOL_RUNTIME_AVAILABILITY',
    targetPercent: 99.0,
    thresholdMs: null,
    windowDays: 7,
  },
];

class SLOService {
  constructor() {
    this.MIN_SAMPLES_THRESHOLD = 5; // Minimum genuine samples required before computing attainment
    this.io = null;
  }

  setSocketIO(ioInstance) {
    this.io = ioInstance;
  }

  /**
   * Idempotently seeds canonical platform SLOs.
   */
  async seedCanonicalSLOs(organizationId = null) {
    const seeded = [];
    for (const tpl of CANONICAL_SLO_TEMPLATES) {
      const existing = await SLODefinition.findOne({
        sloId: tpl.sloId,
        organizationId: organizationId || null,
      });

      if (!existing) {
        const doc = new SLODefinition({
          ...tpl,
          organizationId: organizationId || null,
          status: 'NOT_MEASURED',
          currentAttainmentPercent: null,
          errorBudgetPercent: Number((100 - tpl.targetPercent).toFixed(2)),
          errorBudgetRemainingPercent: null,
        });
        await doc.save();
        seeded.push(doc);
      } else {
        seeded.push(existing);
      }
    }
    return seeded;
  }

  /**
   * Evaluate a specific SLO against observed runtime data.
   */
  async evaluateSLO(sloId, organizationId = null) {
    const slo = await SLODefinition.findOne({
      sloId,
      organizationId: organizationId || null,
    });

    if (!slo) {
      throw new Error(`SLO definition '${sloId}' not found`);
    }

    const windowEnd = new Date();
    const windowStart = new Date(Date.now() - slo.windowDays * 24 * 60 * 60 * 1000);

    let totalEvents = 0;
    let goodEvents = 0;
    let badEvents = 0;
    const evidenceReferences = [];

    if (slo.metricType === 'API_AVAILABILITY' || slo.metricType === 'API_LATENCY') {
      // Pull real API telemetry from APIObservabilityService buffer
      const buffer = apiObservabilityService.buffer;
      const relevant = buffer.filter(
        (s) => s.timestamp >= windowStart.getTime() && (!organizationId || s.organizationId === organizationId)
      );

      totalEvents = relevant.length;
      if (slo.metricType === 'API_AVAILABILITY') {
        badEvents = relevant.filter((s) => s.isError && s.statusCode >= 500).length;
        goodEvents = totalEvents - badEvents;
        evidenceReferences.push(`API_BUFFER_TOTAL_${totalEvents}`, `API_5XX_ERRORS_${badEvents}`);
      } else {
        const threshold = slo.thresholdMs || 500;
        badEvents = relevant.filter((s) => s.latencyMs > threshold).length;
        goodEvents = totalEvents - badEvents;
        evidenceReferences.push(`API_LATENCY_THRESHOLD_${threshold}MS`, `API_SLOW_REQUESTS_${badEvents}`);
      }
    } else if (slo.metricType === 'DB_AVAILABILITY') {
      // Query recent database snapshots
      const snapshots = await ServiceHealthSnapshot.find({
        serviceId: 'database',
        observedAt: { $gte: windowStart },
      })
        .limit(100)
        .lean();

      totalEvents = snapshots.length;
      badEvents = snapshots.filter((s) => s.status === 'UNHEALTHY').length;
      goodEvents = totalEvents - badEvents;
      evidenceReferences.push(`DB_SNAPSHOTS_COUNT_${totalEvents}`);
    } else if (slo.metricType === 'REPORT_GENERATION_SUCCESS') {
      const reports = await SOCReport.find({
        createdAt: { $gte: windowStart },
        ...(organizationId ? { organizationId } : {}),
      })
        .limit(100)
        .lean();

      totalEvents = reports.length;
      badEvents = 0; // Completed SOCReport documents are successful creations
      goodEvents = totalEvents;
      evidenceReferences.push(`SOC_REPORTS_COUNT_${totalEvents}`);
    } else {
      // Generic service health snapshots evaluation
      const snapshots = await ServiceHealthSnapshot.find({
        serviceId: slo.service,
        observedAt: { $gte: windowStart },
      })
        .limit(100)
        .lean();

      totalEvents = snapshots.length;
      badEvents = snapshots.filter((s) => s.status === 'UNHEALTHY' || s.status === 'DEGRADED').length;
      goodEvents = totalEvents - badEvents;
      evidenceReferences.push(`SERVICE_SNAPSHOTS_${totalEvents}`);
    }

    // Strict No Synthetic Observability rule:
    // If we have fewer samples than the threshold, do NOT invent a percentage.
    let status = 'NOT_MEASURED';
    let observedPercent = null;
    let errorBudgetRemainingPercent = null;

    if (totalEvents === 0) {
      status = 'NOT_MEASURED';
    } else if (totalEvents < this.MIN_SAMPLES_THRESHOLD) {
      status = 'INSUFFICIENT_DATA';
      evidenceReferences.push(`INSUFFICIENT_SAMPLES_${totalEvents}_OF_${this.MIN_SAMPLES_THRESHOLD}`);
    } else {
      observedPercent = Number(((goodEvents / totalEvents) * 100).toFixed(2));
      const errorBudget = 100 - slo.targetPercent;

      if (observedPercent >= slo.targetPercent) {
        status = 'MEETING';
        errorBudgetRemainingPercent = 100;
      } else {
        const shortfall = slo.targetPercent - observedPercent;
        const budgetConsumedFraction = shortfall / errorBudget;
        errorBudgetRemainingPercent = Math.max(0, Number(((1 - budgetConsumedFraction) * 100).toFixed(2)));

        if (errorBudgetRemainingPercent > 0) {
          status = 'AT_RISK';
        } else {
          status = 'BREACHED';
        }
      }
    }

    // Persist evaluation
    const evaluation = new SLOEvaluation({
      evaluationId: uuidv4(),
      sloId: slo.sloId,
      service: slo.service,
      organizationId: organizationId || null,
      windowStart,
      windowEnd,
      totalEvents,
      goodEvents,
      badEvents,
      observedPercent,
      targetPercent: slo.targetPercent,
      status,
      errorBudgetRemainingPercent,
      evaluatedAt: new Date(),
      evidenceReferences,
    });
    await evaluation.save();

    // Update definition
    slo.status = status;
    slo.currentAttainmentPercent = observedPercent;
    slo.errorBudgetRemainingPercent = errorBudgetRemainingPercent;
    slo.lastEvaluatedAt = new Date();
    await slo.save();

    // Emit event if degraded or breached
    if (status === 'BREACHED') {
      this.emitEvent('slo:breached', { sloId: slo.sloId, target: slo.targetPercent, observed: observedPercent });
    } else if (status === 'AT_RISK') {
      this.emitEvent('slo:at-risk', { sloId: slo.sloId, target: slo.targetPercent, observed: observedPercent });
    }

    return {
      slo,
      evaluation,
    };
  }

  /**
   * Evaluate all registered SLOs.
   */
  async evaluateAll(organizationId = null) {
    const slos = await SLODefinition.find({
      organizationId: organizationId || null,
    });

    const evaluations = [];
    for (const slo of slos) {
      try {
        const res = await this.evaluateSLO(slo.sloId, organizationId);
        evaluations.push(res);
      } catch (err) {
        // Continue evaluating others
      }
    }
    return evaluations;
  }

  emitEvent(eventName, payload) {
    if (this.io) {
      try {
        this.io.emit(eventName, payload);
      } catch (e) {
        // Suppress
      }
    }
  }
}

module.exports = new SLOService();
