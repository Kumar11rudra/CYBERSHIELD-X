const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
  getAnalyticsOverview,
  getDailyActivity,
  getScanTypes,
  getSecurityEvents,
} = require('../controllers/analyticsController');

// All analytics routes require admin authentication
router.use(authenticate, requireAdmin);

router.get('/overview', getAnalyticsOverview);
router.get('/daily-activity', getDailyActivity);
router.get('/scan-types', getScanTypes);
router.get('/security-events', getSecurityEvents);

module.exports = router;
