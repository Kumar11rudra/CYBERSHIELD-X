const express = require('express');
const router = express.Router();
const { analyzeScan } = require('../controllers/aiReportController');
const { authenticate } = require('../middleware/auth');

router.post('/analyze-scan', authenticate, analyzeScan);

module.exports = router;
