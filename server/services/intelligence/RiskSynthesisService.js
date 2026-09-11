const crypto = require('crypto');
const mongoose = require('mongoose');
const RiskAssessment = require('../../models/RiskAssessment');
const RiskSnapshot = require('../../models/RiskSnapshot');

class RiskSynthesisService {
  constructor(dependencies = {}) {
    this.dependencies = dependencies;
  }

  _getModel(name) {
    if (this.dependencies[name]) return this.dependencies[name];
    try {
      return require(`../../models/${name}`);
    } catch {
      return null;
    }
  }

  _buildIdQuery(idField, idValue, scope = {}) {
    const isObjectId = mongoose.Types.ObjectId.isValid(idValue) && String(new mongoose.Types.ObjectId(idValue)) === String(idValue);
    return isObjectId
      ? { ...scope, $or: [{ [idField]: idValue }, { _id: idValue }] }
      : { ...scope, [idField]: idValue };
  }

  _computeSha256(data) {
    return crypto.createHash('sha256').update(typeof data === 'string' ? data : JSON.stringify(data)).digest('hex');
  }

  _determineRiskBand(score) {
    if (score === null || score === undefined || isNaN(score)) return 'UNKNOWN';
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    if (score > 0) return 'LOW';
    return 'UNKNOWN';
  }

  async calculateSubjectRisk(organizationId, subjectType, subjectId) {
    const scope = organizationId ? { organizationId } : {};
    const factors = [];
    const positiveEvidence = [];
    const negativeEvidence = [];
    const evidenceReferences = [];

    let rawScoreAccumulator = 0;
    let totalWeight = 0;
    let recordsExamined = 0;

    // 1. Incidents Factor
    try {
      const IncidentModel = this._getModel('Incident');
      if (IncidentModel) {
        let incidentQuery = null;
        if (subjectType === 'INCIDENT' && subjectId) {
          incidentQuery = this._buildIdQuery('incidentId', subjectId, scope);
        } else if (subjectType === 'ASSET' && subjectId) {
          incidentQuery = { ...scope, status: { $nin: ['RESOLVED', 'CLOSED'] }, affectedAssets: subjectId };
        } else if (subjectType === 'EXECUTIVE' || subjectType === 'ORGANIZATION') {
          incidentQuery = { ...scope, status: { $nin: ['RESOLVED', 'CLOSED'] } };
        }

        if (incidentQuery) {
          const activeIncidents = await IncidentModel.find(incidentQuery).limit(50).lean();
          recordsExamined += activeIncidents.length;

          if (activeIncidents.length > 0) {
            let incidentSeverityScore = 0;
            activeIncidents.forEach((inc) => {
              const sev = (inc.severity || '').toUpperCase();
              if (sev === 'CRITICAL') incidentSeverityScore += 40;
              else if (sev === 'HIGH') incidentSeverityScore += 25;
              else if (sev === 'MEDIUM') incidentSeverityScore += 15;
              else incidentSeverityScore += 5;

              const refId = inc.incidentId || String(inc._id);
              evidenceReferences.push(`INCIDENT:${refId}`);
              negativeEvidence.push({
                factorName: 'ACTIVE_INCIDENT',
                threatDescription: `Active ${sev} incident: ${inc.title || refId}`,
                sourceRecords: [`INCIDENT:${refId}`]
              });
            });

            const clampedIncidentScore = Math.min(100, incidentSeverityScore);
            factors.push({
              factorName: 'INCIDENT_SEVERITY_AND_VOLUME',
              contribution: clampedIncidentScore,
              weight: 0.30,
              rawValue: { activeCount: activeIncidents.length },
              sourceRecords: activeIncidents.map(i => `INCIDENT:${i.incidentId || i._id}`),
              basis: `Evaluated ${activeIncidents.length} active incidents with cumulative severity weighting.`
            });
            rawScoreAccumulator += clampedIncidentScore * 0.30;
            totalWeight += 0.30;
          }
        }
      }
    } catch {
      // safe fallback
    }

    // 2. Alerts Factor
    try {
      const AlertModel = this._getModel('Alert');
      if (AlertModel) {
        let alertQuery = null;
        if (subjectType === 'ALERT' && subjectId) {
          alertQuery = this._buildIdQuery('alertId', subjectId, scope);
        } else if (subjectType === 'ASSET' && subjectId) {
          alertQuery = { ...scope, status: { $ne: 'RESOLVED' }, $or: [{ assetId: subjectId }, { asset: subjectId }] };
        } else if (subjectType === 'EXECUTIVE' || subjectType === 'ORGANIZATION') {
          alertQuery = { ...scope, status: { $ne: 'RESOLVED' } };
        }

        if (alertQuery) {
          const activeAlerts = await AlertModel.find(alertQuery).limit(100).lean();
          recordsExamined += activeAlerts.length;

          if (activeAlerts.length > 0) {
            let alertScore = 0;
            activeAlerts.forEach((a) => {
              const sev = (a.severity || '').toUpperCase();
              if (sev === 'CRITICAL') alertScore += 20;
              else if (sev === 'HIGH') alertScore += 12;
              else if (sev === 'MEDIUM') alertScore += 6;
              else alertScore += 2;

              const refId = a.alertId || String(a._id);
              evidenceReferences.push(`ALERT:${refId}`);
            });

            const clampedAlertScore = Math.min(100, alertScore);
            factors.push({
              factorName: 'UNRESOLVED_ALERTS',
              contribution: clampedAlertScore,
              weight: 0.20,
              rawValue: { alertCount: activeAlerts.length },
              sourceRecords: activeAlerts.map(a => `ALERT:${a.alertId || a._id}`),
              basis: `Evaluated ${activeAlerts.length} unresolved SOC alerts.`
            });
            rawScoreAccumulator += clampedAlertScore * 0.20;
            totalWeight += 0.20;
          }
        }
      }
    } catch {
      // safe fallback
    }

    // 3. Unresolved Findings Factor
    try {
      const FindingModel = this._getModel('Finding');
      if (FindingModel) {
        let findingQuery = null;
        if (subjectType === 'FINDING' && subjectId) {
          findingQuery = this._buildIdQuery('findingId', subjectId, scope);
        } else if (subjectType === 'ASSET' && subjectId) {
          findingQuery = { ...scope, status: { $ne: 'REMEDIATED' }, $or: [{ target: subjectId }, { assetId: subjectId }] };
        } else if (subjectType === 'EXECUTIVE' || subjectType === 'ORGANIZATION') {
          findingQuery = { ...scope, status: { $ne: 'REMEDIATED' } };
        }

        if (findingQuery) {
          const openFindings = await FindingModel.find(findingQuery).limit(100).lean();
          recordsExamined += openFindings.length;

          if (openFindings.length > 0) {
            let findingScore = 0;
            openFindings.forEach((f) => {
              const sev = (f.severity || '').toUpperCase();
              if (sev === 'CRITICAL') findingScore += 25;
              else if (sev === 'HIGH') findingScore += 15;
              else if (sev === 'MEDIUM') findingScore += 8;
              else findingScore += 3;

              const refId = f.findingId || String(f._id);
              evidenceReferences.push(`FINDING:${refId}`);
            });

            const clampedFindingScore = Math.min(100, findingScore);
            factors.push({
              factorName: 'UNRESOLVED_FINDINGS',
              contribution: clampedFindingScore,
              weight: 0.15,
              rawValue: { findingCount: openFindings.length },
              sourceRecords: openFindings.map(f => `FINDING:${f.findingId || f._id}`),
              basis: `Evaluated ${openFindings.length} open security findings.`
            });
            rawScoreAccumulator += clampedFindingScore * 0.15;
            totalWeight += 0.15;
          }
        }
      }
    } catch {
      // safe fallback
    }

    // 4. Detection Gaps Factor (Executive or Detection specific)
    try {
      if (subjectType === 'EXECUTIVE' || subjectType === 'ORGANIZATION' || subjectType === 'DETECTION') {
        const GapModel = this._getModel('DetectionGap');
        if (GapModel) {
          const activeGaps = await GapModel.find({ ...scope, status: 'OPEN' }).limit(50).lean();
          recordsExamined += activeGaps.length;

          if (activeGaps.length > 0) {
            const gapScore = Math.min(100, activeGaps.length * 15);
            factors.push({
              factorName: 'DETECTION_COVERAGE_GAPS',
              contribution: gapScore,
              weight: 0.10,
              rawValue: { gapCount: activeGaps.length },
              sourceRecords: activeGaps.map(g => `GAP:${g.gapId || g._id}`),
              basis: `Evaluated ${activeGaps.length} active uncovered ATT&CK detection gaps.`
            });
            rawScoreAccumulator += gapScore * 0.10;
            totalWeight += 0.10;
          }
        }
      }
    } catch {
      // safe fallback
    }

    // 5. Reliability / Health Factor (Executive or Reliability specific)
    try {
      if (subjectType === 'EXECUTIVE' || subjectType === 'ORGANIZATION' || subjectType === 'RELIABILITY') {
        const HealthModel = this._getModel('ServiceHealthSnapshot');
        if (HealthModel) {
          const latestHealth = await HealthModel.findOne(scope).sort({ generatedAt: -1 }).lean();
          if (latestHealth) {
            recordsExamined += 1;
            const status = (latestHealth.status || '').toUpperCase();
            let reliabilityScore = 0;
            if (status === 'UNHEALTHY') reliabilityScore = 80;
            else if (status === 'DEGRADED') reliabilityScore = 40;
            else if (status === 'HEALTHY') {
              positiveEvidence.push({
                factorName: 'PLATFORM_RELIABILITY',
                mitigationDescription: 'Core platform subsystems report HEALTHY.',
                sourceRecords: [`HEALTH:${latestHealth.snapshotId || latestHealth._id}`]
              });
            }

            if (reliabilityScore > 0) {
              factors.push({
                factorName: 'RELIABILITY_DEGRADATION',
                contribution: reliabilityScore,
                weight: 0.10,
                rawValue: { status },
                sourceRecords: [`HEALTH:${latestHealth.snapshotId || latestHealth._id}`],
                basis: `Platform health state observed as ${status}.`
              });
              rawScoreAccumulator += reliabilityScore * 0.10;
              totalWeight += 0.10;
            }
          }
        }
      }
    } catch {
      // safe fallback
    }

    // 6. Automation & Drift Failures (Executive, Governance, or Automation specific)
    try {
      if (subjectType === 'EXECUTIVE' || subjectType === 'ORGANIZATION' || subjectType === 'GOVERNANCE' || subjectType === 'AUTOMATION') {
        const DriftModel = this._getModel('SecurityDrift');
        if (DriftModel) {
          const activeDrifts = await DriftModel.find({
            ...scope,
            status: { $in: ['OPEN', 'ACKNOWLEDGED', 'REMEDIATION_PENDING', 'DRIFT_DETECTED'] }
          }).limit(50).lean();
          recordsExamined += activeDrifts.length;
          if (activeDrifts.length > 0) {
            const driftScore = Math.min(100, activeDrifts.length * 20);
            factors.push({
              factorName: 'SECURITY_DRIFT_AND_AUTOMATION',
              contribution: driftScore,
              weight: 0.15,
              rawValue: { driftCount: activeDrifts.length },
              sourceRecords: activeDrifts.map(d => `DRIFT:${d.driftId || d._id}`),
              basis: `Evaluated ${activeDrifts.length} unresolved security configuration drifts.`
            });
            rawScoreAccumulator += driftScore * 0.15;
            totalWeight += 0.15;
          }
        }
      }
    } catch {
      // safe fallback
    }

    // Truthful determination:
    if (recordsExamined === 0 || totalWeight === 0) {
      return {
        assessmentId: `RISK-ASSESS-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        organizationId,
        subjectType,
        subjectId,
        riskScore: null,
        riskBand: 'UNKNOWN',
        determination: 'INSUFFICIENT_EVIDENCE',
        factors: [],
        positiveEvidence: [],
        negativeEvidence: [],
        evidenceReferences: [],
        calculatedAt: new Date(),
        algorithmVersion: 'v62.2.0',
        disclaimer: 'Zero risk synthesized because no telemetry or records exist for this subject.'
      };
    }

    const calculatedRisk = Math.round(rawScoreAccumulator / totalWeight);
    const riskBand = this._determineRiskBand(calculatedRisk);

    const assessment = {
      assessmentId: `RISK-ASSESS-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      organizationId,
      subjectType,
      subjectId,
      riskScore: calculatedRisk,
      riskBand,
      determination: 'DERIVED',
      factors,
      positiveEvidence,
      negativeEvidence,
      evidenceReferences: Array.from(new Set(evidenceReferences)),
      calculatedAt: new Date(),
      algorithmVersion: 'v62.2.0'
    };

    // Optionally persist to DB
    try {
      await RiskAssessment.create(assessment);
    } catch {
      // persistence fallback
    }

    return assessment;
  }

  async calculateExecutiveRisk(organizationId) {
    return this.calculateSubjectRisk(organizationId, 'EXECUTIVE', 'ORGANIZATION_WIDE');
  }

  async createRiskSnapshot(organizationId, subjectType, subjectId, options = {}) {
    const assessment = await this.calculateSubjectRisk(organizationId, subjectType, subjectId);

    const snapshotPayload = {
      organizationId,
      subjectType,
      subjectId,
      calculatedRisk: assessment.riskScore,
      riskBand: assessment.riskBand,
      factors: assessment.factors,
      evidenceReferences: assessment.evidenceReferences,
      engineVersion: 'v62.2.0',
      generatedTimestamp: new Date(),
      metadata: options.metadata || {}
    };

    const contentHash = this._computeSha256({
      organizationId,
      subjectType,
      subjectId,
      calculatedRisk: assessment.riskScore,
      riskBand: assessment.riskBand,
      factors: assessment.factors,
      evidenceReferences: assessment.evidenceReferences
    });

    const snapshot = {
      snapshotId: `RISK-SNAP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      ...snapshotPayload,
      contentHash
    };

    try {
      await RiskSnapshot.create(snapshot);
    } catch {
      // persistence fallback
    }

    return snapshot;
  }

  async getRiskHistory(organizationId, subjectType, subjectId, limit = 10) {
    const query = { subjectType, subjectId };
    if (organizationId) query.organizationId = organizationId;

    try {
      const history = await RiskSnapshot.find(query)
        .sort({ generatedTimestamp: -1 })
        .limit(Math.min(limit, 50))
        .lean();
      return history;
    } catch {
      return [];
    }
  }

  compareRiskSnapshots(snapshotA, snapshotB) {
    if (!snapshotA || !snapshotB) {
      return { deltaScore: 0, changedFactors: [], evidenceAdded: [], evidenceRemoved: [] };
    }

    const scoreA = snapshotA.calculatedRisk || 0;
    const scoreB = snapshotB.calculatedRisk || 0;
    const deltaScore = scoreB - scoreA;

    const refsA = new Set(snapshotA.evidenceReferences || []);
    const refsB = new Set(snapshotB.evidenceReferences || []);

    const evidenceAdded = [...refsB].filter(x => !refsA.has(x));
    const evidenceRemoved = [...refsA].filter(x => !refsB.has(x));

    return {
      previousScore: scoreA,
      currentScore: scoreB,
      deltaScore,
      previousBand: snapshotA.riskBand,
      currentBand: snapshotB.riskBand,
      evidenceAdded,
      evidenceRemoved,
      isSignificantShift: Math.abs(deltaScore) >= 15
    };
  }
}

module.exports = RiskSynthesisService;
