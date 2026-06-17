const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const TenantContextService = require('../services/TenantContextService');
const { PERMISSIONS } = require('../utils/permissions');
const integrationController = require('../controllers/integrationController');

// All routes are guarded by authentication and Org-RBAC webhook config permissions
router.use(authenticate);
router.use(TenantContextService.enforcePermission(PERMISSIONS.WEBHOOK_MANAGE));

router.get('/', integrationController.getIntegrations);
router.post('/', integrationController.createIntegration);
router.put('/:id', integrationController.updateIntegration);
router.delete('/:id', integrationController.deleteIntegration);
router.post('/test', integrationController.testIntegration);

module.exports = router;
