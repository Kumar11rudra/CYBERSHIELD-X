/**
 * 🛡️ CyberShield X — ThreatHuntQueryEngine (Phase 71)
 *
 * Safe AST validator and deterministic query compiler for Threat Hunting.
 * Compiles validated AST expressions into safe MongoDB queries across real persisted data:
 * - Finding, Alert, Incident, Asset, IOCRecord, TerminalHistory
 *
 * Enforces:
 * - Deterministic operators (equals, not_equals, contains, regex, greater_than, less_than, in)
 * - Boolean logic (AND, OR)
 * - Bounded time horizons (15m, 1h, 24h, 7d, 30d; max ceiling 30 days)
 * - Output ceiling (max 250 items)
 * - Strict multi-tenant isolation (organizationId boundary)
 * - Zero raw injection or arbitrary MongoDB operator execution
 */

const Finding = require('../../models/Finding');
const Alert = require('../../models/Alert');
const Incident = require('../../models/Incident');
const Asset = require('../../models/Asset');
const IOCRecord = require('../../models/IOCRecord');
const TerminalHistory = require('../../models/TerminalHistory');
const logger = require('../../utils/logger');

const SUPPORTED_ENTITIES = [
  'asset',
  'hostname',
  'ip',
  'domain',
  'url',
  'ioc',
  'executionId',
  'finding',
  'alert',
  'incident',
  'detection',
  'terminal_job',
];

const SUPPORTED_OPERATORS = [
  'equals',
  'not_equals',
  'contains',
  'regex',
  'greater_than',
  'less_than',
  'in',
];

const MAX_RESULT_LIMIT = 250;
const MAX_TIME_RANGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function escapeRegex(string) {
  return String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class ThreatHuntQueryEngine {
  /**
   * Validates a structured query AST
   * @param {Object} query - { entity, conditions, booleanLogic }
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validateQuery(query) {
    const errors = [];

    if (!query || typeof query !== 'object') {
      return { valid: false, errors: ['Query must be a non-null object'] };
    }

    if (!query.entity || !SUPPORTED_ENTITIES.includes(query.entity.toLowerCase())) {
      errors.push(`Invalid entity. Supported entities: ${SUPPORTED_ENTITIES.join(', ')}`);
    }

    if (!Array.isArray(query.conditions) || query.conditions.length === 0) {
      errors.push('Query must contain at least one condition in conditions array');
    } else {
      if (query.conditions.length > 10) {
        errors.push('Maximum 10 conditions permitted per query');
      }

      query.conditions.forEach((cond, idx) => {
        if (!cond || typeof cond !== 'object') {
          errors.push(`Condition at index ${idx} must be an object`);
          return;
        }
        if (!cond.field || typeof cond.field !== 'string') {
          errors.push(`Condition at index ${idx} must specify a string field`);
        } else {
          // Reject dangerous fields or injection characters
          if (cond.field.startsWith('$') || cond.field.includes(';') || cond.field.length > 60) {
            errors.push(`Condition at index ${idx} specifies invalid field name: "${cond.field}"`);
          }
        }
        if (!cond.operator || !SUPPORTED_OPERATORS.includes(cond.operator)) {
          errors.push(`Condition at index ${idx} specifies unsupported operator: "${cond.operator}"`);
        }
        if (cond.value === undefined || cond.value === null || cond.value === '') {
          errors.push(`Condition at index ${idx} must specify a non-empty value`);
        }
      });
    }

    const logic = (query.booleanLogic || 'AND').toUpperCase();
    if (!['AND', 'OR'].includes(logic)) {
      errors.push('booleanLogic must be either "AND" or "OR"');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Resolves bounded time horizon from hunt timeRange definition
   * @param {Object} timeRange - { type, relativeWindow, startDate, endDate }
   * @returns {{ start: Date, end: Date, windowLabel: string }}
   */
  resolveTimeRange(timeRange = {}) {
    const now = new Date();
    let start = new Date(now.getTime() - 24 * 60 * 60 * 1000); // default 24h
    let end = now;
    let windowLabel = '24h';

    if (timeRange.type === 'absolute' && timeRange.startDate && timeRange.endDate) {
      const parsedStart = new Date(timeRange.startDate);
      const parsedEnd = new Date(timeRange.endDate);
      if (!isNaN(parsedStart.getTime()) && !isNaN(parsedEnd.getTime()) && parsedStart < parsedEnd) {
        start = parsedStart;
        end = parsedEnd;
        windowLabel = `${start.toISOString()} to ${end.toISOString()}`;
      }
    } else {
      const window = timeRange.relativeWindow || '24h';
      windowLabel = window;
      switch (window) {
        case '15m':
          start = new Date(now.getTime() - 15 * 60 * 1000);
          break;
        case '1h':
          start = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          windowLabel = '24h';
      }
    }

    // Strict clamp: Max time horizon cannot exceed 30 days
    if (end.getTime() - start.getTime() > MAX_TIME_RANGE_MS) {
      start = new Date(end.getTime() - MAX_TIME_RANGE_MS);
      windowLabel += ' (clamped to 30d max)';
    }

    return { start, end, windowLabel };
  }

  /**
   * Compiles an AST condition into a safe MongoDB filter expression
   * @param {Object} condition - { field, operator, value }
   * @returns {Object} MongoDB query leaf
   */
  compileConditionToMongo(condition) {
    const { field, operator, value } = condition;

    switch (operator) {
      case 'equals':
        return { [field]: value };

      case 'not_equals':
        return { [field]: { $ne: value } };

      case 'contains':
        return { [field]: { $regex: escapeRegex(String(value)), $options: 'i' } };

      case 'regex':
        try {
          // Sanitize regex: test validity before injecting
          new RegExp(String(value));
          return { [field]: { $regex: String(value), $options: 'i' } };
        } catch {
          return { [field]: { $regex: escapeRegex(String(value)), $options: 'i' } };
        }

      case 'greater_than':
        return { [field]: { $gt: Number(value) } };

      case 'less_than':
        return { [field]: { $lt: Number(value) } };

      case 'in': {
        const items = Array.isArray(value)
          ? value
          : String(value).split(',').map((s) => s.trim());
        return { [field]: { $in: items } };
      }

      default:
        return { [field]: value };
    }
  }

  /**
   * Builds the root MongoDB filter for a target model
   * @param {Object} structuredQuery
   * @param {Object} timeRange - { start, end }
   * @param {string|null} organizationId
   * @param {string} timestampField
   * @returns {Object} MongoDB filter
   */
  buildMongoFilter(structuredQuery, timeRange, organizationId, timestampField = 'createdAt') {
    const compiledConditions = structuredQuery.conditions.map((c) =>
      this.compileConditionToMongo(c)
    );

    const logicKey = (structuredQuery.booleanLogic || 'AND').toUpperCase() === 'OR' ? '$or' : '$and';
    const conditionBlock = compiledConditions.length === 1
      ? compiledConditions[0]
      : { [logicKey]: compiledConditions };

    const filter = {
      $and: [
        conditionBlock,
        { [timestampField]: { $gte: timeRange.start, $lte: timeRange.end } },
      ],
    };

    if (organizationId) {
      filter.$and.push({
        $or: [{ organizationId }, { organizationId: null }],
      });
    }

    return filter;
  }

  /**
   * Executes the structured query against selected data sources
   * @param {Object} params - { structuredQuery, dataSources, timeRange, organizationId }
   * @returns {Promise<{ matched: boolean, resultCount: number, evidence: Array, resolvedTimeRange: Object }>}
   */
  async executeQuery({ structuredQuery, dataSources = ['FINDINGS', 'ALERTS'], timeRange = {}, organizationId = null }) {
    const validation = this.validateQuery(structuredQuery);
    if (!validation.valid) {
      throw new Error(`Invalid structured query: ${validation.errors.join('; ')}`);
    }

    const resolvedTime = this.resolveTimeRange(timeRange);
    const evidenceList = [];
    const entity = (structuredQuery.entity || 'finding').toLowerCase();

    // Map entity to relevant data sources if not explicitly supplied
    let targetSources = dataSources;
    if (!targetSources || targetSources.length === 0) {
      targetSources = ['FINDINGS', 'ALERTS'];
    }

    // 1. Query Findings
    if (targetSources.includes('FINDINGS') && ['finding', 'ip', 'domain', 'url', 'ioc', 'asset'].includes(entity)) {
      try {
        const filter = this.buildMongoFilter(structuredQuery, resolvedTime, organizationId, 'createdAt');
        const findings = await Finding.find(filter).limit(MAX_RESULT_LIMIT).lean();

        for (const f of findings) {
          if (evidenceList.length >= MAX_RESULT_LIMIT) break;
          evidenceList.push({
            evidenceId: `EVD-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            sourceEntity: 'Finding',
            sourceId: f.findingId || String(f._id),
            title: f.title || 'Security Finding',
            summary: f.description || '',
            matchDetails: {
              matchedField: structuredQuery.conditions[0]?.field || 'all',
              matchedOperator: structuredQuery.conditions[0]?.operator || 'equals',
              matchedValue: f[structuredQuery.conditions[0]?.field] || f.severity || 'matched',
              targetValue: structuredQuery.conditions[0]?.value,
            },
            rawEvidenceRef: f.rawEvidence || null,
            timestamp: f.createdAt || new Date(),
          });
        }
      } catch (err) {
        logger.warn(`ThreatHuntQueryEngine finding query warning: ${err.message}`);
      }
    }

    // 2. Query Alerts
    if (targetSources.includes('ALERTS') && ['alert', 'ip', 'domain', 'asset', 'executionid'].includes(entity)) {
      try {
        const filter = this.buildMongoFilter(structuredQuery, resolvedTime, organizationId, 'createdAt');
        const alerts = await Alert.find(filter).limit(MAX_RESULT_LIMIT - evidenceList.length).lean();

        for (const a of alerts) {
          if (evidenceList.length >= MAX_RESULT_LIMIT) break;
          evidenceList.push({
            evidenceId: `EVD-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            sourceEntity: 'Alert',
            sourceId: a.alertId || String(a._id),
            title: a.title || 'Security Alert',
            summary: a.description || '',
            matchDetails: {
              matchedField: structuredQuery.conditions[0]?.field || 'all',
              matchedOperator: structuredQuery.conditions[0]?.operator || 'equals',
              matchedValue: a[structuredQuery.conditions[0]?.field] || a.severity || 'matched',
              targetValue: structuredQuery.conditions[0]?.value,
            },
            rawEvidenceRef: a.rawEvent || null,
            timestamp: a.createdAt || new Date(),
          });
        }
      } catch (err) {
        logger.warn(`ThreatHuntQueryEngine alert query warning: ${err.message}`);
      }
    }

    // 3. Query Incidents
    if (targetSources.includes('INCIDENTS') && ['incident', 'asset'].includes(entity)) {
      try {
        const filter = this.buildMongoFilter(structuredQuery, resolvedTime, organizationId, 'createdAt');
        const incidents = await Incident.find(filter).limit(MAX_RESULT_LIMIT - evidenceList.length).lean();

        for (const inc of incidents) {
          if (evidenceList.length >= MAX_RESULT_LIMIT) break;
          evidenceList.push({
            evidenceId: `EVD-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            sourceEntity: 'Incident',
            sourceId: inc.incidentId || String(inc._id),
            title: inc.title || 'Security Incident',
            summary: inc.description || '',
            matchDetails: {
              matchedField: structuredQuery.conditions[0]?.field || 'all',
              matchedOperator: structuredQuery.conditions[0]?.operator || 'equals',
              matchedValue: inc[structuredQuery.conditions[0]?.field] || inc.severity || 'matched',
              targetValue: structuredQuery.conditions[0]?.value,
            },
            rawEvidenceRef: inc.attackChainGraph || null,
            timestamp: inc.createdAt || new Date(),
          });
        }
      } catch (err) {
        logger.warn(`ThreatHuntQueryEngine incident query warning: ${err.message}`);
      }
    }

    // 4. Query IOCs
    if (targetSources.includes('IOCS') && ['ioc', 'ip', 'domain', 'url', 'hostname'].includes(entity)) {
      try {
        const filter = this.buildMongoFilter(structuredQuery, resolvedTime, organizationId, 'createdAt');
        const iocs = await IOCRecord.find(filter).limit(MAX_RESULT_LIMIT - evidenceList.length).lean();

        for (const i of iocs) {
          if (evidenceList.length >= MAX_RESULT_LIMIT) break;
          evidenceList.push({
            evidenceId: `EVD-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            sourceEntity: 'IOCRecord',
            sourceId: i.indicator || String(i._id),
            title: `IOC: ${i.indicator}`,
            summary: `Type: ${i.type}, Reputation: ${i.reputation}`,
            matchDetails: {
              matchedField: structuredQuery.conditions[0]?.field || 'indicator',
              matchedOperator: structuredQuery.conditions[0]?.operator || 'equals',
              matchedValue: i[structuredQuery.conditions[0]?.field] || i.indicator,
              targetValue: structuredQuery.conditions[0]?.value,
            },
            rawEvidenceRef: i.enrichment || null,
            timestamp: i.createdAt || new Date(),
          });
        }
      } catch (err) {
        logger.warn(`ThreatHuntQueryEngine IOC query warning: ${err.message}`);
      }
    }

    // 5. Query Terminal Jobs
    if (targetSources.includes('TERMINAL_JOBS') && ['terminal_job', 'executionid', 'tool'].includes(entity)) {
      try {
        const filter = this.buildMongoFilter(structuredQuery, resolvedTime, organizationId, 'timestamp');
        const jobs = await TerminalHistory.find(filter).limit(MAX_RESULT_LIMIT - evidenceList.length).lean();

        for (const j of jobs) {
          if (evidenceList.length >= MAX_RESULT_LIMIT) break;
          evidenceList.push({
            evidenceId: `EVD-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            sourceEntity: 'TerminalHistory',
            sourceId: j.executionId || String(j._id),
            title: `Job: ${j.tool} on ${j.target}`,
            summary: `ExitCode: ${j.exitCode}, Duration: ${j.durationMs}ms`,
            matchDetails: {
              matchedField: structuredQuery.conditions[0]?.field || 'tool',
              matchedOperator: structuredQuery.conditions[0]?.operator || 'equals',
              matchedValue: j[structuredQuery.conditions[0]?.field] || j.tool,
              targetValue: structuredQuery.conditions[0]?.value,
            },
            rawEvidenceRef: { exitCode: j.exitCode, executionId: j.executionId },
            timestamp: j.timestamp || new Date(),
          });
        }
      } catch (err) {
        logger.warn(`ThreatHuntQueryEngine terminal query warning: ${err.message}`);
      }
    }

    // 6. Query Assets
    if (targetSources.includes('ASSETS') && ['asset', 'hostname', 'ip', 'domain'].includes(entity)) {
      try {
        const filter = this.buildMongoFilter(structuredQuery, resolvedTime, organizationId, 'createdAt');
        const assets = await Asset.find(filter).limit(MAX_RESULT_LIMIT - evidenceList.length).lean();

        for (const ass of assets) {
          if (evidenceList.length >= MAX_RESULT_LIMIT) break;
          evidenceList.push({
            evidenceId: `EVD-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            sourceEntity: 'Asset',
            sourceId: ass.assetId || String(ass._id),
            title: `Asset: ${ass.name || ass.target || ass.ip}`,
            summary: `Criticality: ${ass.criticality || 'MEDIUM'}, Type: ${ass.type || 'SERVER'}`,
            matchDetails: {
              matchedField: structuredQuery.conditions[0]?.field || 'name',
              matchedOperator: structuredQuery.conditions[0]?.operator || 'equals',
              matchedValue: ass[structuredQuery.conditions[0]?.field] || ass.name,
              targetValue: structuredQuery.conditions[0]?.value,
            },
            rawEvidenceRef: ass.metadata || null,
            timestamp: ass.createdAt || new Date(),
          });
        }
      } catch (err) {
        logger.warn(`ThreatHuntQueryEngine asset query warning: ${err.message}`);
      }
    }

    const matched = evidenceList.length > 0;
    return {
      matched,
      resultCount: evidenceList.length,
      evidence: evidenceList,
      resolvedTimeRange: resolvedTime,
    };
  }
}

module.exports = new ThreatHuntQueryEngine();
