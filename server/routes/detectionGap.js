/**
 * 🛡️ CyberShield X — Detection Gap Routes (Phase 73)
 */

const express = require('express');
const router = express.Router();
const detectionController = require('../controllers/detectionController');
const { authenticate, tryAuthenticate } = require('../middleware/auth');
const { requireMinimumRole } = require('../middleware/rbac');

router.get('/', tryAuthenticate, detectionController.listGaps);
router.post('/scan', authenticate, requireMinimumRole('analyst'), detectionController.scanGaps);
router.post('/:gapId/promote', authenticate, requireMinimumRole('analyst'), detectionController.promoteGap);

module.exports = router;
