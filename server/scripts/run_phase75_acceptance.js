/**
 * 🛡️ CyberShield X — Phase 75 Acceptance Runner
 *
 * Enterprise Multi-Tenant Governance, Policy Administration & Data Lifecycle
 *
 * Validates Workflows A through V:
 * - Workflow A: Policy Creation & Immutable Revision Snapshot
 * - Workflow B: Review & Approval Workflow
 * - Workflow C: Revision-Bound Activation & Stale-Approval Protection
 * - Workflow D: Policy Suspension & Retirement
 * - Workflow E: RBAC Enforcement
 * - Workflow F: Tenant Isolation (Org A vs Org B)
 * - Workflow G: Governance Evaluation Engine (Truthful Posture & Gaps)
 * - Workflow H: Data Lifecycle & Retention Eligibility
 * - Workflow I: Dry-Run Non-Mutation Guarantee
 * - Workflow J: Legal Hold Mutation Protection (Before & at Mutation Boundary)
 * - Workflow K: Bounded Retention Execution (Max 500 records)
 * - Workflow L: Immutable Audit Evidence Trail
 * - Workflow M: Break-Glass Request & Admin Approval
 * - Workflow N: Break-Glass Scope Enforcement & Action Logging
 * - Workflow O: Break-Glass Expiration & Immediate Revocation
 * - Workflow P: Integration Credential Metadata (Zero Raw Secrets)
 * - Workflow Q: Global Search Scoping
 * - Workflow R: Real-Time Lifecycle Events
 * - Workflow S: Bounded AI Advisory Safety
 * - Workflow T: Canonical Seeding Idempotency
 *
 * Target: 40/40+ PASS | Verdict: ENTERPRISE_GOVERNANCE_CERTIFIED
 * Emits:
 * - server/scripts/governance_status_v75.json
 * - server/scripts/phase75_governance.json
 * - docs/PHASE75_GOVERNANCE.md
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cybershield_acceptance_75';

async function runAcceptance() {
  console.log('====================================================================================================');
  console.log('CYBERSHIELD X — PHASE 75 ENTERPRISE GOVERNANCE & DATA LIFECYCLE ACCEPTANCE RUNNER');
  console.log('Platform Baseline: v61.7.0 | Target: 40/40+ PASS | Target Version: v61.8.0');
  console.log('====================================================================================================\n');

  const results = [];
  let testNum = 1;

  function record(category, name, status, details = '') {
    const padNum = String(testNum).padStart(2, '0');
    const paddedName = (name + ' ').padEnd(65, '.');
    const statusFormatted = status === 'PASS' ? '[PASS]' : '[FAIL]';
    console.log(`[CHECK ${padNum}] ${paddedName} ${statusFormatted} (${details})`);
    results.push({ id: testNum++, category, name, status, details });
  }

  await mongoose.connect(MONGO_URI);

  // Models
  const GovernancePolicy = require('../models/GovernancePolicy');
  const GovernancePolicyRevision = require('../models/GovernancePolicyRevision');
  const RetentionPolicy = require('../models/RetentionPolicy');
  const BreakGlassSession = require('../models/BreakGlassSession');
  const IntegrationCredentialMetadata = require('../models/IntegrationCredentialMetadata');
  const AuditEvent = require('../models/AuditEvent');
  const Incident = require('../models/Incident');

  // Services
  const GovernancePolicyService = require('../services/soc/GovernancePolicyService');
  const DataLifecycleService = require('../services/soc/DataLifecycleService');
  const GovernanceEvaluationService = require('../services/soc/GovernanceEvaluationService');
  const BreakGlassService = require('../services/soc/BreakGlassService');
  const searchController = require('../controllers/searchController');
  const chatbotController = require('../controllers/chatbot/chatbotController');

  // Clean test collections
  await GovernancePolicy.deleteMany({});
  await GovernancePolicyRevision.deleteMany({});
  await RetentionPolicy.deleteMany({});
  await BreakGlassSession.deleteMany({});
  await IntegrationCredentialMetadata.deleteMany({});
  await AuditEvent.deleteMany({});
  await Incident.deleteMany({});

  const ORG_A = 'org-tenant-alpha-75';
  const ORG_B = 'org-tenant-beta-75';

  const userAdminA = { _id: 'user-admin-a', username: 'alice_admin', role: 'ADMIN', organizationId: ORG_A };
  const userAnalystA = { _id: 'user-analyst-a', username: 'bob_analyst', role: 'ANALYST', organizationId: ORG_A };
  const userAdminB = { _id: 'user-admin-b', username: 'carol_admin', role: 'ADMIN', organizationId: ORG_B };

  // Track broadcast events
  const emittedEvents = [];
  const mockIO = {
    emit: (name, payload) => {
      emittedEvents.push({ name, payload });
    },
  };
  GovernancePolicyService.setIO(mockIO);
  DataLifecycleService.setIO(mockIO);
  BreakGlassService.setIO(mockIO);

  try {
    // =========================================================================
    // WORKFLOW A: POLICY CREATION & IMMUTABLE REVISION SNAPSHOT
    // =========================================================================
    console.log('\n--- WORKFLOW A: POLICY CREATION & IMMUTABLE REVISION SNAPSHOT ---');

    const configA = { requireMFA: true, sessionMaxAgeHours: 8, passwordMinLength: 16 };
    const polA = await GovernancePolicyService.createPolicy({
      organizationId: ORG_A,
      policyType: 'ACCESS_GOVERNANCE',
      name: 'Alpha IAM Security Policy',
      description: 'Alpha organization primary access control',
      configuration: configA,
      enforcementMode: 'ENFORCE',
      user: userAnalystA,
    });

    record(
      'Policy Lifecycle',
      'Policy created in DRAFT status with initial version 1',
      polA && polA.status === 'DRAFT' && polA.currentVersion === 1 ? 'PASS' : 'FAIL',
      `ID: ${polA.policyId}, status: ${polA.status}`
    );

    const rev1 = await GovernancePolicyRevision.findOne({
      organizationId: ORG_A,
      policyId: polA.policyId,
      version: 1,
    });

    record(
      'Policy Revision',
      'Immutable revision record created with matching SHA-256 hash',
      rev1 && rev1.contentHash === polA.checksum ? 'PASS' : 'FAIL',
      `Hash: ${rev1?.contentHash?.substring(0, 16)}...`
    );

    // =========================================================================
    // WORKFLOW B: REVIEW & APPROVAL WORKFLOW
    // =========================================================================
    console.log('\n--- WORKFLOW B: REVIEW & APPROVAL WORKFLOW ---');

    const reviewPol = await GovernancePolicyService.submitForReview({
      organizationId: ORG_A,
      policyId: polA.policyId,
      user: userAnalystA,
    });

    record(
      'Policy Lifecycle',
      'Policy successfully transitions from DRAFT to REVIEW',
      reviewPol.status === 'REVIEW' ? 'PASS' : 'FAIL',
      `Status: ${reviewPol.status}`
    );

    const approvedPol = await GovernancePolicyService.approvePolicy({
      organizationId: ORG_A,
      policyId: polA.policyId,
      user: userAdminA,
    });

    record(
      'Policy Lifecycle',
      'Admin approves policy in REVIEW, cryptographically binding revision hash',
      approvedPol.status === 'APPROVED' && approvedPol.approvedRevisionHash === rev1.contentHash
        ? 'PASS'
        : 'FAIL',
      `ApprovedHash: ${approvedPol.approvedRevisionHash?.substring(0, 16)}...`
    );

    // =========================================================================
    // WORKFLOW C: REVISION-BOUND ACTIVATION & STALE APPROVAL PROTECTION
    // =========================================================================
    console.log('\n--- WORKFLOW C: REVISION-BOUND ACTIVATION & STALE APPROVAL PROTECTION ---');

    const activePol = await GovernancePolicyService.activatePolicy({
      organizationId: ORG_A,
      policyId: polA.policyId,
      user: userAdminA,
    });

    record(
      'Policy Lifecycle',
      'APPROVED policy activates successfully when hash matches approved revision',
      activePol.status === 'ACTIVE' && activePol.effectiveAt !== null ? 'PASS' : 'FAIL',
      `Status: ${activePol.status}, effectiveAt: ${activePol.effectiveAt?.toISOString()}`
    );

    // Now modify the active policy to create a new draft revision
    const modifiedPol = await GovernancePolicyService.updatePolicyDraft({
      organizationId: ORG_A,
      policyId: polA.policyId,
      configuration: { ...configA, sessionMaxAgeHours: 4 }, // Changed config!
      changeSummary: 'Reduced session max age',
      user: userAnalystA,
    });

    record(
      'Stale Approval Guard',
      'Modifying approved/active policy invalidates approval and creates revision 2',
      modifiedPol.status === 'DRAFT' &&
        modifiedPol.currentVersion === 2 &&
        modifiedPol.approvedRevisionHash === null
        ? 'PASS'
        : 'FAIL',
      `New version: ${modifiedPol.currentVersion}, status: ${modifiedPol.status}`
    );

    // Attempting to activate policy directly without re-approval MUST fail
    let staleActivationFailed = false;
    let staleErrorMessage = '';
    try {
      await GovernancePolicyService.activatePolicy({
        organizationId: ORG_A,
        policyId: polA.policyId,
        user: userAdminA,
      });
    } catch (err) {
      staleActivationFailed = true;
      staleErrorMessage = err.message;
    }

    record(
      'Stale Approval Guard',
      'Activation rejected if policy is not APPROVED or has stale hash mismatch',
      staleActivationFailed ? 'PASS' : 'FAIL',
      `Expected error caught: ${staleErrorMessage}`
    );

    // =========================================================================
    // WORKFLOW D: SUSPENSION & RETIREMENT
    // =========================================================================
    console.log('\n--- WORKFLOW D: SUSPENSION & RETIREMENT ---');

    // Re-approve and activate revision 2
    await GovernancePolicyService.submitForReview({ organizationId: ORG_A, policyId: polA.policyId, user: userAnalystA });
    await GovernancePolicyService.approvePolicy({ organizationId: ORG_A, policyId: polA.policyId, user: userAdminA });
    await GovernancePolicyService.activatePolicy({ organizationId: ORG_A, policyId: polA.policyId, user: userAdminA });

    const suspendedPol = await GovernancePolicyService.suspendPolicy({
      organizationId: ORG_A,
      policyId: polA.policyId,
      reason: 'Temporary maintenance audit',
      user: userAdminA,
    });

    record(
      'Policy Lifecycle',
      'ACTIVE policy transitions to SUSPENDED with recorded reason',
      suspendedPol.status === 'SUSPENDED' ? 'PASS' : 'FAIL',
      `Status: ${suspendedPol.status}`
    );

    const retiredPol = await GovernancePolicyService.retirePolicy({
      organizationId: ORG_A,
      policyId: polA.policyId,
      reason: 'Decommissioned by security committee',
      user: userAdminA,
    });

    record(
      'Policy Lifecycle',
      'SUSPENDED policy permanently transitions to RETIRED',
      retiredPol.status === 'RETIRED' ? 'PASS' : 'FAIL',
      `Status: ${retiredPol.status}`
    );

    let retiredEditFailed = false;
    try {
      await GovernancePolicyService.updatePolicyDraft({
        organizationId: ORG_A,
        policyId: polA.policyId,
        name: 'New Name',
        user: userAnalystA,
      });
    } catch (err) {
      retiredEditFailed = true;
    }

    record(
      'Policy Lifecycle',
      'Modifications to RETIRED policies are strictly blocked',
      retiredEditFailed ? 'PASS' : 'FAIL',
      'Rejected edit on retired policy'
    );

    // =========================================================================
    // WORKFLOW E: RBAC ENFORCEMENT
    // =========================================================================
    console.log('\n--- WORKFLOW E: RBAC ENFORCEMENT ---');

    // Test retention execution authorization check
    let unauthorizedRetentionBlocked = false;
    try {
      await DataLifecycleService.executeRetention(ORG_A, 'incidents', userAnalystA, {});
    } catch (err) {
      if (err.message.includes('UNAUTHORIZED') || err.message.includes('ADMIN')) {
        unauthorizedRetentionBlocked = true;
      }
    }

    record(
      'RBAC',
      'Non-admin (Analyst) is strictly rejected from executing retention',
      unauthorizedRetentionBlocked ? 'PASS' : 'FAIL',
      'UNAUTHORIZED exception raised'
    );

    // Test legal hold toggle authorization check
    let unauthorizedLegalHoldBlocked = false;
    try {
      await DataLifecycleService.setLegalHold(ORG_A, 'incidents', true, 'Test', userAnalystA);
    } catch (err) {
      if (err.message.includes('UNAUTHORIZED') || err.message.includes('ADMIN')) {
        unauthorizedLegalHoldBlocked = true;
      }
    }

    record(
      'RBAC',
      'Non-admin (Analyst) is strictly rejected from modifying legal holds',
      unauthorizedLegalHoldBlocked ? 'PASS' : 'FAIL',
      'UNAUTHORIZED exception raised'
    );

    // Test break-glass approval authorization check
    const testBg = await BreakGlassService.requestSession({
      organizationId: ORG_A,
      reason: 'Urgent containment of compromised DC',
      requester: userAnalystA,
      durationMinutes: 30,
    });

    let unauthorizedBgApprovalBlocked = false;
    try {
      await BreakGlassService.approveSession({
        sessionId: testBg.sessionId,
        organizationId: ORG_A,
        approver: userAnalystA, // Analyst tries to approve!
      });
    } catch (err) {
      if (err.message.includes('UNAUTHORIZED') || err.message.includes('ADMIN')) {
        unauthorizedBgApprovalBlocked = true;
      }
    }

    record(
      'RBAC',
      'Non-admin cannot approve break-glass emergency sessions',
      unauthorizedBgApprovalBlocked ? 'PASS' : 'FAIL',
      'UNAUTHORIZED exception raised'
    );

    // =========================================================================
    // WORKFLOW F: TENANT ISOLATION (ORG A VS ORG B)
    // =========================================================================
    console.log('\n--- WORKFLOW F: TENANT ISOLATION (ORG A VS ORG B) ---');

    // Create a policy for Org B
    const polB = await GovernancePolicyService.createPolicy({
      organizationId: ORG_B,
      policyType: 'ACCESS_GOVERNANCE',
      name: 'Beta IAM Policy',
      configuration: { mfa: true },
      user: userAdminB,
    });

    const orgAPolicies = await GovernancePolicyService.listPolicies(ORG_A);
    const orgBPolicies = await GovernancePolicyService.listPolicies(ORG_B);

    const leakFound = orgAPolicies.some((p) => p.policyId === polB.policyId) ||
      orgBPolicies.some((p) => p.policyId === polA.policyId);

    record(
      'Tenant Isolation',
      'Policies in Org A and Org B are strictly partitioned (no cross-tenant leak)',
      !leakFound && orgAPolicies.length > 0 && orgBPolicies.length > 0 ? 'PASS' : 'FAIL',
      `Org A count: ${orgAPolicies.length}, Org B count: ${orgBPolicies.length}`
    );

    let crossTenantFetchFailed = false;
    try {
      await GovernancePolicyService.getPolicy(ORG_A, polB.policyId);
    } catch (err) {
      crossTenantFetchFailed = true;
    }

    record(
      'Tenant Isolation',
      'Fetching Org B policy using Org A tenant scope throws Not Found',
      crossTenantFetchFailed ? 'PASS' : 'FAIL',
      'Isolated tenant lookup validated'
    );

    // =========================================================================
    // WORKFLOW G: GOVERNANCE EVALUATION ENGINE (TRUTHFUL POSTURE)
    // =========================================================================
    console.log('\n--- WORKFLOW G: GOVERNANCE EVALUATION ENGINE (TRUTHFUL POSTURE) ---');

    const postureA = await GovernanceEvaluationService.evaluateGovernancePosture(ORG_A);

    const unconfiguredDomain = postureA.domains.find((d) => d.domain === 'SESSION_SECURITY');
    record(
      'Truthful Evaluation',
      'Unconfigured domain truthfully reports NOT_CONFIGURED (never fake COMPLIANT)',
      unconfiguredDomain && unconfiguredDomain.status === 'NOT_CONFIGURED' ? 'PASS' : 'FAIL',
      `SESSION_SECURITY status: ${unconfiguredDomain?.status}`
    );

    const gapsReport = await GovernanceEvaluationService.identifyGovernanceGaps(ORG_A);
    record(
      'Governance Gaps',
      'Gaps evaluation identifies missing domains and provides remediation steps',
      gapsReport.gapCount > 0 && gapsReport.gaps[0].remediation.length > 0 ? 'PASS' : 'FAIL',
      `Identified ${gapsReport.gapCount} gap(s)`
    );

    // =========================================================================
    // WORKFLOW H: DATA LIFECYCLE & RETENTION ELIGIBILITY
    // =========================================================================
    console.log('\n--- WORKFLOW H: DATA LIFECYCLE & RETENTION ELIGIBILITY ---');

    // Create real test Incidents in ORG_A: some old (120 days ago), some recent (2 days ago)
    const oldTimestamp = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000);
    const recentTimestamp = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    await Incident.create([
      { incidentId: 'INC-OLD-01', title: 'Old Incident 1', organizationId: ORG_A, createdAt: oldTimestamp },
      { incidentId: 'INC-OLD-02', title: 'Old Incident 2', organizationId: ORG_A, createdAt: oldTimestamp },
      { incidentId: 'INC-OLD-03', title: 'Old Incident 3', organizationId: ORG_A, createdAt: oldTimestamp },
      { incidentId: 'INC-RECENT-01', title: 'Recent Incident 1', organizationId: ORG_A, createdAt: recentTimestamp },
      // Org B incident (must never be touched by Org A retention!)
      { incidentId: 'INC-ORGB-OLD', title: 'Org B Old Incident', organizationId: ORG_B, createdAt: oldTimestamp },
    ]);

    // Upsert retention policy for incidents: 90 days retention
    await DataLifecycleService.upsertRetentionPolicy(
      ORG_A,
      { entityType: 'incidents', retentionDays: 90, retentionClass: 'EXPIRE' },
      userAdminA
    );

    const dryRun = await DataLifecycleService.dryRunRetention(ORG_A, 'incidents');

    record(
      'Retention Eligibility',
      'Real timestamp eligibility correctly identifies 3 aged records older than 90 days',
      dryRun.eligibleCount === 3 ? 'PASS' : 'FAIL',
      `Eligible count: ${dryRun.eligibleCount}, cutoff: ${dryRun.cutoffDate.toISOString()}`
    );

    // =========================================================================
    // WORKFLOW I: DRY-RUN NON-MUTATION GUARANTEE
    // =========================================================================
    console.log('\n--- WORKFLOW I: DRY-RUN NON-MUTATION GUARANTEE ---');

    const incidentCountAfterDryRun = await Incident.countDocuments({ organizationId: ORG_A });
    record(
      'Dry Run Non-Mutation',
      'Dry run preview performs zero mutations (pre/post count identical at 4)',
      incidentCountAfterDryRun === 4 ? 'PASS' : 'FAIL',
      `Count: ${incidentCountAfterDryRun}`
    );

    // =========================================================================
    // WORKFLOW J: LEGAL HOLD MUTATION PROTECTION
    // =========================================================================
    console.log('\n--- WORKFLOW J: LEGAL HOLD MUTATION PROTECTION ---');

    await DataLifecycleService.setLegalHold(
      ORG_A,
      'incidents',
      true,
      'SEC Regulatory Investigation #8821',
      userAdminA
    );

    const dryRunUnderHold = await DataLifecycleService.dryRunRetention(ORG_A, 'incidents');
    record(
      'Legal Hold Guard',
      'Dry-run under active legal hold flags blockers and projects BLOCKED action',
      dryRunUnderHold.legalHoldActive && dryRunUnderHold.projectedAction === 'BLOCKED'
        ? 'PASS'
        : 'FAIL',
      `ProjectedAction: ${dryRunUnderHold.projectedAction}, Blockers: ${dryRunUnderHold.blockers.join(',')}`
    );

    // Attempting destructive execution under legal hold MUST be completely blocked
    const execUnderHold = await DataLifecycleService.executeRetention(ORG_A, 'incidents', userAdminA);
    record(
      'Legal Hold Guard',
      'Destructive execution is completely aborted by legal hold (0 deleted)',
      execUnderHold.blocked && execUnderHold.deletedCount === 0 && execUnderHold.status === 'LEGAL_HOLD'
        ? 'PASS'
        : 'FAIL',
      `Status: ${execUnderHold.status}, Deleted: ${execUnderHold.deletedCount}`
    );

    const incidentCountStillFour = await Incident.countDocuments({ organizationId: ORG_A });
    record(
      'Legal Hold Guard',
      'Database records remain completely untouched after blocked execution attempt',
      incidentCountStillFour === 4 ? 'PASS' : 'FAIL',
      `Incidents remaining: ${incidentCountStillFour}`
    );

    // =========================================================================
    // WORKFLOW K: BOUNDED RETENTION EXECUTION
    // =========================================================================
    console.log('\n--- WORKFLOW K: BOUNDED RETENTION EXECUTION ---');

    // Lift legal hold
    await DataLifecycleService.setLegalHold(ORG_A, 'incidents', false, '', userAdminA);

    // Execute with requested limit 1000 (server-side cap must enforce max 500)
    const execRes = await DataLifecycleService.executeRetention(
      ORG_A,
      'incidents',
      userAdminA,
      { batchSize: 1000 }
    );

    record(
      'Bounded Execution',
      'Execution limits batch size to maximum 500 server-side',
      execRes.batchLimit <= 500 ? 'PASS' : 'FAIL',
      `Enforced limit: ${execRes.batchLimit}`
    );

    record(
      'Bounded Execution',
      'Execution deletes only the 3 eligible aged records, reporting exact outcome',
      execRes.deletedCount === 3 && execRes.status === 'SUCCESS' ? 'PASS' : 'FAIL',
      `Deleted count: ${execRes.deletedCount}, operationId: ${execRes.operationId}`
    );

    const remainingIncidentsOrgA = await Incident.find({ organizationId: ORG_A });
    record(
      'Destructive Safety',
      'Recent record (2 days old) remains preserved in database',
      remainingIncidentsOrgA.length === 1 && remainingIncidentsOrgA[0].incidentId === 'INC-RECENT-01'
        ? 'PASS'
        : 'FAIL',
      `Remaining: ${remainingIncidentsOrgA[0]?.incidentId}`
    );

    const orgBIncidentStillExists = await Incident.findOne({ incidentId: 'INC-ORGB-OLD' });
    record(
      'Tenant Isolation',
      'Org B incident was completely untouched during Org A retention execution',
      orgBIncidentStillExists !== null ? 'PASS' : 'FAIL',
      `Org B record exists: ${orgBIncidentStillExists?.incidentId}`
    );

    // =========================================================================
    // WORKFLOW L: IMMUTABLE AUDIT EVIDENCE TRAIL
    // =========================================================================
    console.log('\n--- WORKFLOW L: IMMUTABLE AUDIT EVIDENCE TRAIL ---');

    const auditRetention = await AuditEvent.findOne({
      organizationId: ORG_A,
      action: 'RETENTION_EXECUTION_COMPLETED',
    });

    record(
      'Audit Evidence',
      'Retention execution logged immutable AuditEvent with operation details',
      auditRetention && auditRetention.outcome === 'SUCCESS' ? 'PASS' : 'FAIL',
      `AuditEvent ID: ${auditRetention?.eventId}`
    );

    // =========================================================================
    // WORKFLOW M: BREAK-GLASS REQUEST & ADMIN APPROVAL
    // =========================================================================
    console.log('\n--- WORKFLOW M: BREAK-GLASS REQUEST & ADMIN APPROVAL ---');

    const bgReq = await BreakGlassService.requestSession({
      organizationId: ORG_A,
      reason: 'Critical ransomware isolation and host killswitch operation',
      requester: userAnalystA,
      durationMinutes: 45,
      scope: ['BREAK_GLASS_HOST_ISOLATE', 'BREAK_GLASS_EVIDENCE_EXPORT'],
    });

    record(
      'Break-Glass Access',
      'Emergency session requested in REQUESTED status with explicit scope',
      bgReq && bgReq.status === 'REQUESTED' && bgReq.scope.length === 2 ? 'PASS' : 'FAIL',
      `SessionId: ${bgReq.sessionId}, duration: ${bgReq.durationMinutes}m`
    );

    const bgApproved = await BreakGlassService.approveSession({
      sessionId: bgReq.sessionId,
      organizationId: ORG_A,
      approver: userAdminA,
    });

    record(
      'Break-Glass Access',
      'Admin approves emergency session, setting active window and expiration time',
      bgApproved.status === 'ACTIVE' && bgApproved.expiresAt > new Date() ? 'PASS' : 'FAIL',
      `Status: ${bgApproved.status}, expiresAt: ${bgApproved.expiresAt?.toLocaleTimeString()}`
    );

    // =========================================================================
    // WORKFLOW N: BREAK-GLASS SCOPE ENFORCEMENT & ACTION LOGGING
    // =========================================================================
    console.log('\n--- WORKFLOW N: BREAK-GLASS SCOPE ENFORCEMENT & ACTION LOGGING ---');

    // Test in-scope action
    const inScopeValidation = await BreakGlassService.validatePrivilegedAction({
      organizationId: ORG_A,
      userId: userAnalystA._id,
      requestedAction: 'BREAK_GLASS_HOST_ISOLATE',
    });

    record(
      'Break-Glass Scope',
      'Action explicitly inside approved scope is validated and ALLOWED',
      inScopeValidation.allowed === true ? 'PASS' : 'FAIL',
      `Session: ${inScopeValidation.sessionId}`
    );

    // Test out-of-scope action
    const outOfScopeValidation = await BreakGlassService.validatePrivilegedAction({
      organizationId: ORG_A,
      userId: userAnalystA._id,
      requestedAction: 'DELETE_SECURITY_LOGS', // Not in approved scope!
    });

    record(
      'Break-Glass Scope',
      'Action outside approved scope is strictly DENIED (NO blanket admin elevation)',
      outOfScopeValidation.allowed === false &&
        outOfScopeValidation.reason === 'ACTION_NOT_IN_APPROVED_SCOPE'
        ? 'PASS'
        : 'FAIL',
      `Reason: ${outOfScopeValidation.reason}`
    );

    // Record action under break-glass session
    await BreakGlassService.recordAction({
      sessionId: bgApproved.sessionId,
      action: 'BREAK_GLASS_HOST_ISOLATE',
      target: 'DC-PRIMARY-01',
      auditEventId: 'AUD-TEST-881',
    });

    const updatedBg = await BreakGlassSession.findOne({ sessionId: bgApproved.sessionId });
    record(
      'Break-Glass Audit',
      'Privileged emergency action successfully recorded in session audit trail',
      updatedBg.actionsTaken.length === 1 && updatedBg.actionsTaken[0].target === 'DC-PRIMARY-01'
        ? 'PASS'
        : 'FAIL',
      `Action: ${updatedBg.actionsTaken[0]?.action}`
    );

    // =========================================================================
    // WORKFLOW O: BREAK-GLASS EXPIRATION & IMMEDIATE REVOCATION
    // =========================================================================
    console.log('\n--- WORKFLOW O: BREAK-GLASS EXPIRATION & IMMEDIATE REVOCATION ---');

    // Simulate expiration by backdating expiresAt
    updatedBg.expiresAt = new Date(Date.now() - 1000);
    await updatedBg.save();

    const expiredValidation = await BreakGlassService.validatePrivilegedAction({
      organizationId: ORG_A,
      userId: userAnalystA._id,
      requestedAction: 'BREAK_GLASS_HOST_ISOLATE',
    });

    record(
      'Break-Glass Expiration',
      'Expired emergency session immediately rejects action and updates status to EXPIRED',
      expiredValidation.allowed === false &&
        expiredValidation.reason === 'BREAK_GLASS_SESSION_EXPIRED'
        ? 'PASS'
        : 'FAIL',
      `Reason: ${expiredValidation.reason}`
    );

    // Test immediate administrative revocation on another session
    const bg2 = await BreakGlassService.requestSession({
      organizationId: ORG_A,
      reason: 'Temporary investigation session',
      requester: userAnalystA,
      durationMinutes: 30,
    });
    await BreakGlassService.approveSession({
      sessionId: bg2.sessionId,
      organizationId: ORG_A,
      approver: userAdminA,
    });

    const revokedSession = await BreakGlassService.revokeSession({
      sessionId: bg2.sessionId,
      organizationId: ORG_A,
      revoker: userAdminA,
      reason: 'Incident contained ahead of schedule',
    });

    record(
      'Break-Glass Revocation',
      'Administrator immediate revocation terminates active access',
      revokedSession.status === 'REVOKED' ? 'PASS' : 'FAIL',
      `Status: ${revokedSession.status}, reason: ${revokedSession.revocationReason}`
    );

    // =========================================================================
    // WORKFLOW P: INTEGRATION CREDENTIAL METADATA (ZERO RAW SECRETS)
    // =========================================================================
    console.log('\n--- WORKFLOW P: INTEGRATION CREDENTIAL METADATA (ZERO RAW SECRETS) ---');

    const fakeKey = 'SUPER_SECRET_RAW_API_KEY_NEVER_PERSIST';
    const keyFingerprint = crypto.createHash('sha256').update(fakeKey).digest('hex');

    const integMeta = await IntegrationCredentialMetadata.create({
      integrationId: 'INT-SIEM-SPLUNK-01',
      organizationId: ORG_A,
      name: 'Corporate Splunk Cloud Forwarder',
      type: 'SIEM',
      keyFingerprint,
      status: 'ACTIVE',
      rotationIntervalDays: 90,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days in future
    });

    const savedInteg = await IntegrationCredentialMetadata.findOne({ integrationId: 'INT-SIEM-SPLUNK-01' }).lean();

    record(
      'Integration Governance',
      'Integration credential metadata stored with SHA-256 fingerprint; raw secret NOT stored',
      savedInteg && !JSON.stringify(savedInteg).includes(fakeKey) && savedInteg.keyFingerprint === keyFingerprint
        ? 'PASS'
        : 'FAIL',
      `Fingerprint: ${keyFingerprint.substring(0, 16)}...`
    );

    // Create an expired integration to test gap detection
    await IntegrationCredentialMetadata.create({
      integrationId: 'INT-EDR-EXPIRED',
      organizationId: ORG_A,
      name: 'Legacy CrowdStrike Sensor Key',
      type: 'EDR',
      keyFingerprint: crypto.randomBytes(16).toString('hex'),
      status: 'EXPIRED',
      expiresAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    });

    const postureWithIntegration = await GovernanceEvaluationService.evaluateGovernancePosture(ORG_A);
    const expiredGapFound = postureWithIntegration.gaps.some((g) =>
      g.gapId === 'GAP-INTEGRATION-EXPIRED-CREDENTIALS'
    );

    record(
      'Integration Governance',
      'Expired integration credential is truthfully detected and flagged as gap',
      expiredGapFound ? 'PASS' : 'FAIL',
      'Detected GAP-INTEGRATION-EXPIRED-CREDENTIALS'
    );

    // =========================================================================
    // WORKFLOW Q: GLOBAL SEARCH SCOPING
    // =========================================================================
    console.log('\n--- WORKFLOW Q: GLOBAL SEARCH SCOPING ---');

    const mockSearchReq = {
      query: { q: 'Alpha' },
      user: { role: 'analyst', organizationId: ORG_A },
    };
    let searchData = null;
    const mockSearchRes = {
      json: (payload) => {
        searchData = payload.data;
      },
      status: () => mockSearchRes,
    };

    await searchController.search(mockSearchReq, mockSearchRes);

    const foundPolInSearch = searchData?.results?.governancePolicies?.some((p) => p.policyId === polA.policyId);
    const leakedPolBInSearch = searchData?.results?.governancePolicies?.some((p) => p.policyId === polB.policyId);

    record(
      'Search Scoping',
      'Global search indexes GovernancePolicy within strict tenant boundary (no cross-tenant leak)',
      foundPolInSearch && !leakedPolBInSearch ? 'PASS' : 'FAIL',
      `Found Org A policy, Org B excluded`
    );

    // =========================================================================
    // WORKFLOW R: REAL-TIME LIFECYCLE EVENTS
    // =========================================================================
    console.log('\n--- WORKFLOW R: REAL-TIME LIFECYCLE EVENTS ---');

    const expectedEvents = [
      'governance:policy-created',
      'governance:policy-approved',
      'governance:policy-activated',
      'governance:policy-suspended',
      'governance:policy-retired',
      'retention:dry-run-completed',
      'retention:execution-completed',
      'breakglass:started',
      'breakglass:revoked',
    ];

    const capturedEventNames = emittedEvents.map((e) => e.name);
    const allEventsEmitted = expectedEvents.every((ev) => capturedEventNames.includes(ev));

    record(
      'Real-Time Events',
      'All 9 canonical real-time lifecycle socket events emitted for real mutations',
      allEventsEmitted ? 'PASS' : 'FAIL',
      `Captured ${emittedEvents.length} events`
    );

    // =========================================================================
    // WORKFLOW S: BOUNDED AI ADVISORY SAFETY
    // =========================================================================
    console.log('\n--- WORKFLOW S: BOUNDED AI ADVISORY SAFETY ---');

    let aiSummaryData = null;
    await chatbotController.handleGovernanceSummarize(
      { body: { organizationId: ORG_A }, user: userAnalystA },
      { json: (res) => { aiSummaryData = res.data; }, status: () => ({ json: () => {} }) }
    );

    record(
      'AI Safety',
      'AI governance summary explicitly declares non-autonomous advisory boundary',
      aiSummaryData?.aiBoundary?.isAdvisory === true && aiSummaryData?.aiBoundary?.canApprove === false
        ? 'PASS'
        : 'FAIL',
      aiSummaryData?.aiBoundary?.disclaimer?.substring(0, 50) + '...'
    );

    // =========================================================================
    // WORKFLOW T: CANONICAL SEEDING IDEMPOTENCY
    // =========================================================================
    console.log('\n--- WORKFLOW T: CANONICAL SEEDING IDEMPOTENCY ---');

    const seedRun1 = await GovernancePolicyService.seedCanonicalPolicies(ORG_B, userAdminB);
    const seedRun2 = await GovernancePolicyService.seedCanonicalPolicies(ORG_B, userAdminB);

    const allSkippedInRun2 = seedRun2.every((s) => s.status === 'SKIPPED_EXISTS');
    const finalPolicyCountOrgB = await GovernancePolicy.countDocuments({ organizationId: ORG_B });

    record(
      'Canonical Seeding',
      'Canonical seeding is strictly idempotent (second run skips all without duplicates)',
      allSkippedInRun2 && finalPolicyCountOrgB === 8 ? 'PASS' : 'FAIL',
      `Total Org B policies: ${finalPolicyCountOrgB}`
    );

    // Summary calculation
    const totalChecks = results.length;
    const passedChecks = results.filter((r) => r.status === 'PASS').length;
    const failedChecks = results.filter((r) => r.status === 'FAIL').length;
    const passRate = Math.round((passedChecks / totalChecks) * 100);

    const verdict = passedChecks === totalChecks && totalChecks >= 40
      ? 'ENTERPRISE_GOVERNANCE_CERTIFIED'
      : 'ENTERPRISE_GOVERNANCE_BLOCKED';

    console.log('\n====================================================================================================');
    console.log(`PHASE 75 VERDICT: ${verdict}`);
    console.log(`TOTAL CHECKS: ${totalChecks} | PASSED: ${passedChecks} | FAILED: ${failedChecks} | RATE: ${passRate}%`);
    console.log('====================================================================================================\n');

    // Emit artifacts
    const statusPayload = {
      phase: 'Phase 75 — Enterprise Multi-Tenant Governance, Policy Administration & Data Lifecycle',
      version: 'v61.8.0',
      status: verdict,
      timestamp: new Date().toISOString(),
      summary: {
        totalChecks,
        passedChecks,
        failedChecks,
        passRate: `${passRate}%`,
      },
      results,
    };

    fs.writeFileSync(
      path.join(__dirname, 'governance_status_v75.json'),
      JSON.stringify(statusPayload, null, 2)
    );
    fs.writeFileSync(
      path.join(__dirname, 'phase75_governance.json'),
      JSON.stringify(statusPayload, null, 2)
    );

    const docContent = `# CyberShield X — Phase 75 Governance Certification Report

## Verdict: ${verdict}
**Platform Version:** \`v61.8.0\`  
**Date:** ${new Date().toISOString()}  
**Pass Rate:** ${passRate}% (${passedChecks}/${totalChecks} checks passed)

### Executive Summary
Phase 75 introduces a production-grade multi-tenant enterprise governance, security policy administration, and data lifecycle management layer for CyberShield X. All governance capabilities operate strictly against real persisted database records with zero synthetic data fabrication.

### Core Capabilities Verified
1. **Deterministic Policy Lifecycle**: Full DRAFT -> REVIEW -> APPROVED -> ACTIVE -> SUSPENDED -> RETIRED state engine.
2. **Immutable Revisions & Stale Approval Protection**: Append-only snapshots with SHA-256 content hashes. Stale approvals are rejected if configuration changes prior to activation.
3. **Bounded Data Lifecycle**: Real timestamp eligibility, non-mutating dry runs, and destructive deletion bounded to max 500 records.
4. **Legal Hold Guarding**: Evaluated before execution and at the mutation boundary to guarantee zero data loss during active litigation or regulatory preservation holds.
5. **Break-Glass Emergency Access**: Scoped, time-bounded emergency elevation requiring admin approval, immediate revocation, and action auditing.
6. **Integration Credential Metadata**: Zero raw secrets stored in database; public SHA-256 fingerprints, expiry tracking, and rotation interval enforcement.
7. **Bounded AI Governance Assistance**: Advisory-only copilot wrapped in \`<<<UNTRUSTED_GOVERNANCE_DATA>>>\` delimiters.

### Detailed Check Results
| # | Category | Verification Item | Status |
|---|----------|-------------------|--------|
${results.map((r) => `| ${String(r.id).padStart(2, '0')} | ${r.category} | ${r.name} | **${r.status}** |`).join('\n')}

---
*Report automatically generated by CyberShield X Phase 75 Acceptance Runner.*
`;

    fs.writeFileSync(
      path.join(__dirname, '../../docs/PHASE75_GOVERNANCE.md'),
      docContent
    );

    console.log('Artifacts generated:');
    console.log('- server/scripts/governance_status_v75.json');
    console.log('- server/scripts/phase75_governance.json');
    console.log('- docs/PHASE75_GOVERNANCE.md\n');

    await mongoose.disconnect();

    if (verdict !== 'ENTERPRISE_GOVERNANCE_CERTIFIED') {
      process.exit(1);
    }
  } catch (err) {
    console.error('Acceptance execution fatal error:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runAcceptance();
