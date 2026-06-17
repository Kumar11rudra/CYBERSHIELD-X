const express = require('express');
const router = express.Router();
const { 
  searchIOC, 
  addIOC, 
  getRecentIOCs,
  runCorrelation,
  triggerFeedSync,
  getFeedStatsAndHealth 
} = require('../controllers/iocController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Threat Intelligence lookup endpoints
router.get('/', authenticate, searchIOC);
router.get('/recent', authenticate, getRecentIOCs);
router.post('/add', authenticate, requireAdmin, addIOC);

// Threat Intelligence Correlation and Sync
router.get('/correlate', authenticate, runCorrelation);
router.post('/sync-feeds', authenticate, requireAdmin, triggerFeedSync);
router.get('/feed-stats', authenticate, getFeedStatsAndHealth);

module.exports = router;
