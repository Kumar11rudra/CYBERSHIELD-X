const crypto = require('crypto');
const Case = require('../models/Case');
const Finding = require('../models/Finding');
const auditLogger = require('../utils/auditLogger');
const logger = require('../utils/logger');

/**
 * Helper to compute SHA-256 hash for raw evidence
 */
const hashEvidence = (content) => {
  if (typeof content !== 'string') {
    content = JSON.stringify(content || '');
  }
  return crypto.createHash('sha256').update(content).digest('hex');
};

/**
 * List cases with filtering, pagination and RBAC isolation
 */
exports.getCases = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const { status, severity, q } = req.query;

    const filter = {};
    if (status) filter.status = status.toUpperCase();
    if (severity) filter.severity = severity.toUpperCase();
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { caseId: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }

    const total = await Case.countDocuments(filter);
    const cases = await Case.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: {
        cases,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit) || 1
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get cases:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve cases' });
  }
};

/**
 * Get case by ID
 */
exports.getCaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const caseDoc = await Case.findOne({ $or: [{ caseId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] })
      .populate('findings')
      .lean();

    if (!caseDoc) {
      return res.status(404).json({ success: false, error: `Case ${id} not found` });
    }

    res.json({ success: true, data: caseDoc });
  } catch (error) {
    logger.error(`Failed to get case ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: 'Failed to retrieve case' });
  }
};

/**
 * Create a new case
 */
exports.createCase = async (req, res) => {
  try {
    const { title, description, severity, tags, assets } = req.body;
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    const caseId = `CASE-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const user = req.user;
    const userId = user?.id || user?._id || 'system';

    const newCase = new Case({
      caseId,
      title: title.trim(),
      description: description || '',
      severity: (severity || 'MEDIUM').toUpperCase(),
      status: 'OPEN',
      tags: Array.isArray(tags) ? tags : [],
      analystId: userId,
      assets: Array.isArray(assets) ? assets : [],
      timeline: [{
        action: 'CASE_CREATED',
        performedBy: userId,
        timestamp: new Date(),
        details: 'Case opened by analyst'
      }]
    });

    await newCase.save();

    await auditLogger.log({
      actor: { id: userId, email: user?.email, role: user?.role },
      action: 'CREATE_CASE',
      resource: { type: 'CASE', id: caseId },
      outcome: 'SUCCESS',
      details: { title, severity: newCase.severity }
    });

    res.status(201).json({ success: true, data: newCase });
  } catch (error) {
    logger.error('Failed to create case:', error);
    res.status(500).json({ success: false, error: 'Failed to create case' });
  }
};

/**
 * Update case status / severity / metadata
 */
exports.updateCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, severity, status, tags, assets } = req.body;
    const user = req.user;
    const userId = user?.id || user?._id || 'system';

    const caseDoc = await Case.findOne({ $or: [{ caseId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] });
    if (!caseDoc) {
      return res.status(404).json({ success: false, error: `Case ${id} not found` });
    }

    const previousState = { status: caseDoc.status, severity: caseDoc.severity };
    const timelineEntries = [];

    if (status && status.toUpperCase() !== caseDoc.status) {
      timelineEntries.push({
        action: 'STATUS_CHANGED',
        performedBy: userId,
        timestamp: new Date(),
        details: `Status transitioned from ${caseDoc.status} to ${status.toUpperCase()}`
      });
      caseDoc.status = status.toUpperCase();
    }

    if (severity && severity.toUpperCase() !== caseDoc.severity) {
      timelineEntries.push({
        action: 'SEVERITY_CHANGED',
        performedBy: userId,
        timestamp: new Date(),
        details: `Severity changed from ${caseDoc.severity} to ${severity.toUpperCase()}`
      });
      caseDoc.severity = severity.toUpperCase();
    }

    if (title) caseDoc.title = title.trim();
    if (description !== undefined) caseDoc.description = description;
    if (Array.isArray(tags)) caseDoc.tags = tags;
    if (Array.isArray(assets)) caseDoc.assets = assets;

    timelineEntries.forEach(entry => caseDoc.timeline.push(entry));
    await caseDoc.save();

    await auditLogger.log({
      actor: { id: userId, email: user?.email, role: user?.role },
      action: 'UPDATE_CASE',
      resource: { type: 'CASE', id: caseDoc.caseId },
      outcome: 'SUCCESS',
      details: { previousState, newState: { status: caseDoc.status, severity: caseDoc.severity } }
    });

    res.json({ success: true, data: caseDoc });
  } catch (error) {
    logger.error(`Failed to update case ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: 'Failed to update case' });
  }
};

/**
 * Attach raw evidence to a case (preserves hash & raw separation)
 */
exports.addEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const { tool, executionId, rawOutput, artifactType } = req.body;

    if (!rawOutput) {
      return res.status(400).json({ success: false, error: 'Raw output content is required for evidence' });
    }

    const caseDoc = await Case.findOne({ $or: [{ caseId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] });
    if (!caseDoc) {
      return res.status(404).json({ success: false, error: `Case ${id} not found` });
    }

    const user = req.user;
    const userId = user?.id || user?._id || 'system';
    const evidenceHash = hashEvidence(rawOutput);

    const evidenceEntry = {
      evidenceId: `EVID-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
      tool: tool || 'manual_entry',
      executionId: executionId || null,
      rawOutput: typeof rawOutput === 'string' ? rawOutput : JSON.stringify(rawOutput),
      hash: evidenceHash,
      artifactType: artifactType || 'RAW_OUTPUT',
      capturedAt: new Date()
    };

    caseDoc.evidence.push(evidenceEntry);
    caseDoc.timeline.push({
      action: 'EVIDENCE_ATTACHED',
      performedBy: userId,
      timestamp: new Date(),
      details: `Evidence attached from ${evidenceEntry.tool} (SHA-256: ${evidenceHash.substring(0, 12)}...)`
    });

    await caseDoc.save();

    await auditLogger.log({
      actor: { id: userId, email: user?.email, role: user?.role },
      action: 'ATTACH_EVIDENCE',
      resource: { type: 'CASE', id: caseDoc.caseId },
      outcome: 'SUCCESS',
      details: { evidenceId: evidenceEntry.evidenceId, tool: evidenceEntry.tool, hash: evidenceHash }
    });

    res.status(201).json({ success: true, data: evidenceEntry });
  } catch (error) {
    logger.error('Failed to add evidence:', error);
    res.status(500).json({ success: false, error: 'Failed to attach evidence' });
  }
};

/**
 * Add an analyst timeline note
 */
exports.addTimelineNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    if (!note || typeof note !== 'string') {
      return res.status(400).json({ success: false, error: 'Note is required' });
    }

    const caseDoc = await Case.findOne({ $or: [{ caseId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] });
    if (!caseDoc) {
      return res.status(404).json({ success: false, error: `Case ${id} not found` });
    }

    const user = req.user;
    const userId = user?.id || user?._id || 'system';

    const timelineEntry = {
      action: 'ANALYST_NOTE',
      performedBy: userId,
      timestamp: new Date(),
      details: note.trim()
    };

    caseDoc.timeline.push(timelineEntry);
    await caseDoc.save();

    res.json({ success: true, data: caseDoc });
  } catch (error) {
    logger.error('Failed to add timeline note:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const caseOrchestrationService = require('../services/soc/CaseOrchestrationService');

/**
 * Link an incident to a case
 * POST /api/cases/:id/incidents
 */
exports.linkIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const { incidentId } = req.body;
    if (!incidentId) {
      return res.status(400).json({ success: false, error: 'incidentId is required' });
    }

    const actor = {
      id: req.user?.id || req.user?._id,
      name: req.user?.username || 'ANALYST',
      role: req.user?.role || 'ANALYST',
    };

    const updatedCase = await caseOrchestrationService.linkIncident(id, incidentId, actor, req.user?.organizationId);
    res.json({ success: true, data: updatedCase });
  } catch (error) {
    logger.error('Failed to link incident to case:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Link a threat hunt to a case
 * POST /api/cases/:id/hunts
 */
exports.linkHunt = async (req, res) => {
  try {
    const { id } = req.params;
    const { huntId } = req.body;
    if (!huntId) {
      return res.status(400).json({ success: false, error: 'huntId is required' });
    }

    const actor = {
      id: req.user?.id || req.user?._id,
      name: req.user?.username || 'ANALYST',
    };

    const updatedCase = await caseOrchestrationService.linkHunt(id, huntId, actor, req.user?.organizationId);
    res.json({ success: true, data: updatedCase });
  } catch (error) {
    logger.error('Failed to link hunt to case:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Link parent/child case relationship
 * POST /api/cases/:id/parent
 */
exports.linkParentChild = async (req, res) => {
  try {
    const { id } = req.params;
    const { parentCaseId } = req.body;
    if (!parentCaseId) {
      return res.status(400).json({ success: false, error: 'parentCaseId is required' });
    }

    const actor = {
      id: req.user?.id || req.user?._id,
      name: req.user?.username || 'ANALYST',
    };

    const result = await caseOrchestrationService.linkParentChild(parentCaseId, id, actor, req.user?.organizationId);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Failed to link parent/child cases:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Compile full case dossier from persisted DB records
 * GET /api/cases/:id/dossier
 */
exports.compileDossier = async (req, res) => {
  try {
    const { id } = req.params;
    const dossier = await caseOrchestrationService.compileDossier(id, req.user?.organizationId);
    res.json({ success: true, data: dossier });
  } catch (error) {
    logger.error(`Failed to compile dossier for case ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Reopen a closed case
 * POST /api/cases/:id/reopen
 */
exports.reopenCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, triggeringEvidence } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, error: 'Reason is required to reopen case' });
    }

    const caseDoc = await Case.findOne({ $or: [{ caseId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] });
    if (!caseDoc) {
      return res.status(404).json({ success: false, error: `Case ${id} not found` });
    }

    const user = req.user;
    const userId = user?.id || user?._id || 'system';

    caseDoc.status = 'OPEN';
    caseDoc.reopenHistory = caseDoc.reopenHistory || [];
    caseDoc.reopenHistory.push({
      reopenedAt: new Date(),
      reopenedBy: userId,
      reason,
      triggeringEvidence: triggeringEvidence || null,
    });

    caseDoc.timeline.push({
      action: 'CASE_REOPENED',
      performedBy: userId,
      timestamp: new Date(),
      details: `Case reopened: ${reason}`,
    });

    await caseDoc.save();

    res.json({ success: true, data: caseDoc });
  } catch (error) {
    logger.error('Failed to reopen case:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

