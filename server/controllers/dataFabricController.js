const SecurityGraphService = require('../services/datafabric/SecurityGraphService');
const CorrelationService = require('../services/datafabric/CorrelationService');
const InvestigationQueryService = require('../services/datafabric/InvestigationQueryService');
const SecurityGraphNode = require('../models/SecurityGraphNode');
const SecurityGraphEdge = require('../models/SecurityGraphEdge');
const InvestigationGraphSnapshot = require('../models/InvestigationGraphSnapshot');
const CorrelationRule = require('../models/CorrelationRule');
const CorrelationResult = require('../models/CorrelationResult');

class DataFabricController {
  // --- GRAPH QUERIES ---
  static async syncGraph(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const result = await SecurityGraphService.syncPlatformEntitiesToGraph(orgId);
      return res.json({ success: true, result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getNeighborhood(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { entityType, entityId, maxDepth, maxNodes, maxEdges } = req.query;

      if (!entityType || !entityId) {
        return res.status(400).json({ success: false, error: 'entityType and entityId parameters are required' });
      }

      const result = await InvestigationQueryService.queryNeighborhood({
        entityType,
        entityId,
        organizationId: orgId,
        maxDepth: Number(maxDepth) || 2,
        maxNodes: Number(maxNodes) || 100,
        maxEdges: Number(maxEdges) || 250
      });

      return res.json({ success: true, ...result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async findPath(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { fromType, fromId, toType, toId } = req.query;

      if (!fromType || !fromId || !toType || !toId) {
        return res.status(400).json({ success: false, error: 'fromType, fromId, toType, and toId parameters are required' });
      }

      const result = await InvestigationQueryService.findShortestPath(fromType, fromId, toType, toId, orgId);
      return res.json({ success: true, result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // --- CORRELATION RULES & RESULTS ---
  static async listCorrelationRules(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const query = orgId ? { organizationId: orgId } : {};
      const rules = await CorrelationRule.find(query).sort({ createdAt: -1 }).lean();
      return res.json({ success: true, count: rules.length, rules });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createCorrelationRule(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const rule = await CorrelationService.createRule(req.body, req.user, orgId);
      return res.status(201).json({ success: true, rule });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async activateCorrelationRule(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { ruleId } = req.params;
      const rule = await CorrelationService.activateRule(ruleId, orgId);
      return res.json({ success: true, rule });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async executeCorrelationRule(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { ruleId } = req.params;
      const result = await CorrelationService.executeCorrelationRule(ruleId, orgId);
      return res.json({ success: true, result });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async listCorrelationResults(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const query = orgId ? { organizationId: orgId } : {};
      const results = await CorrelationResult.find(query).sort({ createdAt: -1 }).limit(100).lean();
      return res.json({ success: true, count: results.length, results });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // --- TIMELINE ---
  static async getTimeline(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const timeline = await InvestigationQueryService.queryUnifiedTimeline(orgId);
      return res.json({ success: true, ...timeline });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // --- SNAPSHOTS & INTEGRITY ---
  static async createSnapshot(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { rootEntityType, rootEntityId, queryDefinition } = req.body;
      const snapshot = await InvestigationQueryService.createSnapshot({
        rootEntityType,
        rootEntityId,
        queryDefinition,
        user: req.user,
        organizationId: orgId
      });
      return res.status(201).json({ success: true, snapshot });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async getSnapshot(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { snapshotId } = req.params;
      const query = { snapshotId };
      if (orgId) query.organizationId = orgId;

      const snapshot = await InvestigationGraphSnapshot.findOne(query).lean();
      if (!snapshot) return res.status(404).json({ success: false, error: 'Snapshot not found' });

      return res.json({ success: true, snapshot });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async verifySnapshot(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { snapshotId } = req.params;
      const result = await InvestigationQueryService.verifySnapshotIntegrity(snapshotId, orgId);
      return res.json({ success: true, result });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async getGraphIntegrity(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const report = await InvestigationQueryService.checkGraphIntegrity(orgId);
      return res.json({ success: true, report });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = DataFabricController;
