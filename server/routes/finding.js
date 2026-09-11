const express = require('express');
const router = express.Router();
const findingController = require('../controllers/findingController');
const { authenticate } = require('../middleware/auth');
const { requireMinimumRole } = require('../middleware/rbac');

router.get('/', authenticate, findingController.getFindings);
router.get('/:id', authenticate, findingController.getFindingById);
router.post('/', authenticate, requireMinimumRole('analyst'), findingController.createFinding);
router.put('/:id', authenticate, requireMinimumRole('analyst'), findingController.updateFinding);
router.patch('/:id', authenticate, requireMinimumRole('analyst'), findingController.updateFinding);

module.exports = router;
