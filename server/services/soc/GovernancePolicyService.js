/**
 * 🛡️ CyberShield X — GovernancePolicyService (Phase 75)
 *
 * Enterprise policy management service supporting:
 * - Deterministic lifecycle: DRAFT -> REVIEW -> APPROVED -> ACTIVE -> SUSPENDED -> RETIRED
 * - Immutable revision history with SHA-256 content verification
 * - Stale-approval protection: binds approval to specific revision hash
 * - Idempotent seeding across 8 canonical governance domains
 * - Real-time event broadcasting and audit trail integration
 */

const crypto = require('crypto');
const GovernancePolicy = require('../../models/GovernancePolicy');
const GovernancePolicyRevision = require('../../models/GovernancePolicyRevision');
const AuditEvent = require('../../models/AuditEvent');
const logger = require('../../utils/logger');

class GovernancePolicyService {
  constructor() {
    this.io = null;
  }

  setIO(ioInstance) {
    this.io = ioInstance;
  }

  _getIO(req) {
    if (this.io) return this.io;
    if (req && req.app && typeof req.app.get === 'function') {
      return req.app.get('io');
    }
    return null;
  }

  _broadcast(eventName, payload, customIO = null) {
    const io = customIO || this.io;
    if (!io) return;
    try {
      io.emit(eventName, payload);
    } catch (err) {
      logger.warn(`Failed to broadcast ${eventName}: ${err.message}`);
    }
  }

  _hashConfiguration(config) {
    const serialized = JSON.stringify(config || {}, Object.keys(config || {}).sort());
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  async _recordAudit({ organizationId, actor, action, resourceId, details, outcome = 'SUCCESS' }) {
    try {
      const eventId = 'AUD-' + crypto.randomBytes(6).toString('hex');
      await AuditEvent.create({
        eventId,
        organizationId,
        actor: {
          userId: actor?.id || actor?._id || actor?.userId || 'system',
          username: actor?.username || 'SYSTEM',
          email: actor?.email || 'system@cybershield.local',
          role: actor?.role || 'OPERATOR',
          ip: actor?.ip || '127.0.0.1',
        },
        action,
        resource: {
          resourceType: 'GOVERNANCE_POLICY',
          resourceId: String(resourceId),
          type: 'GOVERNANCE_POLICY',
          id: String(resourceId),
        },
        outcome,
        details: details || {},
        timestamp: new Date(),
      });
    } catch (err) {
      logger.warn(`GovernancePolicyService audit recording failed: ${err.message}`);
    }
  }

  /**
   * Creates a new organization governance policy in DRAFT status
   */
  async createPolicy({
    organizationId,
    policyType,
    name,
    description = '',
    configuration = {},
    enforcementMode = 'ENFORCE',
    user,
    customIO = null,
  }) {
    if (!organizationId) throw new Error('organizationId is required');
    if (!policyType) throw new Error('policyType is required');
    if (!name) throw new Error('name is required');

    const policyId = 'POL-' + crypto.randomBytes(6).toString('hex').toUpperCase();
    const contentHash = this._hashConfiguration(configuration);

    const policy = await GovernancePolicy.create({
      policyId,
      organizationId,
      policyType,
      name,
      description,
      status: 'DRAFT',
      currentVersion: 1,
      enforcementMode,
      configuration,
      checksum: contentHash,
      createdBy: {
        id: String(user?._id || user?.id || 'system'),
        username: user?.username || 'SYSTEM',
        role: user?.role || 'OPERATOR',
      },
    });

    // Create immutable revision 1
    await GovernancePolicyRevision.create({
      policyId,
      organizationId,
      version: 1,
      configurationSnapshot: configuration,
      changeSummary: 'Initial policy draft creation',
      changedBy: {
        id: String(user?._id || user?.id || 'system'),
        username: user?.username || 'SYSTEM',
        role: user?.role || 'OPERATOR',
      },
      contentHash,
      createdAt: new Date(),
    });

    await this._recordAudit({
      organizationId,
      actor: user,
      action: 'GOVERNANCE_POLICY_CREATED',
      resourceId: policyId,
      details: { policyType, name, version: 1, contentHash },
    });

    this._broadcast(
      'governance:policy-created',
      { policyId, organizationId, policyType, name, status: 'DRAFT', version: 1 },
      customIO
    );

    return policy;
  }

  /**
   * Updates an existing policy draft or creates a new revision
   */
  async updatePolicyDraft({
    organizationId,
    policyId,
    configuration,
    name,
    description,
    enforcementMode,
    changeSummary = 'Policy configuration updated',
    user,
  }) {
    const policy = await GovernancePolicy.findOne({ policyId, organizationId });
    if (!policy) throw new Error(`Policy not found: ${policyId}`);

    if (policy.status === 'RETIRED') {
      throw new Error('Retired policies cannot be modified');
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (enforcementMode !== undefined) updates.enforcementMode = enforcementMode;

    let revisionCreated = false;
    let newHash = policy.checksum;

    if (configuration !== undefined) {
      newHash = this._hashConfiguration(configuration);
      updates.configuration = configuration;
      updates.checksum = newHash;

      // If policy was APPROVED or ACTIVE, updating it must invalidate prior approval and increment version!
      if (policy.status === 'APPROVED' || policy.status === 'ACTIVE') {
        const nextVersion = policy.currentVersion + 1;
        updates.currentVersion = nextVersion;
        updates.status = 'DRAFT';
        updates.approvedBy = null;
        updates.approvedAt = null;
        updates.approvedRevisionHash = null;

        await GovernancePolicyRevision.create({
          policyId,
          organizationId,
          version: nextVersion,
          configurationSnapshot: configuration,
          changeSummary,
          changedBy: {
            id: String(user?._id || user?.id || 'system'),
            username: user?.username || 'SYSTEM',
            role: user?.role || 'OPERATOR',
          },
          contentHash: newHash,
          createdAt: new Date(),
        });
        revisionCreated = true;
      } else {
        // If in DRAFT or REJECTED or REVIEW, update the latest revision snapshot or create incremental
        const latestRevision = await GovernancePolicyRevision.findOne({
          policyId,
          organizationId,
          version: policy.currentVersion,
        });

        if (latestRevision) {
          // Revisions are immutable once reviewed/approved; in early draft stage, update snapshot or increment
          if (policy.status === 'REVIEW') {
            // Reset to DRAFT if modified during review
            updates.status = 'DRAFT';
          }
          await GovernancePolicyRevision.create({
            policyId,
            organizationId,
            version: policy.currentVersion + 1,
            configurationSnapshot: configuration,
            changeSummary,
            changedBy: {
              id: String(user?._id || user?.id || 'system'),
              username: user?.username || 'SYSTEM',
              role: user?.role || 'OPERATOR',
            },
            contentHash: newHash,
            createdAt: new Date(),
          });
          updates.currentVersion = policy.currentVersion + 1;
          revisionCreated = true;
        }
      }
    }

    Object.assign(policy, updates);
    await policy.save();

    await this._recordAudit({
      organizationId,
      actor: user,
      action: 'GOVERNANCE_POLICY_UPDATED',
      resourceId: policyId,
      details: {
        version: policy.currentVersion,
        status: policy.status,
        revisionCreated,
        contentHash: newHash,
      },
    });

    return policy;
  }

  /**
   * Submits a DRAFT policy for review
   */
  async submitForReview({ organizationId, policyId, user }) {
    const policy = await GovernancePolicy.findOne({ policyId, organizationId });
    if (!policy) throw new Error(`Policy not found: ${policyId}`);

    if (policy.status !== 'DRAFT' && policy.status !== 'REJECTED') {
      throw new Error(`Policy in status '${policy.status}' cannot be submitted for review`);
    }

    policy.status = 'REVIEW';
    await policy.save();

    await this._recordAudit({
      organizationId,
      actor: user,
      action: 'GOVERNANCE_POLICY_SUBMITTED_FOR_REVIEW',
      resourceId: policyId,
      details: { version: policy.currentVersion },
    });

    return policy;
  }

  /**
   * Approves a policy in REVIEW status.
   * Binds approval cryptographically to the exact revision hash.
   */
  async approvePolicy({ organizationId, policyId, user, customIO = null }) {
    const policy = await GovernancePolicy.findOne({ policyId, organizationId });
    if (!policy) throw new Error(`Policy not found: ${policyId}`);

    if (policy.status !== 'REVIEW') {
      throw new Error(`Policy in status '${policy.status}' cannot be approved (must be in REVIEW)`);
    }

    const latestRevision = await GovernancePolicyRevision.findOne({
      policyId,
      organizationId,
      version: policy.currentVersion,
    });

    if (!latestRevision) {
      throw new Error(`Revision ${policy.currentVersion} not found for policy ${policyId}`);
    }

    policy.status = 'APPROVED';
    policy.approvedBy = {
      id: String(user?._id || user?.id || 'admin'),
      username: user?.username || 'ADMIN',
      role: user?.role || 'ADMIN',
    };
    policy.approvedAt = new Date();
    policy.approvedRevisionHash = latestRevision.contentHash;
    await policy.save();

    await this._recordAudit({
      organizationId,
      actor: user,
      action: 'GOVERNANCE_POLICY_APPROVED',
      resourceId: policyId,
      details: {
        version: policy.currentVersion,
        approvedRevisionHash: latestRevision.contentHash,
      },
    });

    this._broadcast(
      'governance:policy-approved',
      {
        policyId,
        organizationId,
        version: policy.currentVersion,
        approvedRevisionHash: latestRevision.contentHash,
      },
      customIO
    );

    return policy;
  }

  /**
   * Activates an APPROVED or SUSPENDED policy.
   * Enforces critical stale-approval hash check.
   */
  async activatePolicy({ organizationId, policyId, user, customIO = null }) {
    const policy = await GovernancePolicy.findOne({ policyId, organizationId });
    if (!policy) throw new Error(`Policy not found: ${policyId}`);

    if (policy.status !== 'APPROVED' && policy.status !== 'SUSPENDED') {
      throw new Error(`Policy in status '${policy.status}' cannot be activated (must be APPROVED or SUSPENDED)`);
    }

    const latestRevision = await GovernancePolicyRevision.findOne({
      policyId,
      organizationId,
      version: policy.currentVersion,
    });

    if (!latestRevision) {
      throw new Error(`Revision ${policy.currentVersion} not found for policy ${policyId}`);
    }

    // CRITICAL STALE-APPROVAL CHECK:
    // The policy's current configuration must match the revision hash that was approved.
    if (!policy.approvedRevisionHash || policy.approvedRevisionHash !== latestRevision.contentHash) {
      throw new Error(
        `STALE_APPROVAL_HASH_MISMATCH: Approved revision hash (${policy.approvedRevisionHash || 'NONE'}) does not match current revision hash (${latestRevision.contentHash}). Policy must be re-reviewed and re-approved.`
      );
    }

    policy.status = 'ACTIVE';
    policy.effectiveAt = new Date();
    await policy.save();

    await this._recordAudit({
      organizationId,
      actor: user,
      action: 'GOVERNANCE_POLICY_ACTIVATED',
      resourceId: policyId,
      details: {
        version: policy.currentVersion,
        effectiveAt: policy.effectiveAt,
        approvedRevisionHash: policy.approvedRevisionHash,
      },
    });

    this._broadcast(
      'governance:policy-activated',
      { policyId, organizationId, status: 'ACTIVE', version: policy.currentVersion },
      customIO
    );

    return policy;
  }

  /**
   * Suspends an ACTIVE policy
   */
  async suspendPolicy({ organizationId, policyId, reason = '', user, customIO = null }) {
    const policy = await GovernancePolicy.findOne({ policyId, organizationId });
    if (!policy) throw new Error(`Policy not found: ${policyId}`);

    if (policy.status !== 'ACTIVE') {
      throw new Error(`Policy in status '${policy.status}' cannot be suspended`);
    }

    policy.status = 'SUSPENDED';
    await policy.save();

    await this._recordAudit({
      organizationId,
      actor: user,
      action: 'GOVERNANCE_POLICY_SUSPENDED',
      resourceId: policyId,
      details: { reason, version: policy.currentVersion },
    });

    this._broadcast(
      'governance:policy-suspended',
      { policyId, organizationId, status: 'SUSPENDED', reason },
      customIO
    );

    return policy;
  }

  /**
   * Retires a policy permanently
   */
  async retirePolicy({ organizationId, policyId, reason = '', user, customIO = null }) {
    const policy = await GovernancePolicy.findOne({ policyId, organizationId });
    if (!policy) throw new Error(`Policy not found: ${policyId}`);

    policy.status = 'RETIRED';
    await policy.save();

    await this._recordAudit({
      organizationId,
      actor: user,
      action: 'GOVERNANCE_POLICY_RETIRED',
      resourceId: policyId,
      details: { reason, version: policy.currentVersion },
    });

    this._broadcast(
      'governance:policy-retired',
      { policyId, organizationId, status: 'RETIRED', reason },
      customIO
    );

    return policy;
  }

  /**
   * Rejects a policy in REVIEW status
   */
  async rejectPolicy({ organizationId, policyId, reason = '', user }) {
    const policy = await GovernancePolicy.findOne({ policyId, organizationId });
    if (!policy) throw new Error(`Policy not found: ${policyId}`);

    if (policy.status !== 'REVIEW') {
      throw new Error(`Policy in status '${policy.status}' cannot be rejected`);
    }

    policy.status = 'REJECTED';
    await policy.save();

    await this._recordAudit({
      organizationId,
      actor: user,
      action: 'GOVERNANCE_POLICY_REJECTED',
      resourceId: policyId,
      details: { reason, version: policy.currentVersion },
    });

    return policy;
  }

  /**
   * Lists policies for an organization
   */
  async listPolicies(organizationId, filter = {}) {
    const query = { organizationId };
    if (filter.status) query.status = filter.status;
    if (filter.policyType) query.policyType = filter.policyType;
    if (filter.enforcementMode) query.enforcementMode = filter.enforcementMode;

    return await GovernancePolicy.find(query).sort({ updatedAt: -1 });
  }

  /**
   * Retrieves single policy
   */
  async getPolicy(organizationId, policyId) {
    const policy = await GovernancePolicy.findOne({ organizationId, policyId });
    if (!policy) throw new Error(`Policy not found: ${policyId}`);
    return policy;
  }

  /**
   * Retrieves immutable revision history for a policy
   */
  async getRevisions(organizationId, policyId) {
    return await GovernancePolicyRevision.find({ organizationId, policyId }).sort({ version: -1 });
  }

  /**
   * Retrieves a specific revision
   */
  async getRevision(organizationId, policyId, version) {
    const rev = await GovernancePolicyRevision.findOne({ organizationId, policyId, version });
    if (!rev) throw new Error(`Revision ${version} not found for policy ${policyId}`);
    return rev;
  }

  /**
   * Seeds canonical governance policies idempotently across 8 domains.
   * Initial status is DRAFT so it does NOT fabricate compliance.
   */
  async seedCanonicalPolicies(organizationId, user = null) {
    const actor = user || { id: 'system', username: 'SYSTEM', role: 'ADMIN' };

    const canonicalDefinitions = [
      {
        policyType: 'ACCESS_GOVERNANCE',
        name: 'Enterprise Access Control & Least Privilege Policy',
        description: 'Mandates strict RBAC boundaries, MFA enforcement, and privileged access review cycles.',
        configuration: {
          requireMFA: true,
          sessionMaxAgeHours: 12,
          idleTimeoutMinutes: 30,
          passwordMinLength: 14,
          maxFailedAttempts: 5,
          lockoutDurationMinutes: 15,
        },
      },
      {
        policyType: 'SESSION_SECURITY',
        name: 'SOC Session & Authentication Governance Policy',
        description: 'Defines maximum session lifetimes, concurrent session constraints, and re-authentication gates.',
        configuration: {
          maxConcurrentSessions: 3,
          terminateOnIpChange: true,
          requireElevatedAuthForAdmin: true,
          enforceDeviceTrust: false,
        },
      },
      {
        policyType: 'APPROVAL_GOVERNANCE',
        name: 'Two-Person Integrity & Privileged Action Governance',
        description: 'Enforces dual-custody authorization for destructive operations and sensitive policy changes.',
        configuration: {
          requirePeerApprovalForDestructiveActions: true,
          minAdminApprovers: 1,
          approvalExpiryMinutes: 60,
          selfApprovalAllowed: false,
        },
      },
      {
        policyType: 'AUDIT_GOVERNANCE',
        name: 'Centralized Immutable Audit & Non-Repudiation Policy',
        description: 'Guarantees unalterable audit log generation, chronological integrity, and tamper detection.',
        configuration: {
          logAllPrivilegedActions: true,
          immutableAuditTrail: true,
          exportIntervalHours: 24,
          tamperAlertSeverity: 'HIGH',
        },
      },
      {
        policyType: 'EVIDENCE_GOVERNANCE',
        name: 'Forensic Evidence Preservation & Chain of Custody Policy',
        description: 'Specifies SHA-256 cryptographic hashing, RFC 3161 timestamps, and evidence locking rules.',
        configuration: {
          requireCryptographicHashing: true,
          hashAlgorithm: 'SHA-256',
          lockEvidenceOnCreation: true,
          minCustodyAuditors: 2,
        },
      },
      {
        policyType: 'REPORTING_GOVERNANCE',
        name: 'SOC Executive & Regulatory Reporting Compliance Policy',
        description: 'Controls distribution of SOC reports, classification markings, and executive review cadences.',
        configuration: {
          executiveReviewCadence: 'MONTHLY',
          markWithClassificationBanner: true,
          sanitizePIIBeforeDistribution: true,
        },
      },
      {
        policyType: 'DETECTION_GOVERNANCE',
        name: 'Detection Engineering Quality & Testing Policy',
        description: 'Mandates synthetic validation, test coverage thresholds, and approval gates prior to rule activation.',
        configuration: {
          requireDryRunBeforeProduction: true,
          minTestCoveragePercent: 80,
          requireMitreMapping: true,
        },
      },
      {
        policyType: 'INTEGRATION_GOVERNANCE',
        name: 'External Security Tool & API Integration Policy',
        description: 'Governs SIEM, SOAR, EDR connector credentials, key rotation schedules, and permission scopes.',
        configuration: {
          enforceKeyRotationDays: 90,
          disallowRawCredentialsInDb: true,
          requireTls13ForEgress: true,
        },
      },
    ];

    const results = [];

    for (const def of canonicalDefinitions) {
      // Idempotency: Check if policy already exists for this organization and policyType
      const existing = await GovernancePolicy.findOne({
        organizationId,
        policyType: def.policyType,
      });

      if (existing) {
        results.push({ policyType: def.policyType, status: 'SKIPPED_EXISTS', policyId: existing.policyId });
      } else {
        const created = await this.createPolicy({
          organizationId,
          policyType: def.policyType,
          name: def.name,
          description: def.description,
          configuration: def.configuration,
          enforcementMode: 'ENFORCE',
          user: actor,
        });
        results.push({ policyType: def.policyType, status: 'CREATED', policyId: created.policyId });
      }
    }

    return results;
  }
}

module.exports = new GovernancePolicyService();
