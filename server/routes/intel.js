/**
 * 🛡️ CyberShield X — Intel Routes (Phase 71)
 */

const express = require('express');
const router = express.Router();
const intelController = require('../controllers/intelController');
const { authenticate, tryAuthenticate } = require('../middleware/auth');
const { requireMinimumRole } = require('../middleware/rbac');

// Threat Intelligence Records
router.get('/', tryAuthenticate, intelController.listIntel);
router.post('/enrich', authenticate, requireMinimumRole('analyst'), intelController.enrichIndicator);
router.get('/matches', tryAuthenticate, intelController.getPlatformMatches);
router.get('/attack-techniques', tryAuthenticate, intelController.listAttackTechniques);
router.get('/investigation-timeline', tryAuthenticate, intelController.getInvestigationTimeline);

// Threat Actors
router.get('/threat-actors', tryAuthenticate, intelController.listThreatActors);
router.post('/threat-actors', authenticate, requireMinimumRole('operator'), intelController.createThreatActor);

// Campaigns
router.get('/campaigns', tryAuthenticate, intelController.listCampaigns);
router.post('/campaigns', authenticate, requireMinimumRole('operator'), intelController.createCampaign);

// Single indicator lookup
router.get('/:indicator', tryAuthenticate, intelController.getIntelDetail);

module.exports = router;
