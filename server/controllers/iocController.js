/**
 * 🛡️ CyberShield X — IOCController (Phase 70)
 *
 * REST API controller for IOC Normalization, Storage, and Enrichment.
 */

const IOCRecord = require('../models/IOCRecord');
const iocNormalizationService = require('../services/soc/IOCNormalizationService');
const auditLogger = require('../utils/auditLogger');
const logger = require('../utils/logger');

class IOCController {
  /**
   * List normalized IOC records
   * GET /api/iocs
   */
  async listIocs(req, res) {
    try {
      const { type, reputation, search, asset, page = 1, limit = 50 } = req.query;
      const filter = {};

      if (req.user?.organizationId) {
        filter.$or = [{ organizationId: req.user.organizationId }, { organizationId: null }];
      }

      if (type) filter.type = type;
      if (reputation) filter.reputation = reputation;
      if (asset) filter.affectedAssets = asset;

      if (search) {
        filter.$or = [
          { indicator: { $regex: search, $options: 'i' } },
          { rawIndicator: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } },
        ];
      }

      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const total = await IOCRecord.countDocuments(filter);
      const iocs = await IOCRecord.find(filter)
        .sort({ lastSeen: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10));

      res.json({
        success: true,
        data: {
          iocs,
          pagination: {
            total,
            page: parseInt(page, 10),
            pages: Math.ceil(total / parseInt(limit, 10)),
          },
        },
      });
    } catch (err) {
      logger.error('Failed to list IOCs:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Normalize an indicator without saving
   * POST /api/iocs/normalize
   */
  async normalizeIoc(req, res) {
    try {
      const { indicator, type } = req.body;
      if (!indicator) {
        return res.status(400).json({ success: false, error: 'indicator string is required' });
      }

      const normalized = iocNormalizationService.normalize(indicator, type);
      res.json({ success: true, data: normalized });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Normalize and enrich an indicator
   * POST /api/iocs/enrich
   */
  async enrichIoc(req, res) {
    try {
      const { indicator, type } = req.body;
      if (!indicator) {
        return res.status(400).json({ success: false, error: 'indicator string is required' });
      }

      // Record first
      await iocNormalizationService.recordIndicator(indicator, {
        type,
        organizationId: req.user?.organizationId,
      });

      // Enrich via genuine providers
      const enrichment = await iocNormalizationService.enrichIndicator(indicator, type);

      await auditLogger.log({
        actor: { userId: req.user?.id, username: req.user?.username, role: req.user?.role },
        action: 'IOC_ENRICHED',
        resource: { type: 'IOC', id: enrichment.indicator },
        outcome: 'SUCCESS',
        details: { indicator: enrichment.indicator, type: enrichment.type, reputation: enrichment.reputation },
      });

      res.json({ success: true, data: enrichment });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // --- Legacy Backward Compatibility Methods ---

  async searchIOC(req, res, next) {
    try {
      const { query, target } = req.query;
      const q = query || target;
      if (!q) {
        return res.status(400).json({ error: 'Query or Target parameter is required.' });
      }
      const { getIntelligenceModule } = require('../services/intelligenceComposition');
      const mod = getIntelligenceModule();
      const ioc = await mod.iocService.searchIOC(q);
      res.json({ success: true, ioc });
    } catch (err) {
      next(err);
    }
  }

  async addIOC(req, res, next) {
    try {
      const { getIntelligenceModule } = require('../services/intelligenceComposition');
      const mod = getIntelligenceModule();
      const ioc = await mod.iocService.addIOC(req.body);
      res.status(201).json({ success: true, ioc });
    } catch (err) {
      next(err);
    }
  }

  async getRecentIOCs(req, res, next) {
    try {
      const { getIntelligenceModule } = require('../services/intelligenceComposition');
      const mod = getIntelligenceModule();
      const iocs = await mod.iocService.getRecentIOCs(parseInt(req.query.limit, 10) || 10);
      res.json({ success: true, iocs });
    } catch (err) {
      next(err);
    }
  }

  async runCorrelation(req, res, next) {
    try {
      const { target, targetType } = req.query;
      if (!target || !targetType) {
        return res.status(400).json({ error: 'Target and Target Type query parameters are required' });
      }
      const { getIntelligenceModule } = require('../services/intelligenceComposition');
      const mod = getIntelligenceModule();
      const result = await mod.correlationService.correlateTarget(target, targetType, req.user?._id || req.user?.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async triggerFeedSync(req, res, next) {
    try {
      if (req.user && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
      }
      const { getIntelligenceModule } = require('../services/intelligenceComposition');
      const mod = getIntelligenceModule();
      const result = await mod.threatFeedService.syncAllFeeds();
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getFeedStatsAndHealth(req, res, next) {
    try {
      const { getIntelligenceModule } = require('../services/intelligenceComposition');
      const mod = getIntelligenceModule();
      const stats = await mod.threatFeedService.getFeedStats();
      const health = await mod.threatFeedService.getFeedHealth();
      const recentCorrelations = await mod.correlationService.getRecentCorrelations(req.user?._id || req.user?.id);
      res.json({ success: true, stats, health, recentCorrelations });
    } catch (err) {
      next(err);
    }
  }
}

const controllerInstance = new IOCController();

// Bind methods for direct function references
controllerInstance.searchIOC = controllerInstance.searchIOC.bind(controllerInstance);
controllerInstance.addIOC = controllerInstance.addIOC.bind(controllerInstance);
controllerInstance.getRecentIOCs = controllerInstance.getRecentIOCs.bind(controllerInstance);
controllerInstance.runCorrelation = controllerInstance.runCorrelation.bind(controllerInstance);
controllerInstance.triggerFeedSync = controllerInstance.triggerFeedSync.bind(controllerInstance);
controllerInstance.getFeedStatsAndHealth = controllerInstance.getFeedStatsAndHealth.bind(controllerInstance);
controllerInstance.listIocs = controllerInstance.listIocs.bind(controllerInstance);
controllerInstance.normalizeIoc = controllerInstance.normalizeIoc.bind(controllerInstance);
controllerInstance.enrichIoc = controllerInstance.enrichIoc.bind(controllerInstance);

module.exports = controllerInstance;

