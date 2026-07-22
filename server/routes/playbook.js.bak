const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const TenantContextService = require('../services/TenantContextService');
const { PERMISSIONS } = require('../utils/permissions');
const playbookController = require('../controllers/playbookController');

router.use(authenticate);
router.use(TenantContextService.enforcePermission(PERMISSIONS.WEBHOOK_MANAGE));

router.get('/', playbookController.getPlaybooks);
router.post('/', playbookController.createPlaybook);
router.put('/:id', playbookController.updatePlaybook);
router.delete('/:id', playbookController.deletePlaybook);
router.post('/:id/trigger', playbookController.triggerPlaybookManually);
router.get('/runs', playbookController.getAutomationRuns);
router.post('/seed-templates', playbookController.seedTemplates);

module.exports = router;
