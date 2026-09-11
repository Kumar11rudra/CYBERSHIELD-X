/**
 * 🛡️ CyberShield X — IOC Routes (Phase 70 & Legacy Intelligence)
 */

const express = require('express');
const router = express.Router();
const iocController = require('../controllers/iocController');
const { authenticate, tryAuthenticate, requireAdmin } = require('../middleware/auth');
const { requireMinimumRole } = require('../middleware/rbac');

const adminGuard = requireAdmin || ((req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
});

// Phase 70 Normalization & Truthful Enrichment
router.post('/normalize', tryAuthenticate, iocController.normalizeIoc);
router.post('/enrich', authenticate, requireMinimumRole('analyst'), iocController.enrichIoc);

// Legacy Threat Intelligence Endpoints
router.get('/recent', authenticate, iocController.getRecentIOCs);
router.post('/add', authenticate, adminGuard, iocController.addIOC);
router.get('/correlate', authenticate, iocController.runCorrelation);
router.post('/sync-feeds', authenticate, adminGuard, iocController.triggerFeedSync);
router.get('/feed-stats', authenticate, iocController.getFeedStatsAndHealth);


// Unified Root IOC endpoint (Supports legacy /api/ioc?query=... and Phase 70 /api/iocs listing)
router.get('/', (req, res, next) => {
  if (req.query.query || req.query.target) {
    return authenticate(req, res, () => iocController.searchIOC(req, res, next));
  }
  if (req.baseUrl === '/api/ioc' && !req.query.type && !req.query.reputation && !req.query.search && !req.query.asset) {
    return authenticate(req, res, () => iocController.listIocs(req, res, next));
  }
  return tryAuthenticate(req, res, () => iocController.listIocs(req, res, next));
});

module.exports = router;
