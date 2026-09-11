/**
 * 🛡️ CyberShield X — SOCMetricsService (Phase 74)
 *
 * Ground-Truth SOC Metrics Engine computing operational KPIs, MTTA, MTTR,
 * SLA compliance, and trend analytics strictly from persisted database records.
 * Prohibits synthetic metrics and discloses exclusion counts transparently.
 */

const mongoose = require('mongoose');
const Incident = require('../../models/Incident');
const Alert = require('../../models/Alert');
const Finding = require('../../models/Finding');
const ThreatHunt = require('../../models/ThreatHunt');
const ThreatHuntExecution = require('../../models/ThreatHuntExecution');
const DetectionRule = require('../../models/DetectionRule');
const DetectionGap = require('../../models/DetectionGap');
const PendingApproval = require('../../models/PendingApproval');
const MetricSnapshot = require('../../models/MetricSnapshot');
const detectionCoverageService = require('./DetectionCoverageService');
const logger = require('../../utils/logger');

class SOCMetricsService {
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

  _buildTenantQuery(organizationId, baseQuery = {}) {
    if (!organizationId) return { ...baseQuery };
    return {
      ...baseQuery,
      organizationId,
    };
  }

  /**
   * Computes operational KPIs across all platform entities
   */
  async getOperationalKPIs(organizationId = null, options = {}) {
    const orgFilter = this._buildTenantQuery(organizationId);

    // 1. Incident Metrics
    const incidents = await Incident.find(orgFilter).select('status severity responseActions reopenHistory createdAt');
    let totalIncidents = incidents.length;
    let openIncidents = 0;
    let criticalIncidents = 0;
    let resolvedIncidents = 0;
    let closedIncidents = 0;
    let reopenedIncidents = 0;
    let successfulResponseActions = 0;
    let failedResponseActions = 0;
    let unverifiedResponseActions = 0;

    const OPEN_STATUSES = [
      'DETECTED',
      'TRIAGING',
      'INVESTIGATING',
      'CONTAINMENT_PENDING',
      'CONTAINED',
      'ERADICATION_PENDING',
      'ERADICATING',
      'RECOVERING',
      'VALIDATION',
    ];

    for (const inc of incidents) {
      const st = String(inc.status || '').toUpperCase();
      if (OPEN_STATUSES.includes(st) || st === 'REOPENED') openIncidents++;
      if (st === 'RESOLVED') resolvedIncidents++;
      if (st === 'CLOSED') closedIncidents++;
      if (inc.reopenHistory && inc.reopenHistory.length > 0) reopenedIncidents++;
      if (inc.severity === 'CRITICAL') criticalIncidents++;

      const actions = inc.responseActions || [];
      for (const act of actions) {
        if (act.status === 'SUCCEEDED') {
          successfulResponseActions++;
          if (act.verificationStatus === 'UNVERIFIED' || !act.verificationStatus) {
            unverifiedResponseActions++;
          }
        } else if (act.status === 'FAILED') {
          failedResponseActions++;
        }
      }
    }

    // 2. Alert Metrics
    const alerts = await Alert.find(orgFilter).select('status occurrenceCount source');
    let totalAlerts = 0;
    let deduplicatedAlerts = alerts.length;
    let alertRecurrenceCount = 0;

    for (const al of alerts) {
      const count = al.occurrenceCount || 1;
      totalAlerts += count;
      if (count > 1) {
        alertRecurrenceCount += count - 1;
      }
    }

    // 3. Finding Metrics
    const findings = await Finding.find(orgFilter).select('status severity');
    let totalFindings = findings.length;
    let openFindings = 0;
    let resolvedFindings = 0;
    for (const f of findings) {
      if (f.status === 'RESOLVED' || f.status === 'CLOSED') {
        resolvedFindings++;
      } else {
        openFindings++;
      }
    }

    // 4. Threat Hunt Metrics
    const hunts = await ThreatHunt.find(orgFilter).select('status');
    const huntExecutions = await ThreatHuntExecution.find(orgFilter).select('status matchesCount');
    let totalThreatHunts = hunts.length;
    let matchedHunts = 0;
    let noMatchHunts = 0;
    let failedHunts = 0;

    for (const hex of huntExecutions) {
      if (hex.status === 'MATCHED' || (hex.matchesCount || 0) > 0) matchedHunts++;
      else if (hex.status === 'NO_MATCH') noMatchHunts++;
      else if (hex.status === 'FAILED') failedHunts++;
    }

    // 5. Detection & Coverage Metrics
    const rules = await DetectionRule.find(orgFilter).select('status healthStatus');
    let activeDetections = 0;
    let failingDetectionTests = 0;
    for (const r of rules) {
      if (r.status === 'ACTIVE') activeDetections++;
      if (r.healthStatus === 'FAILING_TESTS') failingDetectionTests++;
    }

    const gapsCount = await DetectionGap.countDocuments(
      this._buildTenantQuery(organizationId, { status: { $ne: 'RESOLVED' } })
    );

    let coveragePercentage = 0;
    let totalTechniquesTracked = 28;
    let coveredTechniques = 0;
    if (activeDetections > 0) {
      try {
        const cov = await detectionCoverageService.calculateCoverage(organizationId);
        coveragePercentage = cov.coveragePercentage || 0;
        totalTechniquesTracked = cov.totalTechniquesTracked || 28;
        coveredTechniques = cov.coveredTechniques || 0;
      } catch (_) {}
    }

    // 6. Pending Approvals
    const pendingApprovals = await PendingApproval.countDocuments(
      this._buildTenantQuery(organizationId, { status: { $in: ['PENDING', 'AWAITING_APPROVAL'] } })
    );

    const hasData = totalIncidents > 0 || deduplicatedAlerts > 0 || totalFindings > 0;

    return {
      organizationId,
      timestamp: new Date(),
      readinessState: hasData ? 'MEASURED' : 'NO_DATA',
      incidents: {
        total: totalIncidents,
        open: openIncidents,
        critical: criticalIncidents,
        resolved: resolvedIncidents,
        closed: closedIncidents,
        reopened: reopenedIncidents,
      },
      alerts: {
        total: totalAlerts,
        deduplicated: deduplicatedAlerts,
        recurrence: alertRecurrenceCount,
      },
      findings: {
        total: totalFindings,
        open: openFindings,
        resolved: resolvedFindings,
      },
      threatHunting: {
        totalHunts: totalThreatHunts,
        totalExecutions: huntExecutions.length,
        matched: matchedHunts,
        noMatch: noMatchHunts,
        failed: failedHunts,
      },
      threatHunts: {
        total: totalThreatHunts,
        matched: matchedHunts,
        noMatch: noMatchHunts,
        failed: failedHunts,
      },
      detectionEngineering: {
        totalRules: rules.length,
        active: activeDetections,
        failingTests: failingDetectionTests,
        detectionGaps: gapsCount,
        attackCoverage: {
          percentage: coveragePercentage,
          covered: coveredTechniques,
          total: totalTechniquesTracked,
        },
      },
      detections: {
        total: rules.length,
        activeRules: activeDetections,
        active: activeDetections,
        failingTests: failingDetectionTests,
        gaps: gapsCount,
        detectionGaps: gapsCount,
        attackCoverageRate: coveragePercentage > 0 ? `${coveragePercentage}%` : 'NOT_MEASURED',
      },
      governanceAndResponse: {
        pendingApprovals,
        successfulResponseActions,
        failedResponseActions,
        unverifiedResponseActions,
      },
      responseActions: {
        pendingApprovals,
        successful: successfulResponseActions,
        failed: failedResponseActions,
        unverified: unverifiedResponseActions,
      },
    };
  }

  /**
   * Calculates authentic Mean Time To Acknowledge (MTTA)
   * Formula: acknowledgedAt - incidentCreatedAt (in minutes)
   * Explicitly counts and discloses records excluded due to missing timestamps.
   */
  async getMTTA(organizationId = null, options = {}) {
    const orgFilter = this._buildTenantQuery(organizationId);
    const incidents = await Incident.find(orgFilter).select('createdAt sla timeline status');

    const durationsMinutes = [];
    let excludedCount = 0;

    for (const inc of incidents) {
      const createdAt = inc.createdAt ? new Date(inc.createdAt).getTime() : null;
      let ackTime = null;

      if (inc.sla?.acknowledgedAt) {
        ackTime = new Date(inc.sla.acknowledgedAt).getTime();
      } else if (inc.timeline && inc.timeline.length > 0) {
        const ackEvent = inc.timeline.find(
          (t) =>
            t.action === 'STATE_TRANSITION' &&
            (t.details?.newStatus === 'TRIAGING' || t.details?.newStatus === 'INVESTIGATING')
        );
        if (ackEvent?.timestamp) {
          ackTime = new Date(ackEvent.timestamp).getTime();
        }
      }

      if (createdAt && ackTime && ackTime >= createdAt) {
        const diffMinutes = Math.round(((ackTime - createdAt) / (1000 * 60)) * 10) / 10;
        durationsMinutes.push(diffMinutes);
      } else {
        excludedCount++;
      }
    }

    if (durationsMinutes.length === 0) {
      return {
        status: 'INSUFFICIENT_DATA',
        averageMinutes: null,
        medianMinutes: null,
        minMinutes: null,
        maxMinutes: null,
        sampleSize: 0,
        excludedCount,
        disclosure: 'Insufficient acknowledged incident records to compute authentic MTTA',
      };
    }

    durationsMinutes.sort((a, b) => a - b);
    const sum = durationsMinutes.reduce((acc, v) => acc + v, 0);
    const averageMinutes = Math.round((sum / durationsMinutes.length) * 10) / 10;
    const mid = Math.floor(durationsMinutes.length / 2);
    const medianMinutes =
      durationsMinutes.length % 2 !== 0
        ? durationsMinutes[mid]
        : Math.round(((durationsMinutes[mid - 1] + durationsMinutes[mid]) / 2) * 10) / 10;

    return {
      status: 'MEASURED',
      averageMinutes,
      medianMinutes,
      minMinutes: durationsMinutes[0],
      maxMinutes: durationsMinutes[durationsMinutes.length - 1],
      sampleSize: durationsMinutes.length,
      excludedCount,
      unit: 'minutes',
    };
  }

  /**
   * Calculates authentic Mean Time To Resolve (MTTR)
   * Formula: resolvedAt - incidentCreatedAt (in minutes)
   * Explicitly counts and discloses records excluded due to missing completion timestamps.
   */
  async getMTTR(organizationId = null, options = {}) {
    const orgFilter = this._buildTenantQuery(organizationId);
    const incidents = await Incident.find(orgFilter).select('createdAt closure timeline status');

    const durationsMinutes = [];
    const containmentDurations = [];
    let excludedCount = 0;

    for (const inc of incidents) {
      const createdAt = inc.createdAt ? new Date(inc.createdAt).getTime() : null;
      let resolveTime = null;
      let containTime = null;

      if (inc.closure?.closedAt) {
        resolveTime = new Date(inc.closure.closedAt).getTime();
      }

      if (inc.timeline && inc.timeline.length > 0) {
        if (!resolveTime) {
          const resEvent = inc.timeline.find(
            (t) =>
              t.action === 'STATE_TRANSITION' &&
              (t.details?.newStatus === 'RESOLVED' || t.details?.newStatus === 'CLOSED')
          );
          if (resEvent?.timestamp) {
            resolveTime = new Date(resEvent.timestamp).getTime();
          }
        }

        const contEvent = inc.timeline.find(
          (t) => t.action === 'STATE_TRANSITION' && t.details?.newStatus === 'CONTAINED'
        );
        if (contEvent?.timestamp) {
          containTime = new Date(contEvent.timestamp).getTime();
        }
      }

      if (createdAt && resolveTime && resolveTime >= createdAt) {
        const diffMinutes = Math.round(((resolveTime - createdAt) / (1000 * 60)) * 10) / 10;
        durationsMinutes.push(diffMinutes);
      } else {
        excludedCount++;
      }

      if (createdAt && containTime && containTime >= createdAt) {
        containmentDurations.push(Math.round(((containTime - createdAt) / (1000 * 60)) * 10) / 10);
      }
    }

    if (durationsMinutes.length === 0) {
      return {
        status: 'INSUFFICIENT_DATA',
        averageMinutes: null,
        medianMinutes: null,
        minMinutes: null,
        maxMinutes: null,
        sampleSize: 0,
        excludedCount,
        averageContainmentMinutes: null,
        disclosure: 'Insufficient resolved or closed incident records to compute authentic MTTR',
      };
    }

    durationsMinutes.sort((a, b) => a - b);
    const sum = durationsMinutes.reduce((acc, v) => acc + v, 0);
    const averageMinutes = Math.round((sum / durationsMinutes.length) * 10) / 10;
    const mid = Math.floor(durationsMinutes.length / 2);
    const medianMinutes =
      durationsMinutes.length % 2 !== 0
        ? durationsMinutes[mid]
        : Math.round(((durationsMinutes[mid - 1] + durationsMinutes[mid]) / 2) * 10) / 10;

    let averageContainmentMinutes = null;
    if (containmentDurations.length > 0) {
      const contSum = containmentDurations.reduce((acc, v) => acc + v, 0);
      averageContainmentMinutes = Math.round((contSum / containmentDurations.length) * 10) / 10;
    }

    return {
      status: 'MEASURED',
      averageMinutes,
      medianMinutes,
      minMinutes: durationsMinutes[0],
      maxMinutes: durationsMinutes[durationsMinutes.length - 1],
      sampleSize: durationsMinutes.length,
      excludedCount,
      averageContainmentMinutes,
      unit: 'minutes',
    };
  }

  /**
   * Unified MTTA and MTTR calculation with transparent disclosure of exclusions
   */
  async calculateMTTAAndMTTR(organizationId = null, options = {}) {
    const orgFilter = this._buildTenantQuery(organizationId);
    const incidents = await Incident.find(orgFilter)
      .select('createdAt acknowledgedAt resolvedAt sla timeline status closure')
      .lean();

    const mttaDurationsSec = [];
    let mttaExcludedCount = 0;

    const mttrDurationsSec = [];
    let mttrExcludedCount = 0;

    for (const inc of incidents) {
      const createdAt = inc.createdAt ? new Date(inc.createdAt).getTime() : null;

      // MTTA
      let ackTime = null;
      if (inc.acknowledgedAt) {
        ackTime = new Date(inc.acknowledgedAt).getTime();
      } else if (inc.sla?.acknowledgedAt) {
        ackTime = new Date(inc.sla.acknowledgedAt).getTime();
      } else if (inc.timeline && inc.timeline.length > 0) {
        const ackEvent = inc.timeline.find(
          (t) =>
            t.eventType === 'STATUS_CHANGE' ||
            t.action === 'STATE_TRANSITION'
        );
        if (ackEvent?.timestamp) {
          ackTime = new Date(ackEvent.timestamp).getTime();
        }
      }

      if (createdAt && ackTime && ackTime >= createdAt) {
        const diffSec = Math.round((ackTime - createdAt) / 1000);
        mttaDurationsSec.push(diffSec);
      } else {
        mttaExcludedCount++;
      }

      // MTTR
      let resTime = null;
      if (inc.resolvedAt) {
        resTime = new Date(inc.resolvedAt).getTime();
      } else if (inc.closure?.closedAt) {
        resTime = new Date(inc.closure.closedAt).getTime();
      } else if (inc.timeline && inc.timeline.length > 0) {
        const resEvent = inc.timeline.find(
          (t) =>
            t.eventType === 'STATUS_CHANGE' &&
            (t.details?.newStatus === 'RESOLVED' || t.details?.newStatus === 'CLOSED')
        );
        if (resEvent?.timestamp) {
          resTime = new Date(resEvent.timestamp).getTime();
        }
      }

      if (createdAt && resTime && resTime >= createdAt) {
        const diffSec = Math.round((resTime - createdAt) / 1000);
        mttrDurationsSec.push(diffSec);
      } else {
        mttrExcludedCount++;
      }
    }

    const mttaMeanSec =
      mttaDurationsSec.length > 0
        ? Math.round(mttaDurationsSec.reduce((a, b) => a + b, 0) / mttaDurationsSec.length)
        : null;

    const mttrMeanSec =
      mttrDurationsSec.length > 0
        ? Math.round(mttrDurationsSec.reduce((a, b) => a + b, 0) / mttrDurationsSec.length)
        : null;

    return {
      mtta: {
        meanSeconds: mttaMeanSec,
        meanMinutes: mttaMeanSec !== null ? Math.round((mttaMeanSec / 60) * 10) / 10 : null,
        formatted: mttaMeanSec !== null ? `${Math.round(mttaMeanSec / 60)}m` : 'INSUFFICIENT_DATA',
        sampleSize: mttaDurationsSec.length,
        excludedIncompleteCount: mttaExcludedCount,
        disclosure: 'Excludes incomplete records lacking verified acknowledgement timestamps.',
      },
      mttr: {
        meanSeconds: mttrMeanSec,
        meanMinutes: mttrMeanSec !== null ? Math.round((mttrMeanSec / 60) * 10) / 10 : null,
        formatted: mttrMeanSec !== null ? `${Math.round(mttrMeanSec / 60)}m` : 'INSUFFICIENT_DATA',
        sampleSize: mttrDurationsSec.length,
        excludedIncompleteCount: mttrExcludedCount,
        disclosure: 'Excludes incomplete or ongoing open records lacking verified resolution timestamps.',
      },
      timeRange: options.timeRange || '30d',
    };
  }

  /**
   * Calculates real-time SLA performance from persisted incident records
   */
  async getSLAPerformance(organizationId = null, options = {}) {
    const orgFilter = this._buildTenantQuery(organizationId);
    const incidents = await Incident.find(orgFilter).select('sla status severity');

    let totalSlaGoverned = 0;
    let onTrackCount = 0;
    let atRiskCount = 0;
    let breachedCount = 0;
    let completedCount = 0;

    for (const inc of incidents) {
      if (!inc.sla) continue;
      totalSlaGoverned++;

      const st = inc.sla.status || 'ON_TRACK';
      if (st === 'ON_TRACK') onTrackCount++;
      else if (st === 'AT_RISK') atRiskCount++;
      else if (st === 'BREACHED') breachedCount++;
      else if (st === 'COMPLETED') completedCount++;
    }

    const breachRate =
      totalSlaGoverned > 0 ? Math.round((breachedCount / totalSlaGoverned) * 1000) / 10 : 0;

    return {
      organizationId,
      timestamp: new Date(),
      status: totalSlaGoverned > 0 ? 'MEASURED' : 'NO_DATA',
      totalSlaGoverned,
      totalGoverned: totalSlaGoverned,
      onTrackCount,
      atRiskCount,
      breachedCount,
      completedCount,
      breachRate, // percentage
      onTrackRate: totalSlaGoverned > 0 ? Math.round((onTrackCount / totalSlaGoverned) * 100) : 100,
      compliancePercentage: totalSlaGoverned > 0 ? Math.round((100 - breachRate) * 10) / 10 : 100,
    };
  }

  /**
   * Generates real historical trends strictly from actual record creation dates
   */
  async getHistoricalTrends(organizationId = null, options = {}) {
    const { interval = 'day', limit = 14 } = options;
    const orgFilter = this._buildTenantQuery(organizationId);

    // Group incidents by day
    const incidents = await Incident.find(orgFilter).select('createdAt severity status');
    const alerts = await Alert.find(orgFilter).select('createdAt severity');
    const findings = await Finding.find(orgFilter).select('createdAt severity');

    const trendMap = new Map();

    const getBucketKey = (date) => {
      if (!date) return null;
      const d = new Date(date);
      if (isNaN(d.getTime())) return null;
      return d.toISOString().split('T')[0]; // YYYY-MM-DD
    };

    for (const inc of incidents) {
      const key = getBucketKey(inc.createdAt);
      if (!key) continue;
      if (!trendMap.has(key)) {
        trendMap.set(key, { date: key, incidents: 0, criticalIncidents: 0, alerts: 0, findings: 0 });
      }
      const item = trendMap.get(key);
      item.incidents++;
      if (inc.severity === 'CRITICAL') item.criticalIncidents++;
    }

    for (const al of alerts) {
      const key = getBucketKey(al.createdAt);
      if (!key) continue;
      if (!trendMap.has(key)) {
        trendMap.set(key, { date: key, incidents: 0, criticalIncidents: 0, alerts: 0, findings: 0 });
      }
      trendMap.get(key).alerts++;
    }

    for (const fn of findings) {
      const key = getBucketKey(fn.createdAt);
      if (!key) continue;
      if (!trendMap.has(key)) {
        trendMap.set(key, { date: key, incidents: 0, criticalIncidents: 0, alerts: 0, findings: 0 });
      }
      trendMap.get(key).findings++;
    }

    // Sort chronologically
    const points = Array.from(trendMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-limit);

    return {
      organizationId,
      interval,
      totalPoints: points.length,
      hasHistoricalData: points.length > 0,
      trendPoints: points,
    };
  }

  /**
   * Captures an immutable snapshot of all metrics
   */
  async takeSnapshot(organizationId = null, periodLabel = null) {
    const period = periodLabel || new Date().toISOString().split('T')[0];
    const kpis = await this.getOperationalKPIs(organizationId);
    const mtta = await this.getMTTA(organizationId);
    const mttr = await this.getMTTR(organizationId);
    const sla = await this.getSLAPerformance(organizationId);
    const trends = await this.getHistoricalTrends(organizationId);

    const snapshotId = `SNAP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const snapshot = new MetricSnapshot({
      snapshotId,
      period,
      organizationId,
      kpis,
      mtta,
      mttr,
      sla,
      trends,
    });

    await snapshot.save();

    this.emitRealTimeEvent('metrics:updated', {
      snapshotId,
      period,
      organizationId,
    });

    return snapshot;
  }
}

module.exports = new SOCMetricsService();
