/**
 * 🛡️ CyberShield X — Enterprise Governance Controller (Phase 75)
 *
 * Exposes multi-tenant REST APIs for:
 * 1. Policy Administration & Versioned Revision Lifecycle (DRAFT -> REVIEW -> APPROVED -> ACTIVE)
 * 2. Stale-Approval Cryptographic Verification
 * 3. Data Retention Lifecycle, Non-mutating Dry Run, and Bounded Destructive Operations
 * 4. Legal Hold Application and Mutation Guarding
 * 5. Break-Glass Privileged Emergency Access Management
 * 6. Integration Credential Governance Metadata (Zero Raw Secrets)
 * 7. Truthful Governance Posture & Gap Evaluation
 */

const crypto = require('crypto');
const GovernancePolicyService = require('../services/soc/GovernancePolicyService');
const DataLifecycleService = require('../services/soc/DataLifecycleService');
const GovernanceEvaluationService = require('../services/soc/GovernanceEvaluationService');
const BreakGlassService = require('../services/soc/BreakGlassService');
const IntegrationCredentialMetadata = require('../models/IntegrationCredentialMetadata');
const logger = require('../utils/logger');

/**
 * Helper to resolve tenant organization ID with strict boundary check
 */
function resolveOrgId(req) {
  return (
    req.user?.organizationId ||
    req.headers['x-organization-id'] ||
    req.query.organizationId ||
    req.body.organizationId ||
    null
  );
}

function getIO(req) {
  if (req.app && typeof req.app.get === 'function') {
    return req.app.get('io');
  }
  return null;
}

// ==========================================
// 1. POLICY ADMINISTRATION CONTROLLERS
// ==========================================

/**
 * GET /api/governance/policies
 * Lists policies for an organization
 */
exports.listPolicies = async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }

    const { status, policyType, enforcementMode } = req.query;
    const policies = await GovernancePolicyService.listPolicies(orgId, {
      status,
      policyType,
      enforcementMode,
    });

    res.json({ success: true, count: policies.length, data: policies });
  } catch (error) {
    logger.error('listPolicies error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/governance/policies/:policyId
 * Retrieves policy detail
 */
exports.getPolicy = async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }

    const policy = await GovernancePolicyService.getPolicy(orgId, req.params.policyId);
    res.json({ success: true, data: policy });
  } catch (error) {
    logger.error('getPolicy error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * POST /api/governance/policies
 * Creates a new policy draft (Analyst / Operator / Admin)
 */
exports.createPolicy = async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }

    const { policyType, name, description, configuration, enforcementMode } = req.body;
    const policy = await GovernancePolicyService.createPolicy({
      organizationId: orgId,
      policyType,
      name,
      description,
      configuration,
      enforcementMode,
      user: req.user,
      customIO: getIO(req),
    });

    res.status(201).json({
      success: true,
      message: `Policy ${policy.policyId} created in DRAFT status`,
      data: policy,
    });
  } catch (error) {
    logger.error('createPolicy error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * PUT /api/governance/policies/:policyId
 * Updates draft or creates new revision if modified
 */
exports.updatePolicy = async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }

    const { name, description, configuration, enforcementMode, changeSummary } = req.body;
    const policy = await GovernancePolicyService.updatePolicyDraft({
      organizationId: orgId,
      policyId: req.params.policyId,
      configuration,
      name,
      description,
      enforcementMode,
      changeSummary,
      user: req.user,
    });

    res.json({
      success: true,
      message: `Policy ${policy.policyId} updated (v${policy.currentVersion}, status: ${policy.status})`,
      data: policy,
    });
  } catch (error) {
    logger.error('updatePolicy error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/governance/policies/:policyId/review
 * Submits draft policy for administrative review
 */
exports.submitForReview = async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }

    const policy = await GovernancePolicyService.submitForReview({
      organizationId: orgId,
      policyId: req.params.policyId,
      user: req.user,
    });

    res.json({
      success: true,
      message: `Policy ${policy.policyId} submitted for review`,
      data: policy,
    });
  } catch (error) {
    logger.error('submitForReview error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/governance/policies/:policyId/approve
 * Approves a policy in REVIEW status (ADMIN only)
 */
exports.approvePolicy = async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }

    const policy = await GovernancePolicyService.approvePolicy({
      organizationId: orgId,
      policyId: req.params.policyId,
      user: req.user,
      customIO: getIO(req),
    });

    res.json({
      success: true,
      message: `Policy ${policy.policyId} approved with revision hash ${policy.approvedRevisionHash}`,
      data: policy,
    });
  } catch (error) {
    logger.error('approvePolicy error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/governance/policies/:policyId/activate
 * Activates policy with strict stale-approval verification (ADMIN only)
 */
exports.activatePolicy = async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }

    const policy = await GovernancePolicyService.activatePolicy({
      organizationId: orgId,
      policyId: req.params.policyId,
      user: req.user,
      customIO: getIO(req),
    });

    res.json({
      success: true,
      message: `Policy ${policy.policyId} (v${policy.currentVersion}) activated successfully`,
      data: policy,
    });
  } catch (error) {
    logger.error('activatePolicy error:', error);
    res.status(error.message.includes('STALE_APPROVAL_HASH_MISMATCH') ? 409 : 400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * POST /api/governance/policies/:policyId/suspend
 * Suspends active policy (ADMIN only)
 */
exports.suspendPolicy = async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }

    const { reason } = req.body;
    const policy = await GovernancePolicyService.suspendPolicy({
      organizationId: orgId,
      policyId: req.params.policyId,
      reason,
      user: req.user,
      customIO: getIO(req),
    });

    res.json({
      success: true,
      message: `Policy ${policy.policyId} suspended`,
      data: policy,
    });
  } catch (error) {
    logger.error('suspendPolicy error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/governance/policies/:policyId/retire
 * Retires a policy permanently (ADMIN only)
 */
exports.retirePolicy = async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }

    const { reason } = req.body;
    const policy = await GovernancePolicyService.retirePolicy({
      organizationId: orgId,
      policyId: req.params.policyId,
      reason,
      user: req.user,
      customIO: getIO(req),
    });

    res.json({
      success: true,
      message: `Policy ${policy.policyId} retired`,
      data: policy,
    });
  } catch (error) {
    logger.error('retirePolicy error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/governance/policies/:policyId/revisions
 * Lists immutable revision history for a policy
 */
exports.getRevisions = async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }

    const revisions = await GovernancePolicyService.getRevisions(orgId, req.params.policyId);
    res.json({ success: true, count: revisions.length, data: revisions });
  } catch (error) {
    logger.error('getRevisions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/governance/policies/:policyId/revisions/:version
 * Retrieves a specific revision snapshot
 */
exports.getRevision = async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }

    const version = parseInt(req.params.version, 10);
    const revision = await GovernancePolicyService.getRevision(orgId, req.params.policyId, version);
    res.json({ success: true, data: revision });
  } catch (error) {
    logger.error('getRevision error:', error);
    res.status(404).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/governance/policies/seed-canonical
 * Idempotently seeds 8 canonical enterprise governance policies in DRAFT
 */
exports.seedCanonicalPolicies = async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }

    const results = await GovernancePolicyService.seedCanonicalPolicies(orgId, req.user);
    res.json({
      success: true,
      message: 'Canonical governance policies seeded idempotently',
      data: results,
    });
  } catch (error) {
    logger.error('seedCanonicalPolicies error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// 2. GOVERNANCE POSTURE & GAPS CONTROLLERS
// ==========================================

/**
 * GET /api/governance/posture
 * Evaluates real platform state and returns truthful governance posture
 */
exports.getPosture = async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }

    const posture = await GovernanceEvaluationService.evaluateGovernancePosture(orgId);
    res.json({ success: true, data: posture });
  } catch (error) {
    logger.error('getPosture error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/governance/gaps
 * Identifies governance gaps with remediation guidance
 */
exports.getGaps = async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }

    const gapsReport = await GovernanceEvaluationService.identifyGovernanceGaps(orgId);
    res.json({ success: true, data: gapsReport });
  } catch (error) {
    logger.error('getGaps error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// 3. RETENTION & DATA LIFECYCLE CONTROLLERS
// ==========================================

/**
 * GET /api/governance/retention
 * Lists retention policies for an organization
 */
exports.listRetentionPolicies = async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }

    const policies = await DataLifecycleService.getRetentionPolicies(orgId);
    res.json({ success: true, count: policies.length, data: policies });
  } catch (error) {
    logger.error('listRetentionPolicies error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/governance/retention
 * Upserts a retention policy for an entity type (ADMIN only)
 */
exports.upsertRetentionPolicy = async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }

    const policy = await DataLifecycleService.upsertRetentionPolicy(orgId, req.body, req.user);
    res.json({ success: true, message: 'Retention policy saved successfully', data: policy });
  } catch (error) {
    logger.error('upsertRetentionPolicy error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/governance/retention/dry-run
 * Non-mutating retention eligibility check
 */
exports.dryRunRetention = async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }

    const { entityType } = req.body;
    if (!entityType) {
      return res.status(400).json({ success: false, error: 'entityType is required' });
    }

    const dryRun = await DataLifecycleService.dryRunRetention(orgId, entityType, getIO(req));
    res.json({ success: true, data: dryRun });
  } catch (error) {
    logger.error('dryRunRetention error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/governance/retention/execute
 * Bounded retention execution (ADMIN only, capped at 500)
 */
exports.executeRetention = async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }

    const { entityType, batchSize } = req.body;
    if (!entityType) {
      return res.status(400).json({ success: false, error: 'entityType is required' });
    }

    const outcome = await DataLifecycleService.executeRetention(
      orgId,
      entityType,
      req.user,
      { batchSize },
      getIO(req)
    );

    res.json({ success: true, data: outcome });
  } catch (error) {
    logger.error('executeRetention error:', error);
    res.status(error.message.includes('UNAUTHORIZED') ? 403 : 400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * POST /api/governance/retention/legal-hold
 * Engages or lifts legal hold (ADMIN only)
 */
exports.setLegalHold = async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }

    const { entityType, active, reason } = req.body;
    if (!entityType) {
      return res.status(400).json({ success: false, error: 'entityType is required' });
    }

    const policy = await DataLifecycleService.setLegalHold(
      orgId,
      entityType,
      active,
      reason,
      req.user,
      getIO(req)
    );

    res.json({
      success: true,
      message: `Legal hold ${active ? 'applied' : 'removed'} for ${entityType}`,
      data: policy,
    });
  } catch (error) {
    logger.error('setLegalHold error:', error);
    res.status(error.message.includes('UNAUTHORIZED') ? 403 : 400).json({
      success: false,
      error: error.message,
    });
  }
};

// ==========================================
// 4. BREAK-GLASS CONTROLLERS
// ==========================================

/**
 * GET /api/governance/breakglass
 * Lists break glass sessions
 */
exports.listBreakGlassSessions = async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }

    const { status } = req.query;
    const sessions = await BreakGlassService.listSessions(orgId, { status });
    res.json({ success: true, count: sessions.length, data: sessions });
  } catch (error) {
    logger.error('listBreakGlassSessions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/governance/breakglass/request
 * Submits an emergency break glass request
 */
exports.requestBreakGlass = async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }

    const { reason, durationMinutes, scope } = req.body;
    const session = await BreakGlassService.requestSession({
      organizationId: orgId,
      reason,
      requester: req.user,
      durationMinutes,
      scope,
    });

    res.status(201).json({
      success: true,
      message: `Break-glass session ${session.sessionId} requested`,
      data: session,
    });
  } catch (error) {
    logger.error('requestBreakGlass error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/governance/breakglass/:sessionId/approve
 * Approves break-glass request (ADMIN only)
 */
exports.approveBreakGlass = async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }

    const session = await BreakGlassService.approveSession({
      sessionId: req.params.sessionId,
      organizationId: orgId,
      approver: req.user,
      customIO: getIO(req),
    });

    res.json({
      success: true,
      message: `Break-glass session ${session.sessionId} approved and active until ${session.expiresAt.toISOString()}`,
      data: session,
    });
  } catch (error) {
    logger.error('approveBreakGlass error:', error);
    res.status(error.message.includes('UNAUTHORIZED') ? 403 : 400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * POST /api/governance/breakglass/:sessionId/revoke
 * Immediately terminates break-glass access
 */
exports.revokeBreakGlass = async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }

    const { reason } = req.body;
    const session = await BreakGlassService.revokeSession({
      sessionId: req.params.sessionId,
      organizationId: orgId,
      revoker: req.user,
      reason,
      customIO: getIO(req),
    });

    res.json({
      success: true,
      message: `Break-glass session ${session.sessionId} revoked`,
      data: session,
    });
  } catch (error) {
    logger.error('revokeBreakGlass error:', error);
    res.status(error.message.includes('UNAUTHORIZED') ? 403 : 400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * GET /api/governance/breakglass/active
 * Retrieves active break-glass sessions
 */
exports.getActiveBreakGlass = async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }

    const active = await BreakGlassService.getActiveSessions(orgId);
    res.json({ success: true, count: active.length, data: active });
  } catch (error) {
    logger.error('getActiveBreakGlass error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// 5. INTEGRATION GOVERNANCE CONTROLLERS
// ==========================================

/**
 * GET /api/governance/integrations
 * Lists integration credential metadata (NO raw secrets)
 */
exports.listIntegrations = async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }

    const { type, status } = req.query;
    const filter = { organizationId: orgId };
    if (type) filter.type = type.toUpperCase();
    if (status) filter.status = status.toUpperCase();

    const integrations = await IntegrationCredentialMetadata.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: integrations.length, data: integrations });
  } catch (error) {
    logger.error('listIntegrations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/governance/integrations
 * Registers integration credential metadata (ADMIN only)
 */
exports.createIntegration = async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }

    const { name, type, keyFingerprint, expiresAt, rotationIntervalDays, allowedScopes } = req.body;
    if (!name || !type || !keyFingerprint) {
      return res.status(400).json({
        success: false,
        error: 'name, type, and keyFingerprint are required',
      });
    }

    const integrationId = 'INT-' + crypto.randomBytes(6).toString('hex').toUpperCase();

    const integration = await IntegrationCredentialMetadata.create({
      integrationId,
      organizationId: orgId,
      name,
      type: type.toUpperCase(),
      keyFingerprint: keyFingerprint.trim(),
      owner: {
        id: String(req.user?._id || req.user?.id || 'admin'),
        username: req.user?.username || 'ADMIN',
      },
      status: 'ACTIVE',
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      rotationIntervalDays: rotationIntervalDays || 90,
      allowedScopes: allowedScopes || [],
    });

    res.status(201).json({
      success: true,
      message: `Integration metadata registered: ${integration.integrationId}`,
      data: integration,
    });
  } catch (error) {
    logger.error('createIntegration error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * PUT /api/governance/integrations/:integrationId
 * Updates metadata or records rotation (ADMIN only)
 */
exports.updateIntegration = async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }

    const { name, status, keyFingerprint, expiresAt, rotationIntervalDays } = req.body;
    const integration = await IntegrationCredentialMetadata.findOne({
      integrationId: req.params.integrationId,
      organizationId: orgId,
    });

    if (!integration) {
      return res.status(404).json({ success: false, error: 'Integration metadata not found' });
    }

    if (name) integration.name = name;
    if (status) integration.status = status;
    if (rotationIntervalDays) integration.rotationIntervalDays = rotationIntervalDays;
    if (expiresAt) integration.expiresAt = new Date(expiresAt);

    if (keyFingerprint && keyFingerprint !== integration.keyFingerprint) {
      integration.keyFingerprint = keyFingerprint;
      integration.lastRotatedAt = new Date();
      integration.status = 'ACTIVE';
    }

    await integration.save();

    res.json({
      success: true,
      message: `Integration ${integration.integrationId} metadata updated`,
      data: integration,
    });
  } catch (error) {
    logger.error('updateIntegration error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * DELETE /api/governance/integrations/:integrationId
 * Retires or removes an integration metadata record (ADMIN only)
 */
exports.deleteIntegration = async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }

    const integration = await IntegrationCredentialMetadata.findOne({
      integrationId: req.params.integrationId,
      organizationId: orgId,
    });

    if (!integration) {
      return res.status(404).json({ success: false, error: 'Integration metadata not found' });
    }

    integration.status = 'RETIRED';
    await integration.save();

    res.json({
      success: true,
      message: `Integration ${integration.integrationId} retired`,
      data: integration,
    });
  } catch (error) {
    logger.error('deleteIntegration error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};
