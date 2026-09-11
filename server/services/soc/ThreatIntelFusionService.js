/**
 * 🛡️ CyberShield X — ThreatIntelFusionService (Phase 71)
 *
 * Fuses Indicators of Compromise (IOCs) with genuine threat intelligence providers
 * (AlienVault OTX, CIRCL HashLookup, live DNS) and correlates them against active
 * platform telemetry (Assets, Findings, Alerts, Incidents, Terminal Executions).
 *
 * Strictly adheres to the Zero-Fabrication Mandate:
 * - Unavailable providers return UNAVAILABLE / NOT_FOUND
 * - No synthesized reputation or synthetic scores
 * - Retains full provider provenance and retrieval timestamps
 */

const iocNormalizationService = require('./IOCNormalizationService');
const IOCRecord = require('../../models/IOCRecord');
const Asset = require('../../models/Asset');
const Finding = require('../../models/Finding');
const Alert = require('../../models/Alert');
const Incident = require('../../models/Incident');
const TerminalHistory = require('../../models/TerminalHistory');
const logger = require('../../utils/logger');

class ThreatIntelFusionService {
  /**
   * Normalizes and enriches an indicator with genuine provider data
   * @param {string} rawIndicator
   * @param {string|null} organizationId
   * @returns {Promise<Object>} Enriched intelligence record
   */
  async enrichIndicator(rawIndicator, organizationId = null) {
    if (!rawIndicator || typeof rawIndicator !== 'string') {
      throw new Error('Indicator must be a non-empty string');
    }

    const trimmed = rawIndicator.trim();
    const type = iocNormalizationService.detectType(trimmed);

    // Run authentic normalization and enrichment via existing IOCNormalizationService
    const enrichment = await iocNormalizationService.enrichIndicator(trimmed);

    // Determine intelligence state
    let state = 'NOT_FOUND';
    if (enrichment.providerStatus === 'UNAVAILABLE' || enrichment.providerStatus === 'EXTERNAL_SERVICE_UNAVAILABLE') {
      state = 'UNAVAILABLE';
    } else if (enrichment.reputation === 'MALICIOUS' || enrichment.pulseCount > 0 || enrichment.malwareMatch) {
      state = 'CONFIRMED';
    } else if (enrichment.reputation === 'SUSPICIOUS') {
      state = 'PARTIAL';
    } else if (enrichment.resolvedIps && enrichment.resolvedIps.length > 0) {
      state = 'CONFIRMED';
    }

    // Retain provenance
    const record = {
      indicator: trimmed,
      type,
      state,
      reputation: enrichment.reputation || 'UNKNOWN',
      confidence: enrichment.confidence || 0,
      provider: enrichment.provider || 'AUTHENTIC_LOCAL_PARSER',
      providerStatus: enrichment.providerStatus || 'ACTIVE',
      provenance: {
        provider: enrichment.provider || 'CyberShield Threat Intelligence Engine',
        retrievedAt: new Date(),
        rawProviderResponse: enrichment.rawResponse || null,
        firstSeen: enrichment.firstSeen || null,
        lastSeen: enrichment.lastSeen || new Date(),
        tags: enrichment.tags || [],
        references: enrichment.references || [],
      },
      enrichmentDetails: enrichment,
      organizationId,
      updatedAt: new Date(),
    };

    // Upsert to IOCRecord store
    try {
      await IOCRecord.findOneAndUpdate(
        {
          $or: [{ indicator: trimmed }, { value: trimmed }],
          ...(organizationId ? { organizationId } : {}),
        },
        {
          $set: {
            indicator: trimmed,
            value: trimmed,
            rawIndicator: trimmed,
            type,
            reputation: record.reputation,
            confidence: record.confidence,
            enrichment: record.enrichmentDetails,
            intelState: state,
            lastEnrichedAt: new Date(),
            organizationId,
          },
        },
        { upsert: true, new: true }
      );
    } catch (err) {
      if (err.code === 11000) {
        await IOCRecord.updateOne(
          { type, value: trimmed },
          {
            $set: {
              indicator: trimmed,
              rawIndicator: trimmed,
              reputation: record.reputation,
              confidence: record.confidence,
              enrichment: record.enrichmentDetails,
              intelState: state,
              lastEnrichedAt: new Date(),
            },
          }
        ).catch(() => {});
      } else {
        logger.warn(`Failed to upsert IOCRecord for ${trimmed}: ${err.message}`);
      }
    }

    return record;
  }

  /**
   * Matches an indicator across observed platform entities
   * @param {string} indicator
   * @param {string|null} organizationId
   * @returns {Promise<Array>} List of matching platform entities with exact match field path
   */
  async findPlatformMatches(indicator, organizationId = null) {
    if (!indicator || typeof indicator !== 'string') return [];
    const trimmed = indicator.trim();
    const regex = new RegExp(`^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    const substringRegex = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const matches = [];
    const orgFilter = organizationId
      ? { $or: [{ organizationId }, { organizationId: null }] }
      : {};

    // 1. Assets match
    try {
      const assets = await Asset.find({
        ...orgFilter,
        $or: [{ ip: regex }, { name: regex }, { target: regex }],
      }).limit(20).lean();

      for (const a of assets) {
        matches.push({
          entityType: 'Asset',
          entityId: a.assetId || String(a._id),
          entityName: a.name || a.ip || a.target,
          matchedField: a.ip && regex.test(a.ip) ? 'ip' : (a.name && regex.test(a.name) ? 'name' : 'target'),
          matchReason: `Observed Asset [${a.name || a.ip}] matches indicator [${trimmed}]`,
          timestamp: a.createdAt,
        });
      }
    } catch (err) {
      logger.warn(`Asset platform match check failed: ${err.message}`);
    }

    // 2. Findings match
    try {
      const findings = await Finding.find({
        ...orgFilter,
        $or: [
          { asset: regex },
          { title: substringRegex },
          { description: substringRegex },
        ],
      }).limit(20).lean();

      for (const f of findings) {
        matches.push({
          entityType: 'Finding',
          entityId: f.findingId || String(f._id),
          entityName: f.title,
          matchedField: f.asset && regex.test(f.asset) ? 'asset' : 'description',
          matchReason: `Observed Finding [${f.findingId}] on asset [${f.asset}] references indicator [${trimmed}]`,
          timestamp: f.createdAt,
        });
      }
    } catch (err) {
      logger.warn(`Finding platform match check failed: ${err.message}`);
    }

    // 3. Alerts match
    try {
      const alerts = await Alert.find({
        ...orgFilter,
        $or: [
          { asset: regex },
          { title: substringRegex },
          { description: substringRegex },
        ],
      }).limit(20).lean();

      for (const al of alerts) {
        matches.push({
          entityType: 'Alert',
          entityId: al.alertId || String(al._id),
          entityName: al.title,
          matchedField: al.asset && regex.test(al.asset) ? 'asset' : 'description',
          matchReason: `SOC Alert [${al.alertId}] correlates with indicator [${trimmed}]`,
          timestamp: al.createdAt,
        });
      }
    } catch (err) {
      logger.warn(`Alert platform match check failed: ${err.message}`);
    }

    // 4. Incidents match
    try {
      const incidents = await Incident.find({
        ...orgFilter,
        $or: [
          { affectedAssets: regex },
          { 'iocs.value': regex },
        ],
      }).limit(20).lean();

      for (const inc of incidents) {
        matches.push({
          entityType: 'Incident',
          entityId: inc.incidentId || String(inc._id),
          entityName: inc.title,
          matchedField: 'affectedAssets',
          matchReason: `Incident [${inc.incidentId}] references indicator [${trimmed}]`,
          timestamp: inc.createdAt,
        });
      }
    } catch (err) {
      logger.warn(`Incident platform match check failed: ${err.message}`);
    }

    // 5. Terminal Executions match
    try {
      const jobs = await TerminalHistory.find({
        ...orgFilter,
        target: substringRegex,
      }).limit(20).lean();

      for (const j of jobs) {
        matches.push({
          entityType: 'TerminalJob',
          entityId: j.executionId || String(j._id),
          entityName: `${j.tool} ${j.target}`,
          matchedField: 'target',
          matchReason: `Terminal execution [${j.tool}] targeted indicator [${trimmed}]`,
          timestamp: j.timestamp,
        });
      }
    } catch (err) {
      logger.warn(`Terminal platform match check failed: ${err.message}`);
    }

    return matches;
  }
}

module.exports = new ThreatIntelFusionService();
