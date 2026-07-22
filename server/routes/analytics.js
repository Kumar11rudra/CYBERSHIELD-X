const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getDailyActivity,
  getRiskTrends,
  getSeverityTrends,
  getTopVulnerableAssets,
  getCommonCVEs,
  getSLABreaches
} = require('../controllers/analyticsController');

router.use(authenticate);

router.get('/daily-activity', getDailyActivity);
router.get('/trends/risk', getRiskTrends);
router.get('/trends/severity', getSeverityTrends);
router.get('/top-assets', getTopVulnerableAssets);
router.get('/top-cves', getCommonCVEs);
router.get('/sla', getSLABreaches);

module.exports = router;
