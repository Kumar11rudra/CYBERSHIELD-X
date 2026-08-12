const express = require('express');
const router = express.Router();
const { processChat } = require('../controllers/aiController');
const { analyzeScan } = require('../controllers/aiReportController');
const { authenticate } = require('../middleware/auth');

router.post('/chat', authenticate, processChat);
router.post('/analyze-scan', authenticate, analyzeScan);

module.exports = router;
