/**
 * 🛡️ CyberShield X — Enterprise SOC Intelligence & Decision Support Routes (Phase 79)
 *
 * REST Endpoints for Risk Synthesis, Analyst Prioritization, Next-Best-Actions,
 * Activity Clustering, Investigation Hypotheses, and Decision Assessments.
 */

const express = require('express');
const router = express.Router();
const intelligenceController = require('../controllers/intelligenceController');
const { authenticate } = require('../middleware/auth');
const { requireMinimumRole } = require('../middleware/rbac');

// All intelligence routes require authentication
router.use(authenticate);

// ==========================================
// 1. RISK SYNTHESIS & SNAPSHOTS
// ==========================================
router.get('/risk/subject', requireMinimumRole('viewer'), intelligenceController.getSubjectRisk);
router.get('/risk/factors', requireMinimumRole('viewer'), intelligenceController.getRiskFactors);
router.get('/risk/history', requireMinimumRole('viewer'), intelligenceController.getRiskHistory);
router.post('/risk/snapshot', requireMinimumRole('analyst'), intelligenceController.createRiskSnapshot);
router.all('/risk/explain', requireMinimumRole('viewer'), intelligenceController.explainRisk);

// ==========================================
// 2. ANALYST PRIORITIZATION
// ==========================================
router.get('/prioritization/queue', requireMinimumRole('viewer'), intelligenceController.getPrioritizationQueue);
router.all('/prioritization/explain', requireMinimumRole('viewer'), intelligenceController.explainPriority);

// ==========================================
// 3. INVESTIGATION RECOMMENDATIONS
// ==========================================
router.get('/recommendations', requireMinimumRole('viewer'), intelligenceController.getRecommendations);
router.post('/recommendations/generate', requireMinimumRole('analyst'), intelligenceController.generateRecommendations);
router.post('/recommendations/:id/feedback', requireMinimumRole('analyst'), intelligenceController.feedbackRecommendation);
router.post('/recommendations/:id/accept', requireMinimumRole('analyst'), (req, res) => {
  req.body = req.body || {};
  req.body.status = 'ACCEPTED';
  return intelligenceController.feedbackRecommendation(req, res);
});
router.post('/recommendations/:id/reject', requireMinimumRole('analyst'), (req, res) => {
  req.body = req.body || {};
  req.body.status = 'REJECTED';
  return intelligenceController.feedbackRecommendation(req, res);
});

// ==========================================
// 4. CAMPAIGNS & CLUSTERS
// ==========================================
router.get('/campaigns/clusters', requireMinimumRole('viewer'), intelligenceController.getClusters);
router.get('/campaigns/clusters/:id', requireMinimumRole('viewer'), intelligenceController.getClusterDetails);
router.all('/campaigns/clusters/:id/explain', requireMinimumRole('viewer'), intelligenceController.explainCluster);

// ==========================================
// 5. INVESTIGATION HYPOTHESES
// ==========================================
router.get('/hypotheses', requireMinimumRole('viewer'), intelligenceController.getHypotheses);
router.post('/hypotheses', requireMinimumRole('analyst'), intelligenceController.createHypothesis);
router.post('/hypotheses/:id/support', requireMinimumRole('analyst'), intelligenceController.supportHypothesis);
router.post('/hypotheses/:id/refute', requireMinimumRole('analyst'), intelligenceController.refuteHypothesis);
router.post('/hypotheses/:id/close', requireMinimumRole('operator'), intelligenceController.closeHypothesis);

// ==========================================
// 6. DECISION ASSESSMENTS & EXECUTIVE SUMMARY
// ==========================================
router.get('/assessments', requireMinimumRole('viewer'), intelligenceController.getAssessments);
router.post('/assessments', requireMinimumRole('analyst'), intelligenceController.createAssessment);
router.get('/assessments/:id', requireMinimumRole('viewer'), intelligenceController.getAssessmentById);
router.post('/assessments/compare', requireMinimumRole('viewer'), intelligenceController.compareAssessments);
router.get('/executive-summary', requireMinimumRole('viewer'), intelligenceController.getExecutiveDecisionSummary);

module.exports = router;
