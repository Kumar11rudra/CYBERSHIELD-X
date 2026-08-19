const express = require('express');
const router = express.Router();
const { generatePdfReport, exportScanReport } = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

router.get('/generate-pdf/:scanId', authenticate, generatePdfReport);
router.get('/export/:format/:scanId', authenticate, exportScanReport);

module.exports = router;
