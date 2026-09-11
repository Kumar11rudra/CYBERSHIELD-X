/**
 * 🛡️ CyberShield X — Hunt Execution Routes (Phase 71)
 */

const express = require('express');
const router = express.Router();
const huntController = require('../controllers/huntController');
const { authenticate, tryAuthenticate } = require('../middleware/auth');
const { requireMinimumRole } = require('../middleware/rbac');

// Execution detail
router.get('/:executionId', tryAuthenticate, huntController.getExecutionDetail);

// Evidence promotions
router.post('/:executionId/promote-finding', authenticate, requireMinimumRole('analyst'), huntController.promoteFinding);
router.post('/:executionId/promote-incident', authenticate, requireMinimumRole('analyst'), huntController.promoteIncident);
router.post('/:executionId/draft-detection', authenticate, requireMinimumRole('analyst'), huntController.draftDetection);

module.exports = router;
