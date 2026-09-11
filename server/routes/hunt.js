/**
 * 🛡️ CyberShield X — Hunt Routes (Phase 71)
 */

const express = require('express');
const router = express.Router();
const huntController = require('../controllers/huntController');
const { authenticate, tryAuthenticate } = require('../middleware/auth');
const { requireMinimumRole } = require('../middleware/rbac');

// Templates
router.get('/templates', tryAuthenticate, huntController.getTemplates);
router.post('/templates/:templateId/clone', authenticate, requireMinimumRole('analyst'), huntController.createFromTemplate);

// Query AST validation
router.post('/validate', tryAuthenticate, huntController.validateQuery);

// General Hunt CRUD
router.get('/', tryAuthenticate, huntController.listHunts);
router.post('/', authenticate, requireMinimumRole('analyst'), huntController.createHunt);
router.get('/:id', tryAuthenticate, huntController.getHunt);
router.patch('/:id', authenticate, requireMinimumRole('analyst'), huntController.updateHunt);
router.delete('/:id', authenticate, requireMinimumRole('operator'), huntController.deleteHunt);

// Execution Lifecycle
router.post('/:id/execute', authenticate, requireMinimumRole('analyst'), huntController.executeHunt);
router.post('/:id/cancel', authenticate, requireMinimumRole('analyst'), huntController.cancelHunt);
router.get('/:id/executions', tryAuthenticate, huntController.getExecutions);

// Scheduling Governance (Operator+)
router.post('/:id/schedule', authenticate, requireMinimumRole('operator'), huntController.scheduleHunt);
router.delete('/:id/schedule', authenticate, requireMinimumRole('operator'), huntController.disableSchedule);

module.exports = router;
