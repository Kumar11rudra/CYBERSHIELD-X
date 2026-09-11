const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');
const { authenticate } = require('../middleware/auth');
const { requireMinimumRole } = require('../middleware/rbac');

router.get('/', authenticate, caseController.getCases);
router.get('/:id', authenticate, caseController.getCaseById);
router.get('/:id/dossier', authenticate, caseController.compileDossier);
router.post('/', authenticate, requireMinimumRole('analyst'), caseController.createCase);
router.put('/:id', authenticate, requireMinimumRole('analyst'), caseController.updateCase);
router.patch('/:id', authenticate, requireMinimumRole('analyst'), caseController.updateCase);
router.post('/:id/evidence', authenticate, requireMinimumRole('analyst'), caseController.addEvidence);
router.post('/:id/timeline', authenticate, requireMinimumRole('analyst'), caseController.addTimelineNote);
router.post('/:id/incidents', authenticate, requireMinimumRole('analyst'), caseController.linkIncident);
router.post('/:id/hunts', authenticate, requireMinimumRole('analyst'), caseController.linkHunt);
router.post('/:id/parent', authenticate, requireMinimumRole('analyst'), caseController.linkParentChild);
router.post('/:id/reopen', authenticate, requireMinimumRole('analyst'), caseController.reopenCase);

module.exports = router;
