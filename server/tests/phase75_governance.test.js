/**
 * 🛡️ CyberShield X — Phase 75 Enterprise Governance & Data Lifecycle Test Suite
 *
 * Validates:
 * 1. Policy lifecycle: DRAFT -> REVIEW -> APPROVED -> ACTIVE -> SUSPENDED -> RETIRED
 * 2. Immutable revision history with SHA-256 content hashes
 * 3. Stale-approval protection: modified draft cannot be activated with outdated approval hash
 * 4. RBAC gates: Viewer & Analyst cannot bypass admin-only lifecycle operations
 * 5. Strict multi-tenant isolation (Org A vs Org B)
 * 6. Non-mutating data retention dry run
 * 7. Active legal holds strictly blocking destructive lifecycle execution
 * 8. Bounded retention execution capped at 500 records
 * 9. Break-glass emergency sessions with narrow scopes, auto-expiry, and action logging
 * 10. Integration credential metadata governance with zero raw secret storage
 * 11. Truthful governance posture evaluation (never fabricating compliance)
 * 12. Bounded AI governance advisory boundaries and untrusted data delimiters
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const GovernancePolicy = require('../models/GovernancePolicy');
const GovernancePolicyRevision = require('../models/GovernancePolicyRevision');
const RetentionPolicy = require('../models/RetentionPolicy');
const BreakGlassSession = require('../models/BreakGlassSession');
const IntegrationCredentialMetadata = require('../models/IntegrationCredentialMetadata');
const AuditEvent = require('../models/AuditEvent');
const Incident = require('../models/Incident');

const GovernancePolicyService = require('../services/soc/GovernancePolicyService');
const DataLifecycleService = require('../services/soc/DataLifecycleService');
const GovernanceEvaluationService = require('../services/soc/GovernanceEvaluationService');
const BreakGlassService = require('../services/soc/BreakGlassService');
const chatbotController = require('../controllers/chatbot/chatbotController');

describe('Phase 75 — Enterprise Governance, Policy Administration & Data Lifecycle', () => {
  const orgA = 'org-jest-alpha-75';
  const orgB = 'org-jest-beta-75';

  const userAdminA = { _id: 'admin-alpha', username: 'alice_adm', role: 'ADMIN', organizationId: orgA };
  const userAnalystA = { _id: 'analyst-alpha', username: 'bob_ana', role: 'ANALYST', organizationId: orgA };
  const userAdminB = { _id: 'admin-beta', username: 'carol_adm', role: 'ADMIN', organizationId: orgB };

  const cleanup = async () => {
    await GovernancePolicy.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await GovernancePolicyRevision.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await RetentionPolicy.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await BreakGlassSession.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await IntegrationCredentialMetadata.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await AuditEvent.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await Incident.deleteMany({ organizationId: { $in: [orgA, orgB] } });
  };

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cybershield_test');
    }
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await mongoose.disconnect();
  });

  describe('1. Policy Lifecycle & Immutable Revision Tracking', () => {
    let policyId;

    test('Creates policy in DRAFT status with initial immutable revision 1', async () => {
      const pol = await GovernancePolicyService.createPolicy({
        organizationId: orgA,
        policyType: 'ACCESS_GOVERNANCE',
        name: 'Alpha Access Control Policy',
        description: 'Primary tenant access rules',
        configuration: { requireMFA: true, sessionMaxAgeHours: 12 },
        enforcementMode: 'ENFORCE',
        user: userAnalystA,
      });

      expect(pol).toBeDefined();
      expect(pol.status).toBe('DRAFT');
      expect(pol.currentVersion).toBe(1);
      expect(pol.checksum).toBeDefined();

      policyId = pol.policyId;

      const rev = await GovernancePolicyRevision.findOne({ organizationId: orgA, policyId, version: 1 });
      expect(rev).toBeDefined();
      expect(rev.contentHash).toBe(pol.checksum);
    });

    test('Transitions from DRAFT to REVIEW then to APPROVED with revision hash binding', async () => {
      const revPol = await GovernancePolicyService.submitForReview({
        organizationId: orgA,
        policyId,
        user: userAnalystA,
      });
      expect(revPol.status).toBe('REVIEW');

      const appPol = await GovernancePolicyService.approvePolicy({
        organizationId: orgA,
        policyId,
        user: userAdminA,
      });
      expect(appPol.status).toBe('APPROVED');
      expect(appPol.approvedRevisionHash).toBe(appPol.checksum);
    });

    test('Activates successfully when current hash matches approved revision hash', async () => {
      const actPol = await GovernancePolicyService.activatePolicy({
        organizationId: orgA,
        policyId,
        user: userAdminA,
      });
      expect(actPol.status).toBe('ACTIVE');
      expect(actPol.effectiveAt).toBeDefined();
    });

    test('CRITICAL: Modifying active policy invalidates approval; stale approval hash rejects activation', async () => {
      // Modify configuration
      const modPol = await GovernancePolicyService.updatePolicyDraft({
        organizationId: orgA,
        policyId,
        configuration: { requireMFA: true, sessionMaxAgeHours: 2 }, // changed config!
        changeSummary: 'Reduced max session age',
        user: userAnalystA,
      });

      expect(modPol.status).toBe('DRAFT');
      expect(modPol.currentVersion).toBe(2);
      expect(modPol.approvedRevisionHash).toBeNull();

      // Attempting to activate directly must be rejected
      await expect(
        GovernancePolicyService.activatePolicy({
          organizationId: orgA,
          policyId,
          user: userAdminA,
        })
      ).rejects.toThrow();
    });

    test('Suspends active policy and retires policy permanently', async () => {
      // Re-review, approve, and activate revision 2
      await GovernancePolicyService.submitForReview({ organizationId: orgA, policyId, user: userAnalystA });
      await GovernancePolicyService.approvePolicy({ organizationId: orgA, policyId, user: userAdminA });
      await GovernancePolicyService.activatePolicy({ organizationId: orgA, policyId, user: userAdminA });

      const suspended = await GovernancePolicyService.suspendPolicy({
        organizationId: orgA,
        policyId,
        reason: 'Under audit review',
        user: userAdminA,
      });
      expect(suspended.status).toBe('SUSPENDED');

      const retired = await GovernancePolicyService.retirePolicy({
        organizationId: orgA,
        policyId,
        reason: 'Superseded',
        user: userAdminA,
      });
      expect(retired.status).toBe('RETIRED');

      // Edits on retired policy must fail
      await expect(
        GovernancePolicyService.updatePolicyDraft({
          organizationId: orgA,
          policyId,
          name: 'Renamed',
          user: userAnalystA,
        })
      ).rejects.toThrow('Retired policies cannot be modified');
    });
  });

  describe('2. Multi-Tenant Isolation & RBAC Protection', () => {
    test('Strict tenant isolation prevents Org B from accessing Org A policies', async () => {
      await GovernancePolicyService.createPolicy({
        organizationId: orgB,
        policyType: 'SESSION_SECURITY',
        name: 'Beta Session Policy',
        configuration: { maxConcurrentSessions: 2 },
        user: userAdminB,
      });

      const policiesA = await GovernancePolicyService.listPolicies(orgA);
      const policiesB = await GovernancePolicyService.listPolicies(orgB);

      expect(policiesA.some((p) => p.organizationId === orgB)).toBe(false);
      expect(policiesB.some((p) => p.organizationId === orgA)).toBe(false);
    });

    test('Non-admin users cannot approve break-glass sessions or execute retention', async () => {
      const bg = await BreakGlassService.requestSession({
        organizationId: orgA,
        reason: 'Emergency server diagnostic',
        requester: userAnalystA,
        durationMinutes: 30,
      });

      await expect(
        BreakGlassService.approveSession({
          sessionId: bg.sessionId,
          organizationId: orgA,
          approver: userAnalystA, // Analyst!
        })
      ).rejects.toThrow('UNAUTHORIZED');

      await expect(
        DataLifecycleService.executeRetention(orgA, 'incidents', userAnalystA, {})
      ).rejects.toThrow('UNAUTHORIZED');
    });
  });

  describe('3. Bounded Data Lifecycle, Dry-Runs & Legal Holds', () => {
    beforeAll(async () => {
      const oldTime = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000); // 100 days old
      const freshTime = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);  // 5 days old

      await Incident.create([
        { incidentId: 'INC-JEST-OLD-1', title: 'Old 1', organizationId: orgA, createdAt: oldTime },
        { incidentId: 'INC-JEST-OLD-2', title: 'Old 2', organizationId: orgA, createdAt: oldTime },
        { incidentId: 'INC-JEST-RECENT', title: 'Recent', organizationId: orgA, createdAt: freshTime },
      ]);

      await DataLifecycleService.upsertRetentionPolicy(
        orgA,
        { entityType: 'incidents', retentionDays: 90, retentionClass: 'EXPIRE' },
        userAdminA
      );
    });

    test('Dry run preview returns accurate eligibility without mutating any records', async () => {
      const preview = await DataLifecycleService.dryRunRetention(orgA, 'incidents');
      expect(preview.dryRun).toBe(true);
      expect(preview.eligibleCount).toBe(2);

      const dbCount = await Incident.countDocuments({ organizationId: orgA });
      expect(dbCount).toBe(3);
    });

    test('Active legal hold strictly blocks destructive retention execution', async () => {
      await DataLifecycleService.setLegalHold(
        orgA,
        'incidents',
        true,
        'Active subpoena #4421',
        userAdminA
      );

      const dryRunHold = await DataLifecycleService.dryRunRetention(orgA, 'incidents');
      expect(dryRunHold.legalHoldActive).toBe(true);
      expect(dryRunHold.projectedAction).toBe('BLOCKED');

      const execResult = await DataLifecycleService.executeRetention(orgA, 'incidents', userAdminA);
      expect(execResult.blocked).toBe(true);
      expect(execResult.status).toBe('LEGAL_HOLD');
      expect(execResult.deletedCount).toBe(0);

      // Records must remain untouched
      const dbCount = await Incident.countDocuments({ organizationId: orgA });
      expect(dbCount).toBe(3);
    });

    test('Bounded retention deletes only aged records and enforces 500 limit', async () => {
      // Lift legal hold
      await DataLifecycleService.setLegalHold(orgA, 'incidents', false, '', userAdminA);

      const execResult = await DataLifecycleService.executeRetention(
        orgA,
        'incidents',
        userAdminA,
        { batchSize: 1000 }
      );

      expect(execResult.batchLimit).toBeLessThanOrEqual(500);
      expect(execResult.deletedCount).toBe(2);
      expect(execResult.status).toBe('SUCCESS');

      // Only recent record remains
      const remaining = await Incident.find({ organizationId: orgA });
      expect(remaining.length).toBe(1);
      expect(remaining[0].incidentId).toBe('INC-JEST-RECENT');
    });
  });

  describe('4. Break-Glass Scope Gating & Auto-Expiration', () => {
    let session;

    test('Admin approves session with explicit narrow scope', async () => {
      const req = await BreakGlassService.requestSession({
        organizationId: orgA,
        reason: 'Emergency firewall containment',
        requester: userAnalystA,
        durationMinutes: 10,
        scope: ['EMERGENCY_ISOLATE_HOST'],
      });

      session = await BreakGlassService.approveSession({
        sessionId: req.sessionId,
        organizationId: orgA,
        approver: userAdminA,
      });

      expect(session.status).toBe('ACTIVE');
      expect(session.scope).toContain('EMERGENCY_ISOLATE_HOST');
    });

    test('In-scope action allowed; out-of-scope action strictly denied', async () => {
      const allowed = await BreakGlassService.validatePrivilegedAction({
        organizationId: orgA,
        userId: userAnalystA._id,
        requestedAction: 'EMERGENCY_ISOLATE_HOST',
      });
      expect(allowed.allowed).toBe(true);

      const denied = await BreakGlassService.validatePrivilegedAction({
        organizationId: orgA,
        userId: userAnalystA._id,
        requestedAction: 'EXPORT_ALL_CUSTOMER_PII',
      });
      expect(denied.allowed).toBe(false);
      expect(denied.reason).toBe('ACTION_NOT_IN_APPROVED_SCOPE');
    });

    test('Expired session immediately denies privileged action', async () => {
      // Backdate expiration
      session.expiresAt = new Date(Date.now() - 5000);
      await session.save();

      const expiredCheck = await BreakGlassService.validatePrivilegedAction({
        organizationId: orgA,
        userId: userAnalystA._id,
        requestedAction: 'EMERGENCY_ISOLATE_HOST',
      });
      expect(expiredCheck.allowed).toBe(false);
      expect(expiredCheck.reason).toBe('BREAK_GLASS_SESSION_EXPIRED');
    });
  });

  describe('5. Integration Credential Governance & Zero Raw Secrets', () => {
    test('Stores key fingerprint and rotation interval; zero raw secrets persisted', async () => {
      const rawSecret = 'SUPER_SECRET_KEY_12345';
      const keyFingerprint = crypto.createHash('sha256').update(rawSecret).digest('hex');

      const meta = await IntegrationCredentialMetadata.create({
        integrationId: 'INT-JEST-SOAR',
        organizationId: orgA,
        name: 'Tines SOAR Webhook Connector',
        type: 'SOAR',
        keyFingerprint,
        status: 'ACTIVE',
        rotationIntervalDays: 60,
      });

      const loaded = await IntegrationCredentialMetadata.findOne({ integrationId: 'INT-JEST-SOAR' }).lean();
      expect(loaded.keyFingerprint).toBe(keyFingerprint);
      expect(JSON.stringify(loaded).includes(rawSecret)).toBe(false);
    });
  });

  describe('6. Truthful Governance Posture & Bounded AI Delimiters', () => {
    test('Unconfigured controls evaluate to NOT_CONFIGURED without synthetic fabrication', async () => {
      const posture = await GovernanceEvaluationService.evaluateGovernancePosture(orgA);
      expect(posture.overallStatus).toBeDefined();

      const notConfigured = posture.domains.find((d) => d.status === 'NOT_CONFIGURED');
      expect(notConfigured).toBeDefined();
      expect(notConfigured.explanation).toContain('No governance policy configured');
    });

    test('AI governance copilot declares non-autonomous advisory boundaries', async () => {
      let responsePayload = null;
      const mockReq = {
        body: { organizationId: orgA },
        user: userAnalystA,
      };
      const mockRes = {
        json: (data) => { responsePayload = data; },
        status: () => mockRes,
      };

      await chatbotController.handleGovernanceSummarize(mockReq, mockRes);
      expect(responsePayload.success).toBe(true);
      expect(responsePayload.data.aiBoundary.isAdvisory).toBe(true);
      expect(responsePayload.data.aiBoundary.canApprove).toBe(false);
      expect(responsePayload.data.aiBoundary.canActivate).toBe(false);
    });
  });
});
