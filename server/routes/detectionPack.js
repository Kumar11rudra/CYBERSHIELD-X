/**
 * 🛡️ CyberShield X — Detection Content Pack Routes (Phase 73)
 */

const express = require('express');
const router = express.Router();
const detectionController = require('../controllers/detectionController');
const { authenticate, tryAuthenticate } = require('../middleware/auth');
const { requireMinimumRole } = require('../middleware/rbac');

router.get('/', tryAuthenticate, detectionController.listPacks);
router.post('/import', authenticate, requireMinimumRole('operator'), detectionController.importPack);
router.post('/:packId/validate', authenticate, requireMinimumRole('analyst'), detectionController.validatePack);
router.post('/:packId/test', authenticate, requireMinimumRole('analyst'), detectionController.testPack);
router.post('/:packId/activate', authenticate, requireMinimumRole('operator'), detectionController.activatePack);

module.exports = router;
