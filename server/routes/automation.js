/**
 * 🛡️ CyberShield X — Security Operations Automation Routes (Phase 77)
 *
 * REST Endpoints for Control Validation, Security Drift,
 * Playbook Lifecycle & Revisions, Approval-Bound Executions,
 * Post-Action Verification, and Rollback.
 */

const express = require('express');
const router = express.Router();
const automationController = require('../controllers/automationController');
const { authenticate } = require('../middleware/auth');
const { requireMinimumRole } = require('../middleware/rbac');

// All automation routes require authenticated user identity
router.use(authenticate);

// ==========================================
// 1. PLAYBOOKS & REVISIONS
// ==========================================
router.get('/playbooks', requireMinimumRole('viewer'), automationController.listPlaybooks);
router.get('/playbooks/:playbookId', requireMinimumRole('viewer'), automationController.getPlaybookDetail);
router.post('/playbooks', requireMinimumRole('operator'), automationController.createPlaybook);
router.post('/playbooks/:playbookId/revise', requireMinimumRole('operator'), automationController.revisePlaybook);
router.post('/playbooks/:playbookId/submit-review', requireMinimumRole('operator'), automationController.submitReview);
router.post('/playbooks/:playbookId/approve', requireMinimumRole('admin'), automationController.approvePlaybook);
router.post('/playbooks/:playbookId/activate', requireMinimumRole('admin'), automationController.activatePlaybook);
router.post('/playbooks/:playbookId/disable', requireMinimumRole('admin'), automationController.disablePlaybook);
router.post('/playbooks/:playbookId/retire', requireMinimumRole('admin'), automationController.retirePlaybook);

// ==========================================
// 2. CONTROL VALIDATION
// ==========================================
router.get('/validations/posture', requireMinimumRole('viewer'), automationController.getPostureSummary);
router.post('/validations/run', requireMinimumRole('operator'), automationController.runValidations);
router.get('/validations/history', requireMinimumRole('viewer'), automationController.getValidationHistory);

// ==========================================
// 3. SECURITY DRIFT DETECTION & REMEDIATION
// ==========================================
router.get('/drift', requireMinimumRole('viewer'), automationController.listDrift);
router.post('/drift/run', requireMinimumRole('operator'), automationController.runDriftDetection);
router.post('/drift/:driftId/acknowledge', requireMinimumRole('analyst'), automationController.acknowledgeDrift);
router.get('/drift/:driftId/propose-remediation', requireMinimumRole('analyst'), automationController.proposeRemediation);
router.post('/drift/:driftId/accept-risk', requireMinimumRole('admin'), automationController.acceptRisk);
router.post('/drift/:driftId/verify', requireMinimumRole('operator'), automationController.verifyRemediation);

// ==========================================
// 4. AUTOMATION EXECUTIONS & ROLLBACK
// ==========================================
router.get('/executions', requireMinimumRole('viewer'), automationController.listExecutions);
router.get('/executions/:executionId', requireMinimumRole('viewer'), automationController.getExecutionDetail);
router.post('/executions/request', requireMinimumRole('operator'), automationController.requestExecution);
router.post('/executions/:executionId/approve', requireMinimumRole('admin'), automationController.approveExecution);
router.post('/executions/:executionId/cancel', requireMinimumRole('operator'), automationController.cancelExecution);
router.post('/executions/:executionId/rollback', requireMinimumRole('admin'), automationController.rollbackExecution);

// ==========================================
// 5. AUTOMATION HEALTH & RECOVERY
// ==========================================
router.get('/health', requireMinimumRole('viewer'), automationController.getAutomationHealth);
router.post('/recover', requireMinimumRole('admin'), automationController.recoverStuckExecutions);

module.exports = router;
