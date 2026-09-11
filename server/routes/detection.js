/**
 * 🛡️ CyberShield X — Detection Routes (Phase 70)
 */

const express = require('express');
const router = express.Router();
const detectionController = require('../controllers/detectionController');
const { authenticate, tryAuthenticate } = require('../middleware/auth');
const { requireMinimumRole } = require('../middleware/rbac');

// Public / Read routes
router.get('/', tryAuthenticate, detectionController.listRules);
router.get('/rules', tryAuthenticate, detectionController.listRules);
router.get('/suppressions', tryAuthenticate, detectionController.listSuppressions);
router.get('/coverage', tryAuthenticate, detectionController.getCoverage);
router.get('/health', tryAuthenticate, detectionController.getHealthMetrics);
router.get('/tests', tryAuthenticate, detectionController.runRegressionSuite);

// Rule detail & versions
router.get('/rules/:ruleId', tryAuthenticate, detectionController.getRule);
router.get('/:ruleId/versions', tryAuthenticate, detectionController.listVersions);
router.get('/rules/:ruleId/versions', tryAuthenticate, detectionController.listVersions);
router.get('/:ruleId', tryAuthenticate, detectionController.getRule);

// Mutation & Testing routes (Analyst / Operator)
router.post('/', authenticate, requireMinimumRole('analyst'), detectionController.createRule);
router.post('/rules', authenticate, requireMinimumRole('analyst'), detectionController.createRule);
router.put('/rules/:ruleId', authenticate, requireMinimumRole('operator'), detectionController.updateRule);
router.put('/:ruleId', authenticate, requireMinimumRole('operator'), detectionController.updateRule);

// Testing & Fixtures
router.post('/rules/:ruleId/test', authenticate, detectionController.runRuleTests);
router.post('/:ruleId/test', authenticate, detectionController.runRuleTests);
router.post('/rules/:ruleId/fixtures', authenticate, requireMinimumRole('analyst'), detectionController.addFixture);
router.post('/:ruleId/fixtures', authenticate, requireMinimumRole('analyst'), detectionController.addFixture);

// Review & Approval (Operator / Admin)
router.post('/rules/:ruleId/approve', authenticate, requireMinimumRole('operator'), detectionController.approveRule);
router.post('/:ruleId/approve', authenticate, requireMinimumRole('operator'), detectionController.approveRule);
router.post('/rules/:ruleId/review', authenticate, requireMinimumRole('operator'), detectionController.reviewRule);
router.post('/:ruleId/review', authenticate, requireMinimumRole('operator'), detectionController.reviewRule);
router.post('/rules/:ruleId/activate', authenticate, requireMinimumRole('operator'), detectionController.activateRule);
router.post('/:ruleId/activate', authenticate, requireMinimumRole('operator'), detectionController.activateRule);
router.post('/rules/:ruleId/disable', authenticate, requireMinimumRole('operator'), detectionController.disableRule);
router.post('/:ruleId/disable', authenticate, requireMinimumRole('operator'), detectionController.disableRule);

// Revisions & Rollback
router.post('/rules/:ruleId/versions', authenticate, requireMinimumRole('analyst'), detectionController.createRevision);
router.post('/:ruleId/versions', authenticate, requireMinimumRole('analyst'), detectionController.createRevision);
router.post('/rules/:ruleId/rollback', authenticate, requireMinimumRole('operator'), detectionController.rollbackRule);
router.post('/:ruleId/rollback', authenticate, requireMinimumRole('operator'), detectionController.rollbackRule);

// Suppressions & Evaluation
router.post('/suppressions', authenticate, requireMinimumRole('operator'), detectionController.createSuppression);
router.post('/evaluate', authenticate, detectionController.evaluateEvent);

module.exports = router;
