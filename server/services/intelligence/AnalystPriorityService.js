class AnalystPriorityService {
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

  _computePriorityScore(item) {
    let score = 0;
    const factors = [];

    // 1. Severity Factor (max 40 pts)
    const sev = (item.severity || '').toUpperCase();
    if (sev === 'CRITICAL') {
      score += 40;
      factors.push({ factor: 'SEVERITY', points: 40, detail: 'Severity is CRITICAL' });
    } else if (sev === 'HIGH') {
      score += 30;
      factors.push({ factor: 'SEVERITY', points: 30, detail: 'Severity is HIGH' });
    } else if (sev === 'MEDIUM') {
      score += 15;
      factors.push({ factor: 'SEVERITY', points: 15, detail: 'Severity is MEDIUM' });
    } else {
      score += 5;
      factors.push({ factor: 'SEVERITY', points: 5, detail: 'Severity is LOW / INFORMATIONAL' });
    }

    // 2. Unresolved Status Factor (max 20 pts)
    const status = (item.status || '').toUpperCase();
    if (['DETECTED', 'TRIAGING', 'INVESTIGATING', 'OPEN', 'ACTIVE', 'DRIFT_DETECTED'].includes(status)) {
      score += 20;
      factors.push({ factor: 'ACTIVE_UNRESOLVED_STATE', points: 20, detail: `Status is active (${status})` });
    } else if (['CONTAINED', 'REVIEW'].includes(status)) {
      score += 10;
      factors.push({ factor: 'ACTIVE_UNRESOLVED_STATE', points: 10, detail: `Status is pending resolution (${status})` });
    }

    // 3. Recency Factor (max 15 pts)
    const timestamp = item.createdAt || item.evaluatedAt || item.firstObservedAt || new Date();
    const ageHours = (Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60);
    if (ageHours <= 12) {
      score += 15;
      factors.push({ factor: 'RECENCY', points: 15, detail: 'Observed within last 12 hours' });
    } else if (ageHours <= 48) {
      score += 10;
      factors.push({ factor: 'RECENCY', points: 10, detail: 'Observed within last 48 hours' });
    } else if (ageHours <= 168) {
      score += 5;
      factors.push({ factor: 'RECENCY', points: 5, detail: 'Observed within last 7 days' });
    }

    // 4. SLA Status Factor (max 15 pts)
    const slaStatus = (item.slaStatus || '').toUpperCase();
    if (slaStatus === 'BREACHED') {
      score += 15;
      factors.push({ factor: 'SLA_EXPOSURE', points: 15, detail: 'SLA is BREACHED' });
    } else if (slaStatus === 'AT_RISK') {
      score += 10;
      factors.push({ factor: 'SLA_EXPOSURE', points: 10, detail: 'SLA is AT_RISK' });
    }

    // 5. Evidence Density Factor (max 10 pts)
    const evidenceCount = (item.evidenceReferences || item.evidence || []).length;
    if (evidenceCount >= 3) {
      score += 10;
      factors.push({ factor: 'EVIDENCE_DENSITY', points: 10, detail: `${evidenceCount} supporting evidence records present` });
    } else if (evidenceCount > 0) {
      score += 5;
      factors.push({ factor: 'EVIDENCE_DENSITY', points: 5, detail: `${evidenceCount} supporting evidence record present` });
    }

    const priorityScore = Math.min(100, Math.max(0, score));
    let priorityBand = 'LOW';
    if (priorityScore >= 80) priorityBand = 'CRITICAL';
    else if (priorityScore >= 60) priorityBand = 'HIGH';
    else if (priorityScore >= 40) priorityBand = 'MEDIUM';

    return { priorityScore, priorityBand, factors };
  }

  async getPrioritizedQueue(organizationId, options = {}) {
    const scope = organizationId ? { organizationId } : {};
    const limit = Math.min(options.limit || 50, 100);
    const candidates = [];

    // Fetch Incidents
    try {
      const IncidentModel = this._getModel('Incident');
      if (IncidentModel) {
        const incidents = await IncidentModel.find({
          ...scope,
          status: { $nin: ['RESOLVED', 'CLOSED'] }
        }).limit(30).lean();

        incidents.forEach((inc) => {
          const { priorityScore, priorityBand, factors } = this._computePriorityScore(inc);
          candidates.push({
            subjectType: 'INCIDENT',
            subjectId: inc.incidentId || String(inc._id),
            title: inc.title || `Incident ${inc.incidentId}`,
            severity: inc.severity || 'MEDIUM',
            status: inc.status,
            priorityScore,
            priorityBand,
            factors,
            evidenceReferences: inc.evidenceReferences || [],
            sourceRecord: { collection: 'Incident', id: inc.incidentId || inc._id }
          });
        });
      }
    } catch {
      // safe fallback
    }

    // Fetch Alerts
    try {
      const AlertModel = this._getModel('Alert');
      if (AlertModel) {
        const alerts = await AlertModel.find({
          ...scope,
          status: { $ne: 'RESOLVED' }
        }).limit(30).lean();

        alerts.forEach((alert) => {
          const { priorityScore, priorityBand, factors } = this._computePriorityScore(alert);
          candidates.push({
            subjectType: 'ALERT',
            subjectId: alert.alertId || String(alert._id),
            title: alert.title || `Alert ${alert.alertId}`,
            severity: alert.severity || 'MEDIUM',
            status: alert.status,
            priorityScore,
            priorityBand,
            factors,
            evidenceReferences: alert.evidenceReferences || [],
            sourceRecord: { collection: 'Alert', id: alert.alertId || alert._id }
          });
        });
      }
    } catch {
      // safe fallback
    }

    // Fetch Findings
    try {
      const FindingModel = this._getModel('Finding');
      if (FindingModel) {
        const findings = await FindingModel.find({
          ...scope,
          status: { $ne: 'REMEDIATED' }
        }).limit(20).lean();

        findings.forEach((f) => {
          const { priorityScore, priorityBand, factors } = this._computePriorityScore(f);
          candidates.push({
            subjectType: 'FINDING',
            subjectId: f.findingId || String(f._id),
            title: f.title || `Finding ${f.findingId}`,
            severity: f.severity || 'MEDIUM',
            status: f.status,
            priorityScore,
            priorityBand,
            factors,
            evidenceReferences: f.evidenceReferences || [],
            sourceRecord: { collection: 'Finding', id: f.findingId || f._id }
          });
        });
      }
    } catch {
      // safe fallback
    }

    // Sort descending by priorityScore, then by title
    candidates.sort((a, b) => b.priorityScore - a.priorityScore);

    // Assign rank
    const prioritizedQueue = candidates.slice(0, limit).map((c, index) => ({
      priorityRank: index + 1,
      ...c,
      rationale: `Subject ranked #${index + 1} with score ${c.priorityScore}/100 based on ${c.factors.length} deterministic criteria.`
    }));

    return {
      totalCandidates: candidates.length,
      returnedCount: prioritizedQueue.length,
      evaluatedAt: new Date(),
      queue: prioritizedQueue
    };
  }

  async explainPriority(organizationId, subjectType, subjectId) {
    const queueResult = await this.getPrioritizedQueue(organizationId, { limit: 100 });
    const match = queueResult.queue.find(q => q.subjectType === subjectType && q.subjectId === subjectId);

    if (!match) {
      return {
        subjectType,
        subjectId,
        priorityRank: null,
        priorityScore: null,
        priorityBand: 'UNKNOWN',
        rationale: 'Subject is not currently active in the unresolved priority queue.',
        factors: [],
        determination: 'INSUFFICIENT_EVIDENCE'
      };
    }

    return {
      subjectType: match.subjectType,
      subjectId: match.subjectId,
      title: match.title,
      priorityRank: match.priorityRank,
      priorityScore: match.priorityScore,
      priorityBand: match.priorityBand,
      factors: match.factors,
      rationale: match.rationale,
      determination: 'DERIVED',
      supportingRecords: [match.sourceRecord]
    };
  }
}

module.exports = AnalystPriorityService;
