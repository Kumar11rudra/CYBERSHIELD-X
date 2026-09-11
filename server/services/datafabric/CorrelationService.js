const crypto = require('crypto');
const CorrelationRule = require('../../models/CorrelationRule');
const CorrelationResult = require('../../models/CorrelationResult');
const SecurityGraphEdge = require('../../models/SecurityGraphEdge');
const SecurityGraphService = require('./SecurityGraphService');

class CorrelationService {
  /**
   * Calculate SHA-256 checksum for a correlation rule
   */
  static computeRuleChecksum(ruleData) {
    return crypto.createHash('sha256').update(JSON.stringify(ruleData)).digest('hex');
  }

  /**
   * Create a new correlation rule in DRAFT status
   */
  static async createRule(ruleData, creatorUser, organizationId = null) {
    const ruleId = ruleData.ruleId || `CORR-RULE-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const checksum = this.computeRuleChecksum(ruleData);

    const rule = await CorrelationRule.create({
      ...ruleData,
      ruleId,
      organizationId: ruleData.organizationId || organizationId,
      status: 'DRAFT',
      version: 1,
      checksum,
      createdBy: {
        userId: creatorUser?.userId || creatorUser?.id || 'SYSTEM',
        username: creatorUser?.username || 'system',
        role: creatorUser?.role || 'ADMIN'
      }
    });

    return rule;
  }

  /**
   * Activate correlation rule
   */
  static async activateRule(ruleId, organizationId = null) {
    const query = { ruleId };
    if (organizationId) query.organizationId = organizationId;

    const rule = await CorrelationRule.findOne(query);
    if (!rule) throw new Error(`Correlation rule ${ruleId} not found`);

    rule.status = 'ACTIVE';
    await rule.save();
    return rule;
  }

  /**
   * Execute deterministic correlation for a target rule
   */
  static async executeCorrelationRule(ruleId, organizationId = null) {
    const query = { ruleId };
    if (organizationId) query.organizationId = organizationId;

    const rule = await CorrelationRule.findOne(query);
    if (!rule) throw new Error(`Correlation rule ${ruleId} not found`);

    if (rule.status !== 'ACTIVE') {
      throw new Error(`Correlation rule ${ruleId} is in status ${rule.status} and cannot be executed`);
    }

    const SecurityGraphNode = require('../../models/SecurityGraphNode');
    const orgQuery = organizationId ? { organizationId } : {};

    const sourceNodes = await SecurityGraphNode.find({
      ...orgQuery,
      entityType: { $in: rule.entityTypes }
    }).limit(100).lean();

    if (sourceNodes.length < 2) {
      const result = await CorrelationResult.create({
        correlationId: `CORR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        organizationId,
        ruleId: rule.ruleId,
        sourceEntities: [],
        matchedEntities: [],
        relationshipType: rule.relationshipType,
        provenanceReferences: [`RULE_${rule.ruleId}`],
        determination: 'INSUFFICIENT_EVIDENCE'
      });
      return { determination: 'INSUFFICIENT_EVIDENCE', result };
    }

    // Perform deterministic matching
    const matchedPairs = [];
    for (let i = 0; i < sourceNodes.length; i++) {
      for (let j = i + 1; j < sourceNodes.length; j++) {
        const n1 = sourceNodes[i];
        const n2 = sourceNodes[j];

        if (n1.entityType !== n2.entityType) {
          // Check matching criteria (e.g. matching organizationId or shared metadata key)
          const timeDiffMs = Math.abs(new Date(n1.lastObservedAt) - new Date(n2.lastObservedAt));
          const maxWindowMs = (rule.timeWindowMinutes || 60) * 60 * 1000;

          if (timeDiffMs <= maxWindowMs) {
            matchedPairs.push({ n1, n2 });

            // Create graph edge
            await SecurityGraphService.materializeEdge({
              fromNodeId: n1.nodeId,
              toNodeId: n2.nodeId,
              relationshipType: rule.relationshipType,
              provenanceType: 'DETERMINISTIC_CORRELATION',
              provenanceReferences: [`CORR_RULE_${rule.ruleId}`],
              organizationId
            });
          }
        }
      }
    }

    const determination = matchedPairs.length > 0 ? 'CORRELATED' : 'NO_MATCH';

    const result = await CorrelationResult.create({
      correlationId: `CORR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      organizationId,
      ruleId: rule.ruleId,
      sourceEntities: matchedPairs.map(p => ({ entityType: p.n1.entityType, entityId: p.n1.entityId })),
      matchedEntities: matchedPairs.map(p => ({ entityType: p.n2.entityType, entityId: p.n2.entityId })),
      relationshipType: rule.relationshipType,
      provenanceReferences: [`RULE_${rule.ruleId}_MATCHES_${matchedPairs.length}`],
      determination
    });

    return { determination, matchedCount: matchedPairs.length, result };
  }

  /**
   * Seed canonical correlation rules idempotently
   */
  static async seedCanonicalRules(organizationId = null) {
    const canonicals = [
      {
        ruleId: 'CORR-RULE-ASSET-INCIDENT-01',
        name: 'Asset to Incident Correlation',
        description: 'Correlates affected asset nodes with active incident records within 60 minutes.',
        entityTypes: ['ASSET', 'INCIDENT'],
        relationshipType: 'AFFECTS',
        matchCriteria: { timeProximityMinutes: 60 },
        timeWindowMinutes: 60
      },
      {
        ruleId: 'CORR-RULE-IOC-ALERT-01',
        name: 'IOC to Alert Fusion Correlation',
        description: 'Correlates threat intelligence IOC indicators with active security alerts.',
        entityTypes: ['IOC', 'ALERT'],
        relationshipType: 'DETECTED_BY',
        matchCriteria: { fieldMatch: 'value' },
        timeWindowMinutes: 120
      },
      {
        ruleId: 'CORR-RULE-AUTOMATION-DRIFT-01',
        name: 'Automation Execution to Governance Drift Correlation',
        description: 'Links security drift records with playbook remediation executions.',
        entityTypes: ['AUTOMATION_EXECUTION', 'GOVERNANCE_POLICY'],
        relationshipType: 'REMEDIATED_BY',
        matchCriteria: { directRef: true },
        timeWindowMinutes: 180
      }
    ];

    const seeded = [];
    for (const data of canonicals) {
      const existing = await CorrelationRule.findOne({ ruleId: data.ruleId });
      if (!existing) {
        const rule = await this.createRule(data, { username: 'canonical_seeder', role: 'ADMIN' }, organizationId);
        await this.activateRule(rule.ruleId, organizationId);
        seeded.push(rule.ruleId);
      }
    }

    return seeded;
  }
}

module.exports = CorrelationService;
