const express = require('express');
const router = express.Router();
const { generatePdfReport } = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

router.get('/generate-pdf/:scanId', authenticate, generatePdfReport);

module.exports = router;
