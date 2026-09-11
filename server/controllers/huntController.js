/**
 * 🛡️ CyberShield X — HuntController (Phase 71)
 *
 * REST Controller for Threat Hunting operations, executions, evidence promotion,
 * and canonical hunt template management.
 */

const crypto = require('crypto');
const ThreatHunt = require('../models/ThreatHunt');
const ThreatHuntExecution = require('../models/ThreatHuntExecution');
const ThreatHuntTemplate = require('../models/ThreatHuntTemplate');
const threatHuntQueryEngine = require('../services/soc/ThreatHuntQueryEngine');
const threatHuntExecutionService = require('../services/soc/ThreatHuntExecutionService');
const auditLogger = require('../utils/auditLogger');
const logger = require('../utils/logger');

/**
 * List hunts with filtering and search
 * GET /api/hunts
 */
exports.listHunts = async (req, res) => {
  try {
    const { category, status, search, page = 1, limit = 20 } = req.query;
    const orgId = req.user?.organizationId || null;

    const query = orgId
      ? { $or: [{ organizationId: orgId }, { organizationId: null }] }
      : {};

    if (category) query.category = category.toUpperCase();
    if (status) query.status = status.toUpperCase();
    if (search) {
      const regex = new RegExp(String(search).trim(), 'i');
      query.$or = [{ name: regex }, { hypothesis: regex }, { huntId: regex }];
    }

    const skip = (Math.max(1, Number(page)) - 1) * Math.min(100, Math.max(1, Number(limit)));
    const pageSize = Math.min(100, Math.max(1, Number(limit)));

    const [hunts, total] = await Promise.all([
      ThreatHunt.find(query).sort({ updatedAt: -1 }).skip(skip).limit(pageSize).lean(),
      ThreatHunt.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        hunts,
        pagination: {
          page: Number(page),
          limit: pageSize,
          total,
          pages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (err) {
    logger.error(`listHunts error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Create a new threat hunt
 * POST /api/hunts
 */
exports.createHunt = async (req, res) => {
  try {
    const {
      name,
      description = '',
      hypothesis,
      category = 'CUSTOM',
      structuredQuery,
      dataSources = ['FINDINGS', 'ALERTS'],
      timeRange = { type: 'relative', relativeWindow: '24h' },
      mitreAttack = [],
      tags = [],
    } = req.body;

    if (!name || !hypothesis || !structuredQuery) {
      return res.status(400).json({
        success: false,
        error: 'name, hypothesis, and structuredQuery are required fields',
      });
    }

    // Validate query AST
    const validation = threatHuntQueryEngine.validateQuery(structuredQuery);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: `Invalid query AST: ${validation.errors.join('; ')}`,
      });
    }

    const huntId = `HUNT-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex')}`;
    const orgId = req.user?.organizationId || null;

    const hunt = await ThreatHunt.create({
      huntId,
      name: name.trim(),
      description: description.trim(),
      hypothesis: hypothesis.trim(),
      category: category.toUpperCase(),
      structuredQuery,
      dataSources,
      timeRange,
      mitreAttack,
      tags,
      status: 'READY',
      organizationId: orgId,
      createdBy: req.user?.username || req.user?.email || 'ANALYST',
    });

    auditLogger.logEvent({
      action: 'THREAT_HUNT_CREATED',
      actor: req.user?.username || 'ANALYST',
      actorRole: req.user?.role || 'analyst',
      organizationId: orgId,
      details: { huntId, name: hunt.name, category: hunt.category },
    });

    res.status(201).json({
      success: true,
      data: hunt,
      message: `Threat Hunt [${huntId}] created successfully in READY state.`,
    });
  } catch (err) {
    logger.error(`createHunt error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get details of a single hunt
 * GET /api/hunts/:id
 */
exports.getHunt = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || null;

    const query = {
      $or: [{ huntId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    };

    if (orgId) {
      query.$and = [{ $or: [{ organizationId: orgId }, { organizationId: null }] }];
    }

    const hunt = await ThreatHunt.findOne(query).lean();
    if (!hunt) {
      return res.status(404).json({ success: false, error: 'Threat hunt not found' });
    }

    // Include recent executions
    const recentExecutions = await ThreatHuntExecution.find({ huntId: hunt.huntId })
      .sort({ startedAt: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      data: {
        ...hunt,
        recentExecutions,
      },
    });
  } catch (err) {
    logger.error(`getHunt error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Update hunt definition
 * PATCH /api/hunts/:id
 */
exports.updateHunt = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || null;

    const hunt = await ThreatHunt.findOne({
      huntId: id,
      ...(orgId ? { $or: [{ organizationId: orgId }, { organizationId: null }] } : {}),
    });

    if (!hunt) {
      return res.status(404).json({ success: false, error: 'Threat hunt not found' });
    }

    const { name, description, hypothesis, category, structuredQuery, dataSources, timeRange, mitreAttack, tags } = req.body;

    if (structuredQuery) {
      const validation = threatHuntQueryEngine.validateQuery(structuredQuery);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: `Invalid query AST: ${validation.errors.join('; ')}`,
        });
      }
      hunt.structuredQuery = structuredQuery;
    }

    if (name) hunt.name = name.trim();
    if (description !== undefined) hunt.description = description.trim();
    if (hypothesis) hunt.hypothesis = hypothesis.trim();
    if (category) hunt.category = category.toUpperCase();
    if (dataSources) hunt.dataSources = dataSources;
    if (timeRange) hunt.timeRange = timeRange;
    if (mitreAttack) hunt.mitreAttack = mitreAttack;
    if (tags) hunt.tags = tags;
    hunt.lastModifiedBy = req.user?.username || 'ANALYST';

    await hunt.save();

    auditLogger.logEvent({
      action: 'THREAT_HUNT_UPDATED',
      actor: req.user?.username || 'ANALYST',
      actorRole: req.user?.role || 'analyst',
      organizationId: orgId,
      details: { huntId: hunt.huntId },
    });

    res.json({ success: true, data: hunt });
  } catch (err) {
    logger.error(`updateHunt error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Delete a threat hunt
 * DELETE /api/hunts/:id
 */
exports.deleteHunt = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || null;

    const hunt = await ThreatHunt.findOneAndDelete({
      huntId: id,
      ...(orgId ? { organizationId: orgId } : {}),
    });

    if (!hunt) {
      return res.status(404).json({ success: false, error: 'Threat hunt not found' });
    }

    auditLogger.logEvent({
      action: 'THREAT_HUNT_DELETED',
      actor: req.user?.username || 'ANALYST',
      actorRole: req.user?.role || 'analyst',
      organizationId: orgId,
      details: { huntId: hunt.huntId, name: hunt.name },
    });

    res.json({ success: true, message: `Threat Hunt [${id}] removed successfully.` });
  } catch (err) {
    logger.error(`deleteHunt error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Validate a query AST without executing
 * POST /api/hunts/validate
 */
exports.validateQuery = async (req, res) => {
  try {
    const { structuredQuery } = req.body;
    const validation = threatHuntQueryEngine.validateQuery(structuredQuery);
    res.json({
      success: true,
      valid: validation.valid,
      errors: validation.errors,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Execute a threat hunt asynchronously
 * POST /api/hunts/:id/execute
 */
exports.executeHunt = async (req, res) => {
  try {
    const { id } = req.params;
    const io = req.app.get('io');

    const execution = await threatHuntExecutionService.triggerHuntExecution({
      huntId: id,
      user: req.user,
      organizationId: req.user?.organizationId,
      customIO: io,
    });

    res.status(202).json({
      success: true,
      data: execution,
      message: `Hunt execution started asynchronously with executionId: [${execution.executionId}]`,
    });
  } catch (err) {
    logger.error(`executeHunt error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Cancel a running hunt execution
 * POST /api/hunts/:id/cancel
 */
exports.cancelHunt = async (req, res) => {
  try {
    const { executionId } = req.body;
    if (!executionId) {
      return res.status(400).json({ success: false, error: 'executionId is required' });
    }

    const io = req.app.get('io');
    const cancelled = await threatHuntExecutionService.cancelExecution(executionId, req.user, io);

    res.json({
      success: true,
      data: cancelled,
      message: `Execution [${executionId}] cancelled successfully.`,
    });
  } catch (err) {
    logger.error(`cancelHunt error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Configure hunt schedule
 * POST /api/hunts/:id/schedule
 */
exports.scheduleHunt = async (req, res) => {
  try {
    const { id } = req.params;
    const { cronExpression = '0 0 * * *', type = 'SCHEDULED' } = req.body;

    const hunt = await ThreatHunt.findOneAndUpdate(
      { huntId: id },
      {
        $set: {
          'schedule.enabled': true,
          'schedule.cronExpression': cronExpression,
          'schedule.type': type,
          'schedule.nextRun': new Date(Date.now() + 60 * 60 * 1000), // in 1 hour
        },
      },
      { new: true }
    );

    if (!hunt) {
      return res.status(404).json({ success: false, error: 'Threat hunt not found' });
    }

    auditLogger.logEvent({
      action: 'THREAT_HUNT_SCHEDULED',
      actor: req.user?.username || 'OPERATOR',
      actorRole: req.user?.role || 'operator',
      organizationId: hunt.organizationId,
      details: { huntId: hunt.huntId, cronExpression },
    });

    res.json({
      success: true,
      data: hunt,
      message: `Hunt [${id}] scheduled successfully with expression: ${cronExpression}`,
    });
  } catch (err) {
    logger.error(`scheduleHunt error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Disable hunt schedule
 * DELETE /api/hunts/:id/schedule
 */
exports.disableSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const hunt = await ThreatHunt.findOneAndUpdate(
      { huntId: id },
      { $set: { 'schedule.enabled': false } },
      { new: true }
    );

    if (!hunt) {
      return res.status(404).json({ success: false, error: 'Threat hunt not found' });
    }

    auditLogger.logEvent({
      action: 'THREAT_HUNT_SCHEDULE_DISABLED',
      actor: req.user?.username || 'OPERATOR',
      actorRole: req.user?.role || 'operator',
      organizationId: hunt.organizationId,
      details: { huntId: hunt.huntId },
    });

    res.json({ success: true, data: hunt, message: `Schedule disabled for hunt [${id}]` });
  } catch (err) {
    logger.error(`disableSchedule error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get execution history for a hunt
 * GET /api/hunts/:id/executions
 */
exports.getExecutions = async (req, res) => {
  try {
    const { id } = req.params;
    const executions = await ThreatHuntExecution.find({ huntId: id })
      .sort({ startedAt: -1 })
      .limit(50)
      .lean();

    res.json({ success: true, data: executions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get full execution detail
 * GET /api/hunt-executions/:executionId
 */
exports.getExecutionDetail = async (req, res) => {
  try {
    const { executionId } = req.params;
    const execution = await ThreatHuntExecution.findOne({ executionId }).lean();
    if (!execution) {
      return res.status(404).json({ success: false, error: 'Execution not found' });
    }
    res.json({ success: true, data: execution });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Promote observed evidence to a Finding
 * POST /api/hunt-executions/:executionId/promote-finding
 */
exports.promoteFinding = async (req, res) => {
  try {
    const { executionId } = req.params;
    const { evidenceId, title, severity } = req.body;

    if (!evidenceId) {
      return res.status(400).json({ success: false, error: 'evidenceId is required' });
    }

    const finding = await threatHuntExecutionService.promoteEvidenceToFinding({
      executionId,
      evidenceId,
      title,
      severity,
      user: req.user,
    });

    res.status(201).json({
      success: true,
      data: finding,
      message: `Evidence promoted to Finding [${finding.findingId}] with immutable lineage.`,
    });
  } catch (err) {
    logger.error(`promoteFinding error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Promote observed evidence to an Incident
 * POST /api/hunt-executions/:executionId/promote-incident
 */
exports.promoteIncident = async (req, res) => {
  try {
    const { executionId } = req.params;
    const { evidenceId, title, severity } = req.body;

    if (!evidenceId) {
      return res.status(400).json({ success: false, error: 'evidenceId is required' });
    }

    const incident = await threatHuntExecutionService.promoteEvidenceToIncident({
      executionId,
      evidenceId,
      title,
      severity,
      user: req.user,
    });

    res.status(201).json({
      success: true,
      data: incident,
      message: `Evidence elevated to Incident [${incident.incidentId}] with attack-chain linkage.`,
    });
  } catch (err) {
    logger.error(`promoteIncident error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Draft candidate Detection Rule from verified hunt
 * POST /api/hunt-executions/:executionId/draft-detection
 */
exports.draftDetection = async (req, res) => {
  try {
    const { executionId } = req.params;
    const execution = await ThreatHuntExecution.findOne({ executionId });
    if (!execution) {
      return res.status(404).json({ success: false, error: 'Execution not found' });
    }

    const rule = await threatHuntExecutionService.draftDetectionFromHunt({
      huntId: execution.huntId,
      executionId,
      user: req.user,
    });

    res.status(201).json({
      success: true,
      data: rule,
      message: `Candidate Detection Rule [${rule.ruleId}] created in DRAFT status. Human operator approval required.`,
    });
  } catch (err) {
    logger.error(`draftDetection error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * List canonical and custom hunt templates
 * GET /api/hunts/templates
 */
exports.getTemplates = async (req, res) => {
  try {
    const orgId = req.user?.organizationId || null;
    const templates = await ThreatHuntTemplate.find({
      $or: [{ isSystemTemplate: true }, { organizationId: orgId }],
    }).lean();

    // If database has no templates yet, return canonical in-memory templates
    if (templates.length === 0) {
      const canonical = ThreatHuntTemplate.getCanonicalTemplates();
      return res.json({ success: true, data: canonical });
    }

    res.json({ success: true, data: templates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Create a new hunt from a template
 * POST /api/hunts/templates/:templateId/clone
 */
exports.createFromTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    let template = await ThreatHuntTemplate.findOne({ templateId }).lean();

    if (!template) {
      const canonical = ThreatHuntTemplate.getCanonicalTemplates();
      template = canonical.find((t) => t.templateId === templateId);
    }

    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    const huntId = `HUNT-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex')}`;
    const orgId = req.user?.organizationId || null;

    const hunt = await ThreatHunt.create({
      huntId,
      name: `${template.name} (Copy)`,
      description: template.description,
      hypothesis: template.hypothesis,
      category: template.category,
      structuredQuery: template.structuredQuery,
      dataSources: template.dataSources,
      timeRange: { type: 'relative', relativeWindow: template.defaultTimeWindow || '24h' },
      mitreAttack: template.mitreAttack || [],
      tags: ['from-template', template.category?.toLowerCase()],
      status: 'READY',
      organizationId: orgId,
      createdBy: req.user?.username || 'ANALYST',
    });

    res.status(201).json({
      success: true,
      data: hunt,
      message: `Threat Hunt created from template [${templateId}].`,
    });
  } catch (err) {
    logger.error(`createFromTemplate error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
};
