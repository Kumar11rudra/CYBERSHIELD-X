const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { authenticate } = require('../middleware/auth');
const { requireMinimumRole } = require('../middleware/rbac');

router.get('/', authenticate, alertController.getAlerts);
router.get('/:id', authenticate, alertController.getAlertById);
router.post('/', authenticate, requireMinimumRole('analyst'), alertController.createAlert);
router.post('/:id/acknowledge', authenticate, requireMinimumRole('analyst'), alertController.acknowledgeAlert);
router.post('/:id/investigate', authenticate, requireMinimumRole('analyst'), alertController.investigateAlert);
router.post('/:id/resolve', authenticate, requireMinimumRole('analyst'), alertController.resolveAlert);

module.exports = router;
