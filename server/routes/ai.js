const express = require('express');
const router = express.Router();
const { processChat } = require('../controllers/aiController');
const { analyzeScan } = require('../controllers/aiReportController');
const { tryAuthenticate, authenticate } = require('../middleware/auth');

router.post('/chat', tryAuthenticate, processChat);
router.post('/analyze-scan', authenticate, analyzeScan);

module.exports = router;
