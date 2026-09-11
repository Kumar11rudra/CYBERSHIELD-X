/**
 * 🛡️ CyberShield X — DetectionController (Phase 70)
 *
 * REST API controller for Detection Rules, Testing Harness, and Suppressions.
 */

const DetectionRule = require('../models/DetectionRule');
const DetectionSuppression = require('../models/DetectionSuppression');
const detectionRuleEngine = require('../services/soc/DetectionRuleEngine');
const auditLogger = require('../utils/auditLogger');
const logger = require('../utils/logger');

class DetectionController {
  /**
   * List detection rules with optional query filters and pagination
   * GET /api/detections/rules
   */
  async listRules(req, res) {
    try {
      const { search, category, severity, status, enabled, page = 1, limit = 50 } = req.query;
      const filter = {};

      if (req.user?.organizationId) {
        filter.$or = [{ organizationId: req.user.organizationId }, { organizationId: null }];
      }

      if (status) filter.status = status;
      if (category) filter.category = category;
      if (severity) filter.severity = severity;
      if (enabled !== undefined) filter.enabled = enabled === 'true';

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { ruleId: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } },
        ];
      }

      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const total = await DetectionRule.countDocuments(filter);
      const rules = await DetectionRule.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10));

      res.json({
        success: true,
        data: {
          rules,
          pagination: {
            total,
            page: parseInt(page, 10),
            pages: Math.ceil(total / parseInt(limit, 10)),
          },
        },
      });
    } catch (err) {
      logger.error('Failed to list detection rules:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Get single detection rule by ruleId
   * GET /api/detections/rules/:ruleId
   */
  async getRule(req, res) {
    try {
      const { ruleId } = req.params;
      const rule = await DetectionRule.findOne({ ruleId });
      if (!rule) {
        return res.status(404).json({ success: false, error: `Rule ${ruleId} not found` });
      }
      res.json({ success: true, data: rule });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Create a new detection rule
   * POST /api/detections/rules
   */
  async createRule(req, res) {
    try {
      const {
        ruleId,
        name,
        description,
        severity,
        category,
        status = 'ACTIVE',
        conditions = [],
        requiredEvidenceFields = [],
        affectedEntityTypes = ['finding'],
        tags = [],
        responsePolicy = {},
        isAiGenerated = false,
        aiMetadata = {},
      } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, error: 'Rule name is required' });
      }

      const autoRuleId = ruleId || `RULE-SEC-${Date.now().toString().slice(-6)}`;
      const author = req.user?.username || 'operator';

      const newRule = await DetectionRule.create({
        ruleId: autoRuleId,
        name,
        description,
        severity,
        category,
        status,
        enabled: status === 'ACTIVE',
        version: 1,
        author,
        isAiGenerated,
        aiMetadata,
        conditions,
        requiredEvidenceFields,
        affectedEntityTypes,
        tags,
        responsePolicy,
        organizationId: req.user?.organizationId || null,
      });

      await auditLogger.log({
        actor: { userId: req.user?.id, username: author, role: req.user?.role },
        action: 'RULE_CREATED',
        resource: { type: 'DETECTION_RULE', id: autoRuleId },
        outcome: 'SUCCESS',
        details: { name, severity, status },
      });

      res.status(201).json({ success: true, data: newRule });
    } catch (err) {
      logger.error('Failed to create detection rule:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Update an existing detection rule
   * PUT /api/detections/rules/:ruleId
   */
  async updateRule(req, res) {
    try {
      const { ruleId } = req.params;
      const rule = await DetectionRule.findOne({ ruleId });
      if (!rule) {
        return res.status(404).json({ success: false, error: `Rule ${ruleId} not found` });
      }

      const updatableFields = [
        'name',
        'description',
        'severity',
        'category',
        'status',
        'enabled',
        'conditions',
        'requiredEvidenceFields',
        'affectedEntityTypes',
        'tags',
        'responsePolicy',
      ];

      updatableFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          rule[field] = req.body[field];
        }
      });

      rule.version += 1;
      await rule.save();

      await auditLogger.log({
        actor: { userId: req.user?.id, username: req.user?.username, role: req.user?.role },
        action: 'RULE_UPDATED',
        resource: { type: 'DETECTION_RULE', id: ruleId },
        outcome: 'SUCCESS',
        details: { version: rule.version },
      });

      res.json({ success: true, data: rule });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Deterministic testing harness for a detection rule against a fixture event
   * POST /api/detections/rules/:ruleId/test
   */
  async testRule(req, res) {
    try {
      const { ruleId } = req.params;
      const { fixtureEvent, expectedMatch = true } = req.body;

      if (!fixtureEvent) {
        return res.status(400).json({ success: false, error: 'fixtureEvent payload is required' });
      }

      const rule = await DetectionRule.findOne({ ruleId });
      if (!rule) {
        return res.status(404).json({ success: false, error: `Rule ${ruleId} not found` });
      }

      const testResult = await detectionRuleEngine.testRule(rule, fixtureEvent, expectedMatch);
      res.json({ success: true, data: testResult });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Explicit approval of a candidate DRAFT detection rule
   * POST /api/detections/rules/:ruleId/approve
   */
  async approveRule(req, res) {
    try {
      const { ruleId } = req.params;
      const approver = {
        userId: req.user?.id || 'operator',
        username: req.user?.username || 'operator',
        role: req.user?.role || 'OPERATOR',
      };

      const updatedRule = await detectionRuleEngine.approveRule(ruleId, approver);
      res.json({ success: true, data: updatedRule });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * List suppressions
   * GET /api/detections/suppressions
   */
  async listSuppressions(req, res) {
    try {
      const { ruleId, activeOnly = 'true' } = req.query;
      const filter = {};
      if (ruleId) filter.ruleId = ruleId;
      if (activeOnly === 'true') {
        filter.active = true;
        filter.expiresAt = { $gt: new Date() };
      }

      const suppressions = await DetectionSuppression.find(filter).sort({ createdAt: -1 });
      res.json({ success: true, data: suppressions });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Create an expiring suppression
   * POST /api/detections/suppressions
   */
  async createSuppression(req, res) {
    try {
      const { ruleId, pattern, reason, expiresAt, scope } = req.body;

      const actor = {
        userId: req.user?.id || 'operator',
        username: req.user?.username || 'operator',
        role: req.user?.role || 'OPERATOR',
      };

      const suppression = await detectionRuleEngine.createSuppression({
        ruleId,
        pattern,
        reason,
        actor,
        expiresAt,
        organizationId: req.user?.organizationId || null,
      });

      res.status(201).json({ success: true, data: suppression });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Evaluate a live event or finding payload against active rules
   * POST /api/detections/evaluate
   */
  async evaluateEvent(req, res) {
    try {
      const { event } = req.body;
      if (!event) {
        return res.status(400).json({ success: false, error: 'Event payload is required' });
      }

      const matches = await detectionRuleEngine.evaluateEvent(event, {
        organizationId: req.user?.organizationId,
      });

      res.json({
        success: true,
        data: {
          matchedCount: matches.length,
          detections: matches,
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
  /**
   * List revisions for a detection rule
   * GET /api/detections/:ruleId/versions
   */
  async listVersions(req, res) {
    try {
      const { ruleId } = req.params;
      const DetectionRuleRevision = require('../models/DetectionRuleRevision');
      const revisions = await DetectionRuleRevision.find({
        $or: [{ ruleId }, { contentId: ruleId }],
      }).sort({ revision: -1 });
      res.json({ success: true, data: revisions });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Create a new revision / tune an existing rule
   * POST /api/detections/:ruleId/versions
   */
  async createRevision(req, res) {
    try {
      const { ruleId } = req.params;
      const { updates, changeReason } = req.body;
      const detectionLifecycleService = require('../services/soc/DetectionLifecycleService');

      const actor = {
        userId: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
      };

      const result = await detectionLifecycleService.createRevision(ruleId, updates || req.body, {
        actor,
        changeReason: changeReason || req.body.changeReason,
        organizationId: req.user?.organizationId,
      });

      res.status(201).json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Rollback a rule to a previous approved revision
   * POST /api/detections/:ruleId/rollback
   */
  async rollbackRule(req, res) {
    try {
      const { ruleId } = req.params;
      const { targetRevision, reason } = req.body;
      if (!targetRevision) {
        return res.status(400).json({ success: false, error: 'targetRevision is required' });
      }

      const detectionLifecycleService = require('../services/soc/DetectionLifecycleService');
      const actor = {
        userId: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
      };

      const rolledBack = await detectionLifecycleService.rollbackRule(ruleId, targetRevision, {
        actor,
        reason,
        organizationId: req.user?.organizationId,
      });

      res.json({ success: true, data: rolledBack });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Operator human review workflow (APPROVE, REJECT, REQUEST_CHANGES)
   * POST /api/detections/:ruleId/review
   */
  async reviewRule(req, res) {
    try {
      const { ruleId } = req.params;
      const { decision, decisionReason, risk } = req.body;
      const detectionLifecycleService = require('../services/soc/DetectionLifecycleService');

      const actor = {
        userId: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
      };

      const updatedRule = await detectionLifecycleService.reviewRule(ruleId, {
        decision,
        decisionReason,
        risk,
        actor,
        organizationId: req.user?.organizationId,
      });

      res.json({ success: true, data: updatedRule });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Activate an approved rule
   * POST /api/detections/:ruleId/activate
   */
  async activateRule(req, res) {
    try {
      const { ruleId } = req.params;
      const detectionLifecycleService = require('../services/soc/DetectionLifecycleService');
      const actor = {
        userId: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
      };

      const activated = await detectionLifecycleService.activateRule(ruleId, {
        actor,
        organizationId: req.user?.organizationId,
      });

      res.json({ success: true, data: activated });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Disable an active rule
   * POST /api/detections/:ruleId/disable
   */
  async disableRule(req, res) {
    try {
      const { ruleId } = req.params;
      const { reason } = req.body;
      const detectionLifecycleService = require('../services/soc/DetectionLifecycleService');
      const actor = {
        userId: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
      };

      const disabled = await detectionLifecycleService.disableRule(ruleId, {
        actor,
        reason,
        organizationId: req.user?.organizationId,
      });

      res.json({ success: true, data: disabled });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Add a test fixture to a rule
   * POST /api/detections/:ruleId/fixtures
   */
  async addFixture(req, res) {
    try {
      const { ruleId } = req.params;
      const { name, input, expectedResult } = req.body;

      if (!input || !expectedResult) {
        return res.status(400).json({ success: false, error: 'input and expectedResult are required' });
      }

      const rule = await DetectionRule.findOne({ $or: [{ ruleId }, { contentId: ruleId }] });
      if (!rule) {
        return res.status(404).json({ success: false, error: `Rule ${ruleId} not found` });
      }

      const fixtureId = `FIX-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      rule.testFixtures = rule.testFixtures || [];
      rule.testFixtures.push({
        fixtureId,
        name: name || 'Custom Fixture',
        input,
        expectedResult,
        lastResult: 'NOT_RUN',
      });

      rule.healthStatus = 'NEEDS_TEST';
      await rule.save();

      res.status(201).json({ success: true, data: rule.testFixtures[rule.testFixtures.length - 1] });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Run rule test fixtures (single event or full fixture set)
   * POST /api/detections/:ruleId/test
   */
  async runRuleTests(req, res) {
    try {
      const { ruleId } = req.params;
      const { fixtureEvent, expectedMatch } = req.body;

      // If a single fixture event is posted, run isolated test
      if (fixtureEvent) {
        const rule = await DetectionRule.findOne({ $or: [{ ruleId }, { contentId: ruleId }] });
        if (!rule) {
          return res.status(404).json({ success: false, error: `Rule ${ruleId} not found` });
        }
        const testResult = await detectionRuleEngine.testRule(rule, fixtureEvent, expectedMatch !== undefined ? expectedMatch : true);
        return res.json({ success: true, data: testResult });
      }

      // Otherwise run all registered fixtures
      const detectionTestingService = require('../services/soc/DetectionTestingService');
      const actor = {
        userId: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
      };

      const result = await detectionTestingService.testRuleFixtures(ruleId, {
        actor,
        organizationId: req.user?.organizationId,
      });

      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Run full regression test suite
   * POST /api/detection-tests
   */
  async runRegressionSuite(req, res) {
    try {
      const detectionTestingService = require('../services/soc/DetectionTestingService');
      const result = await detectionTestingService.runRegressionSuite({
        organizationId: req.user?.organizationId,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Get detection quality metrics & health
   * GET /api/detection-health
   */
  async getHealthMetrics(req, res) {
    try {
      const detectionTestingService = require('../services/soc/DetectionTestingService');
      const metrics = await detectionTestingService.getQualityMetrics({
        organizationId: req.user?.organizationId,
      });
      res.json({ success: true, data: metrics });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Get MITRE ATT&CK coverage matrix
   * GET /api/detection-coverage or GET /api/attack-coverage
   */
  async getCoverage(req, res) {
    try {
      const detectionCoverageService = require('../services/soc/DetectionCoverageService');
      const coverage = await detectionCoverageService.getCoverageMatrix({
        organizationId: req.user?.organizationId,
      });
      res.json({ success: true, data: coverage });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * List or scan detection gaps
   * GET /api/detection-gaps
   */
  async listGaps(req, res) {
    try {
      const DetectionGap = require('../models/DetectionGap');
      const query = {};
      if (req.user?.organizationId) {
        query.$or = [{ organizationId: req.user.organizationId }, { organizationId: null }];
      }
      const gaps = await DetectionGap.find(query).sort({ severity: 1, createdAt: -1 });
      res.json({ success: true, data: gaps });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Trigger gap discovery scan
   * POST /api/detection-gaps/scan
   */
  async scanGaps(req, res) {
    try {
      const detectionGapService = require('../services/soc/DetectionGapService');
      const actor = {
        userId: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
      };
      const gaps = await detectionGapService.scanForGaps({
        organizationId: req.user?.organizationId,
        actor,
      });
      res.json({ success: true, data: gaps });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Promote a gap into a candidate rule draft
   * POST /api/detection-gaps/:gapId/promote
   */
  async promoteGap(req, res) {
    try {
      const { gapId } = req.params;
      const detectionGapService = require('../services/soc/DetectionGapService');
      const actor = {
        userId: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
      };

      const candidateRule = await detectionGapService.createCandidateRuleFromGap(gapId, {
        actor,
        organizationId: req.user?.organizationId,
      });

      res.status(201).json({ success: true, data: candidateRule });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * List content packs
   * GET /api/detection-packs
   */
  async listPacks(req, res) {
    try {
      const DetectionContentPack = require('../models/DetectionContentPack');
      const contentPackService = require('../services/soc/ContentPackService');
      await contentPackService.seedCanonicalPacks(req.user?.organizationId);

      const query = {};
      if (req.user?.organizationId) {
        query.$or = [{ organizationId: req.user.organizationId }, { organizationId: null }];
      }
      const packs = await DetectionContentPack.find(query).sort({ category: 1, name: 1 });
      res.json({ success: true, data: packs });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Import a content pack safely
   * POST /api/detection-packs/import
   */
  async importPack(req, res) {
    try {
      const contentPackService = require('../services/soc/ContentPackService');
      const actor = {
        userId: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
      };

      const pack = await contentPackService.importPack(req.body, {
        actor,
        organizationId: req.user?.organizationId,
      });

      res.status(201).json({ success: true, data: pack });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Validate a content pack
   * POST /api/detection-packs/:packId/validate
   */
  async validatePack(req, res) {
    try {
      const { packId } = req.params;
      const contentPackService = require('../services/soc/ContentPackService');
      const result = await contentPackService.validatePack(packId, {
        organizationId: req.user?.organizationId,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Test a content pack
   * POST /api/detection-packs/:packId/test
   */
  async testPack(req, res) {
    try {
      const { packId } = req.params;
      const contentPackService = require('../services/soc/ContentPackService');
      const actor = {
        userId: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
      };
      const result = await contentPackService.testPack(packId, {
        actor,
        organizationId: req.user?.organizationId,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Activate a content pack
   * POST /api/detection-packs/:packId/activate
   */
  async activatePack(req, res) {
    try {
      const { packId } = req.params;
      const contentPackService = require('../services/soc/ContentPackService');
      const actor = {
        userId: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
      };
      const result = await contentPackService.activatePack(packId, {
        actor,
        organizationId: req.user?.organizationId,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
}

module.exports = new DetectionController();

