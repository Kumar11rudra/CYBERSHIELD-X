const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const TenantContextService = require('../services/TenantContextService');
const { PERMISSIONS } = require('../utils/permissions');
const remediationController = require('../controllers/remediationController');

router.use(authenticate);
router.use(TenantContextService.enforcePermission(PERMISSIONS.VULN_VIEW));

router.get('/', remediationController.getRemediation);
router.get('/fixes', remediationController.getVulnerabilityFixes);

module.exports = router;
