/**
 * 🛡️ CyberShield X — Compliance Evidence Controller (Phase 74)
 *
 * REST APIs for Compliance Controls, Automated Evidence Evaluation,
 * Evidence Packages, and Audit Integrity Verification.
 */

const ComplianceEvidenceService = require('../services/soc/ComplianceEvidenceService');
const ComplianceControl = require('../models/ComplianceControl');
const ComplianceEvidence = require('../models/ComplianceEvidence');
const logger = require('../utils/logger');

/**
 * GET /api/compliance/controls
 * Lists compliance controls with evidence status and domain grouping.
 */
exports.listControls = async (req, res) => {
  try {
    const { domain, status } = req.query;
    const orgId = req.user?.organizationId || null;

    // First auto-seed canonical controls if empty
    await ComplianceEvidenceService.seedCanonicalControls();

    const filter = {};
    if (domain) {
      filter.domain = domain.toUpperCase();
    }
    if (status) {
      filter.status = status.toUpperCase();
    }

    const controls = await ComplianceControl.find(filter).sort({ controlId: 1 }).lean();

    res.json({
      success: true,
      data: {
        controls,
        total: controls.length,
      },
    });
  } catch (error) {
    logger.error('Failed to list compliance controls:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/compliance/controls/seed
 * Explicitly seeds canonical 9 controls.
 */
exports.seedControls = async (req, res) => {
  try {
    const controls = await ComplianceEvidenceService.seedCanonicalControls();
    res.json({
      success: true,
      message: `Canonical controls initialized (${controls.length} controls)`,
      data: controls,
    });
  } catch (error) {
    logger.error('Failed to seed compliance controls:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/compliance/controls/:controlId/evaluate
 * Evaluates real evidence for a specific control.
 */
exports.evaluateControl = async (req, res) => {
  try {
    const { controlId } = req.params;
    const orgId = req.user?.organizationId || null;

    const result = await ComplianceEvidenceService.evaluateControlEvidence(controlId, orgId);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error(`Failed to evaluate control ${req.params.controlId}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/compliance/evaluate-all
 * Evaluates real evidence for all compliance controls.
 */
exports.evaluateAllControls = async (req, res) => {
  try {
    const orgId = req.user?.organizationId || null;
    const results = await ComplianceEvidenceService.evaluateAllControls(orgId);
    res.json({
      success: true,
      message: `Evaluated ${results.length} controls against persisted evidence`,
      data: results,
    });
  } catch (error) {
    logger.error('Failed to evaluate all controls:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/compliance/evidence-packages
 * Lists generated immutable compliance evidence packages.
 */
exports.listEvidencePackages = async (req, res) => {
  try {
    const { controlId } = req.query;
    const orgId = req.user?.organizationId || null;

    const filter = {};
    if (orgId) {
      filter.$or = [{ organizationId: orgId }, { organizationId: null }];
    }
    if (controlId) {
      filter.controlId = controlId;
    }

    const packages = await ComplianceEvidence.find(filter)
      .sort({ generatedAt: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        packages,
        total: packages.length,
      },
    });
  } catch (error) {
    logger.error('Failed to list evidence packages:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/compliance/evidence-packages
 * Generates an immutable evidence package for a control.
 */
exports.createEvidencePackage = async (req, res) => {
  try {
    const { controlId, scopePeriod } = req.body;
    if (!controlId) {
      return res.status(400).json({ success: false, error: 'controlId is required' });
    }

    const pkg = await ComplianceEvidenceService.generateEvidencePackage(
      controlId,
      {
        scopePeriod,
        requestedBy: req.user?.username || req.user?.email || 'auditor',
      },
      req.user
    );

    res.status(201).json({
      success: true,
      message: `Evidence package ${pkg.packageId} generated`,
      data: pkg,
    });
  } catch (error) {
    logger.error('Failed to generate evidence package:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/compliance/evidence-packages/:packageId
 * Fetches single evidence package with hash verification.
 */
exports.getEvidencePackage = async (req, res) => {
  try {
    const { packageId } = req.params;
    const orgId = req.user?.organizationId || null;

    const filter = { packageId };
    if (orgId) {
      filter.$or = [{ organizationId: orgId }, { organizationId: null }];
    }

    const pkg = await ComplianceEvidence.findOne(filter).lean();
    if (!pkg) {
      return res.status(404).json({ success: false, error: `Evidence package ${packageId} not found` });
    }

    // Verify SHA-256 integrity hash
    const crypto = require('crypto');
    const computedHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(pkg.evidenceRecords))
      .digest('hex');

    const isHashValid = computedHash === pkg.packageHash;

    res.json({
      success: true,
      data: {
        ...pkg,
        verification: {
          isHashValid,
          computedHash,
          storedHash: pkg.packageHash,
          verifiedAt: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    logger.error(`Failed to get evidence package ${req.params.packageId}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
};
