/**
 * 🛡️ CyberShield X — IntelController (Phase 71)
 *
 * REST Controller for Threat Intelligence Fusion, IOC normalization,
 * authentic provider enrichment provenance, platform matching,
 * threat actor profiles, campaigns, and MITRE ATT&CK matrices.
 */

const IOCRecord = require('../models/IOCRecord');
const ThreatActorProfile = require('../models/ThreatActorProfile');
const Campaign = require('../models/Campaign');
const DetectionRule = require('../models/DetectionRule');
const Finding = require('../models/Finding');
const ThreatHunt = require('../models/ThreatHunt');
const threatIntelFusionService = require('../services/soc/ThreatIntelFusionService');
const investigationTimelineService = require('../services/soc/InvestigationTimelineService');
const auditLogger = require('../utils/auditLogger');
const logger = require('../utils/logger');

/**
 * List/search threat intel records
 * GET /api/intel
 */
exports.listIntel = async (req, res) => {
  try {
    const { query: searchQuery, type, reputation, state, page = 1, limit = 20 } = req.query;
    const orgId = req.user?.organizationId || null;

    const filter = orgId
      ? { $or: [{ organizationId: orgId }, { organizationId: null }] }
      : {};

    if (type) filter.type = type.toLowerCase();
    if (reputation) filter.reputation = reputation.toUpperCase();
    if (state) filter.intelState = state.toUpperCase();
    if (searchQuery) {
      const regex = new RegExp(String(searchQuery).trim(), 'i');
      filter.indicator = regex;
    }

    const skip = (Math.max(1, Number(page)) - 1) * Math.min(100, Math.max(1, Number(limit)));
    const pageSize = Math.min(100, Math.max(1, Number(limit)));

    const [records, total] = await Promise.all([
      IOCRecord.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(pageSize).lean(),
      IOCRecord.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          page: Number(page),
          limit: pageSize,
          total,
          pages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (err) {
    logger.error(`listIntel error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Enrich an indicator against authentic external threat providers
 * POST /api/intel/enrich
 */
exports.enrichIndicator = async (req, res) => {
  try {
    const { indicator } = req.body;
    if (!indicator || typeof indicator !== 'string') {
      return res.status(400).json({ success: false, error: 'indicator is required' });
    }

    const orgId = req.user?.organizationId || null;
    const result = await threatIntelFusionService.enrichIndicator(indicator, orgId);

    auditLogger.logEvent({
      action: 'IOC_ENRICHMENT_REQUESTED',
      actor: req.user?.username || 'ANALYST',
      actorRole: req.user?.role || 'analyst',
      organizationId: orgId,
      details: { indicator: result.indicator, type: result.type, state: result.state },
    });

    res.json({
      success: true,
      data: result,
      message: `Enrichment completed for [${result.indicator}]. State: [${result.state}].`,
    });
  } catch (err) {
    logger.error(`enrichIndicator error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get details and provenance for a single indicator
 * GET /api/intel/:indicator
 */
exports.getIntelDetail = async (req, res) => {
  try {
    const { indicator } = req.params;
    const orgId = req.user?.organizationId || null;

    const record = await IOCRecord.findOne({
      indicator,
      ...(orgId ? { $or: [{ organizationId: orgId }, { organizationId: null }] } : {}),
    }).lean();

    if (!record) {
      // If not stored yet, run on-demand authentic enrichment
      const enriched = await threatIntelFusionService.enrichIndicator(indicator, orgId);
      return res.json({ success: true, data: enriched });
    }

    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get platform matches for an indicator
 * GET /api/intel/matches
 */
exports.getPlatformMatches = async (req, res) => {
  try {
    const { indicator } = req.query;
    if (!indicator) {
      return res.status(400).json({ success: false, error: 'indicator query param is required' });
    }

    const orgId = req.user?.organizationId || null;
    const matches = await threatIntelFusionService.findPlatformMatches(indicator, orgId);

    res.json({
      success: true,
      data: {
        indicator,
        matchCount: matches.length,
        matches,
      },
    });
  } catch (err) {
    logger.error(`getPlatformMatches error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * List Threat Actor Profiles
 * GET /api/intel/threat-actors
 */
exports.listThreatActors = async (req, res) => {
  try {
    const orgId = req.user?.organizationId || null;
    const actors = await ThreatActorProfile.find({
      $or: [{ organizationId: orgId }, { organizationId: null }],
    })
      .sort({ name: 1 })
      .lean();

    res.json({ success: true, data: actors });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Create a Threat Actor Profile
 * POST /api/intel/threat-actors
 */
exports.createThreatActor = async (req, res) => {
  try {
    const { name, aliases = [], origin = 'Unknown', motivation = 'Unknown', attributionStatus = 'REPORTED', targetedSectors = [], associatedTechniques = [], knownIOCs = [], references = [] } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Actor name is required' });
    }

    const actorId = `ACTOR-${Date.now().toString().slice(-6)}`;
    const actor = await ThreatActorProfile.create({
      actorId,
      name: name.trim(),
      aliases,
      origin,
      motivation,
      attributionStatus,
      targetedSectors,
      associatedTechniques,
      knownIOCs,
      references,
      organizationId: req.user?.organizationId || null,
    });

    res.status(201).json({ success: true, data: actor });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * List Campaigns
 * GET /api/intel/campaigns
 */
exports.listCampaigns = async (req, res) => {
  try {
    const orgId = req.user?.organizationId || null;
    const campaigns = await Campaign.find({
      $or: [{ organizationId: orgId }, { organizationId: null }],
    })
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ success: true, data: campaigns });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Create a Campaign
 * POST /api/intel/campaigns
 */
exports.createCampaign = async (req, res) => {
  try {
    const { name, description = '', threatActorId = null, threatActorName = '', status = 'ACTIVE', targetedAssets = [], associatedIOCs = [], mitreTechniques = [] } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Campaign name is required' });
    }

    const campaignId = `CAMP-${Date.now().toString().slice(-6)}`;
    const campaign = await Campaign.create({
      campaignId,
      name: name.trim(),
      description: description.trim(),
      threatActorId,
      threatActorName,
      status,
      targetedAssets,
      associatedIOCs,
      mitreTechniques,
      organizationId: req.user?.organizationId || null,
    });

    res.status(201).json({ success: true, data: campaign });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Aggregate observed MITRE ATT&CK techniques across active records
 * GET /api/intel/attack-techniques
 */
exports.listAttackTechniques = async (req, res) => {
  try {
    const orgId = req.user?.organizationId || null;
    const orgFilter = orgId ? { $or: [{ organizationId: orgId }, { organizationId: null }] } : {};

    // Collect techniques from hunts, rules, and campaigns
    const [hunts, rules, campaigns] = await Promise.all([
      ThreatHunt.find(orgFilter).select('mitreAttack huntId name').lean(),
      DetectionRule.find(orgFilter).select('mitreAttack ruleId name').lean(),
      Campaign.find(orgFilter).select('mitreTechniques campaignId name').lean(),
    ]);

    const techniqueMap = new Map();

    // From Hunts
    hunts.forEach((h) => {
      if (Array.isArray(h.mitreAttack)) {
        h.mitreAttack.forEach((m) => {
          if (!techniqueMap.has(m.techniqueId)) {
            techniqueMap.set(m.techniqueId, {
              techniqueId: m.techniqueId,
              tactic: m.tactic,
              techniqueName: m.techniqueName,
              sources: [],
            });
          }
          techniqueMap.get(m.techniqueId).sources.push({
            sourceType: 'ThreatHunt',
            sourceId: h.huntId,
            sourceName: h.name,
          });
        });
      }
    });

    // From Detection Rules
    rules.forEach((r) => {
      if (Array.isArray(r.mitreAttack)) {
        r.mitreAttack.forEach((m) => {
          if (!techniqueMap.has(m.techniqueId)) {
            techniqueMap.set(m.techniqueId, {
              techniqueId: m.techniqueId,
              tactic: m.tactic,
              techniqueName: m.techniqueName,
              sources: [],
            });
          }
          techniqueMap.get(m.techniqueId).sources.push({
            sourceType: 'DetectionRule',
            sourceId: r.ruleId,
            sourceName: r.name,
          });
        });
      }
    });

    // From Campaigns
    campaigns.forEach((c) => {
      if (Array.isArray(c.mitreTechniques)) {
        c.mitreTechniques.forEach((m) => {
          if (!techniqueMap.has(m.techniqueId)) {
            techniqueMap.set(m.techniqueId, {
              techniqueId: m.techniqueId,
              tactic: m.tactic,
              techniqueName: m.techniqueName,
              sources: [],
            });
          }
          techniqueMap.get(m.techniqueId).sources.push({
            sourceType: 'Campaign',
            sourceId: c.campaignId,
            sourceName: c.name,
          });
        });
      }
    });

    const results = Array.from(techniqueMap.values());
    res.json({
      success: true,
      data: {
        totalTechniques: results.length,
        techniques: results,
      },
    });
  } catch (err) {
    logger.error(`listAttackTechniques error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Unified Investigation Timeline
 * GET /api/intel/investigation-timeline
 */
exports.getInvestigationTimeline = async (req, res) => {
  try {
    const { incidentId, startDate, endDate, severity, entityTypes, limit } = req.query;
    const orgId = req.user?.organizationId || null;

    const timeline = await investigationTimelineService.buildTimeline({
      organizationId: orgId,
      incidentId,
      startDate,
      endDate,
      severity,
      entityTypes: entityTypes ? String(entityTypes).split(',').map((s) => s.trim()) : null,
      limit: Number(limit) || 50,
    });

    res.json({
      success: true,
      data: {
        totalEvents: timeline.length,
        timeline,
      },
    });
  } catch (err) {
    logger.error(`getInvestigationTimeline error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
};
