/**
 * 🛡️ CyberShield X — Incident Routes (Phase 70)
 */

const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');
const { authenticate, tryAuthenticate } = require('../middleware/auth');
const { requireMinimumRole } = require('../middleware/rbac');

// Read incident data (Viewers and above)
router.get('/', tryAuthenticate, incidentController.listIncidents);
router.get('/:incidentId', tryAuthenticate, incidentController.getIncident);
router.get('/:incidentId/graph', tryAuthenticate, incidentController.getAttackChainGraph);
router.get('/:incidentId/timeline', tryAuthenticate, incidentController.getTimeline);
router.get('/:incidentId/tasks', tryAuthenticate, incidentController.listTasks);
router.get('/:incidentId/evidence', tryAuthenticate, incidentController.listEvidence);
router.get('/:incidentId/report', tryAuthenticate, incidentController.generateReport);

// Create / Mutate incidents (Analyst and above)
router.post('/', authenticate, requireMinimumRole('analyst'), incidentController.createIncident);
router.put('/:incidentId/status', authenticate, requireMinimumRole('analyst'), incidentController.updateStatus);
router.post('/:incidentId/transition', authenticate, requireMinimumRole('analyst'), incidentController.transitionState);
router.post('/:incidentId/assign', authenticate, requireMinimumRole('analyst'), incidentController.assignIncident);
router.post('/:incidentId/claim', authenticate, requireMinimumRole('analyst'), incidentController.claimIncident);
router.post('/:incidentId/unassign', authenticate, requireMinimumRole('analyst'), incidentController.unassignIncident);
router.post('/:incidentId/tasks', authenticate, requireMinimumRole('analyst'), incidentController.createTask);
router.put('/:incidentId/tasks/:taskId', authenticate, requireMinimumRole('analyst'), incidentController.updateTask);
router.post('/:incidentId/evidence', authenticate, requireMinimumRole('analyst'), incidentController.registerEvidence);
router.post('/:incidentId/evidence/collect', authenticate, requireMinimumRole('analyst'), incidentController.collectEvidence);
router.post('/:incidentId/evidence/:evidenceId/verify', authenticate, requireMinimumRole('analyst'), incidentController.verifyEvidence);
router.post('/:incidentId/response/propose', authenticate, requireMinimumRole('analyst'), incidentController.proposeResponseAction);
router.post('/:incidentId/response/:actionId/verify', authenticate, requireMinimumRole('analyst'), incidentController.verifyResponseAction);
router.post('/:incidentId/close', authenticate, requireMinimumRole('analyst'), incidentController.closeIncident);
router.post('/:incidentId/reopen', authenticate, requireMinimumRole('analyst'), incidentController.reopenIncident);
router.post('/:incidentId/feedback/gap', authenticate, requireMinimumRole('analyst'), incidentController.generateDetectionGapFeedback);
router.post('/:incidentId/notes', authenticate, requireMinimumRole('analyst'), incidentController.addAnalystNote);

// Operational Response Execution (Operator and above)
router.post('/:incidentId/response/:actionId/execute', authenticate, requireMinimumRole('operator'), incidentController.executeResponseAction);

module.exports = router;
