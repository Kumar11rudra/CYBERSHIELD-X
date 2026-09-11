/**
 * 🛡️ CyberShield X — Enterprise Governance Routes (Phase 75)
 *
 * REST Endpoints for Multi-Tenant Governance, Policy Lifecycle,
 * Immutable Revisions, Data Retention, Legal Holds, Break-Glass Emergency Access,
 * and Integration Credential Governance.
 */

const express = require('express');
const router = express.Router();
const governanceController = require('../controllers/governanceController');
const { authenticate } = require('../middleware/auth');
const { requireMinimumRole } = require('../middleware/rbac');

// All governance endpoints require authenticated identity
router.use(authenticate);

// ==========================================
// 1. POLICY ADMINISTRATION & REVISIONS
// ==========================================

// Read policies & revisions (Viewer+)
router.get('/policies', requireMinimumRole('viewer'), governanceController.listPolicies);
router.get('/policies/:policyId', requireMinimumRole('viewer'), governanceController.getPolicy);
router.get('/policies/:policyId/revisions', requireMinimumRole('viewer'), governanceController.getRevisions);
router.get('/policies/:policyId/revisions/:version', requireMinimumRole('viewer'), governanceController.getRevision);

// Policy creation & draft updates (Analyst+)
router.post('/policies', requireMinimumRole('analyst'), governanceController.createPolicy);
router.put('/policies/:policyId', requireMinimumRole('analyst'), governanceController.updatePolicy);
router.post('/policies/:policyId/review', requireMinimumRole('analyst'), governanceController.submitForReview);

// Canonical seeding (Operator / Admin)
router.post('/policies/seed-canonical', requireMinimumRole('operator'), governanceController.seedCanonicalPolicies);

// Policy approval, activation, suspension, retirement (Admin ONLY)
router.post('/policies/:policyId/approve', requireMinimumRole('admin'), governanceController.approvePolicy);
router.post('/policies/:policyId/activate', requireMinimumRole('admin'), governanceController.activatePolicy);
router.post('/policies/:policyId/suspend', requireMinimumRole('admin'), governanceController.suspendPolicy);
router.post('/policies/:policyId/retire', requireMinimumRole('admin'), governanceController.retirePolicy);

// ==========================================
// 2. GOVERNANCE POSTURE & GAPS
// ==========================================

router.get('/posture', requireMinimumRole('viewer'), governanceController.getPosture);
router.get('/gaps', requireMinimumRole('viewer'), governanceController.getGaps);

// ==========================================
// 3. RETENTION & DATA LIFECYCLE
// ==========================================

// Retention policies & non-mutating dry run (Viewer / Analyst)
router.get('/retention', requireMinimumRole('viewer'), governanceController.listRetentionPolicies);
router.post('/retention/dry-run', requireMinimumRole('analyst'), governanceController.dryRunRetention);

// Retention policy management & bounded execution (Admin ONLY)
router.post('/retention', requireMinimumRole('admin'), governanceController.upsertRetentionPolicy);
router.post('/retention/execute', requireMinimumRole('admin'), governanceController.executeRetention);
router.post('/retention/legal-hold', requireMinimumRole('admin'), governanceController.setLegalHold);

// ==========================================
// 4. BREAK-GLASS EMERGENCY ACCESS
// ==========================================

router.get('/breakglass', requireMinimumRole('viewer'), governanceController.listBreakGlassSessions);
router.get('/breakglass/active', requireMinimumRole('viewer'), governanceController.getActiveBreakGlass);
router.post('/breakglass/request', requireMinimumRole('analyst'), governanceController.requestBreakGlass);
router.post('/breakglass/:sessionId/approve', requireMinimumRole('admin'), governanceController.approveBreakGlass);
router.post('/breakglass/:sessionId/revoke', requireMinimumRole('analyst'), governanceController.revokeBreakGlass);

// ==========================================
// 5. INTEGRATION GOVERNANCE METADATA
// ==========================================

router.get('/integrations', requireMinimumRole('viewer'), governanceController.listIntegrations);
router.post('/integrations', requireMinimumRole('admin'), governanceController.createIntegration);
router.put('/integrations/:integrationId', requireMinimumRole('admin'), governanceController.updateIntegration);
router.delete('/integrations/:integrationId', requireMinimumRole('admin'), governanceController.deleteIntegration);

module.exports = router;
