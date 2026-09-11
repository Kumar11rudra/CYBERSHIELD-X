const crypto = require('crypto');
const Finding = require('../models/Finding');
const Case = require('../models/Case');
const auditLogger = require('../utils/auditLogger');
const logger = require('../utils/logger');

/**
 * List findings with filters and pagination
 */
exports.getFindings = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const { caseId, severity, status, sourceTool, asset } = req.query;

    const filter = {};
    if (caseId) filter.caseId = caseId;
    if (severity) filter.severity = severity.toUpperCase();
    if (status) filter.status = status.toUpperCase();
    if (sourceTool) filter.sourceTool = sourceTool;
    if (asset) filter.asset = { $regex: asset, $options: 'i' };

    const total = await Finding.countDocuments(filter);
    const findings = await Finding.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: {
        findings,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit) || 1
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get findings:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve findings' });
  }
};

/**
 * Get finding by ID
 */
exports.getFindingById = async (req, res) => {
  try {
    const { id } = req.params;
    const finding = await Finding.findOne({
      $or: [{ findingId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
    }).lean();

    if (!finding) {
      return res.status(404).json({ success: false, error: `Finding ${id} not found` });
    }

    res.json({ success: true, data: finding });
  } catch (error) {
    logger.error(`Failed to get finding ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: 'Failed to retrieve finding' });
  }
};

/**
 * Create a new finding with authoritative raw evidence
 */
exports.createFinding = async (req, res) => {
  try {
    const {
      caseId,
      asset,
      sourceTool,
      executionId,
      title,
      description,
      severity,
      rawEvidence,
      analystNotes,
      aiInterpretation,
      remediation
    } = req.body;

    if (!title || !asset || !sourceTool) {
      return res.status(400).json({
        success: false,
        error: 'title, asset, and sourceTool are required fields'
      });
    }

    const findingId = `FND-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const user = req.user;
    const userId = user?.id || user?._id || 'system';

    const newFinding = new Finding({
      findingId,
      caseId: caseId || null,
      asset: asset.trim(),
      sourceTool: sourceTool.trim(),
      executionId: executionId || null,
      title: title.trim(),
      description: description || '',
      severity: (severity || 'MEDIUM').toUpperCase(),
      status: 'OPEN',
      rawEvidence: rawEvidence || {},
      analystNotes: analystNotes || '',
      aiInterpretation: aiInterpretation || '',
      remediation: remediation || ''
    });

    await newFinding.save();

    // If linked to a case, append to case findings
    if (caseId) {
      await Case.findOneAndUpdate(
        { $or: [{ caseId }, { _id: caseId.match(/^[0-9a-fA-F]{24}$/) ? caseId : null }] },
        { $addToSet: { findings: newFinding._id } }
      );
    }

    await auditLogger.log({
      actor: { id: userId, email: user?.email, role: user?.role },
      action: 'CREATE_FINDING',
      resource: { type: 'FINDING', id: findingId },
      outcome: 'SUCCESS',
      details: { title, severity: newFinding.severity, asset, sourceTool, caseId }
    });

    res.status(201).json({ success: true, data: newFinding });
  } catch (error) {
    logger.error('Failed to create finding:', error);
    res.status(500).json({ success: false, error: 'Failed to create finding' });
  }
};

/**
 * Update finding: Invariant: rawEvidence is NEVER overwritten.
 */
exports.updateFinding = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, analystNotes, aiInterpretation, remediation, severity, title, description } = req.body;
    const user = req.user;
    const userId = user?.id || user?._id || 'system';

    const finding = await Finding.findOne({
      $or: [{ findingId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
    });

    if (!finding) {
      return res.status(404).json({ success: false, error: `Finding ${id} not found` });
    }

    const previousState = { status: finding.status, severity: finding.severity };

    if (status) finding.status = status.toUpperCase();
    if (severity) finding.severity = severity.toUpperCase();
    if (title) finding.title = title.trim();
    if (description !== undefined) finding.description = description;
    if (analystNotes !== undefined) finding.analystNotes = analystNotes;
    if (aiInterpretation !== undefined) finding.aiInterpretation = aiInterpretation;
    if (remediation !== undefined) finding.remediation = remediation;

    // Notice: rawEvidence is deliberately NOT updated here to preserve authoritative observed evidence.

    await finding.save();

    await auditLogger.log({
      actor: { id: userId, email: user?.email, role: user?.role },
      action: 'UPDATE_FINDING',
      resource: { type: 'FINDING', id: finding.findingId },
      outcome: 'SUCCESS',
      details: { previousState, newState: { status: finding.status, severity: finding.severity } }
    });

    res.json({ success: true, data: finding });
  } catch (error) {
    logger.error(`Failed to update finding ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: 'Failed to update finding' });
  }
};
