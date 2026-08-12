const express = require('express');
const router = express.Router();
const { performScan, verifyScanSignature } = require('../controllers/scanController');
const { tryAuthenticate } = require('../middleware/auth');
const { scanValidationRules, handleValidationErrors } = require('../utils/validators');

// Phase 17: Scan is publicly accessible (public-first architecture).
// tryAuthenticate sets req.user if a valid token is present, or null if anonymous.
// Authentication is only required for report download, not for scanning.
router.post('/', tryAuthenticate, scanValidationRules, handleValidationErrors, performScan);
router.post('/verify-signature', verifyScanSignature);

module.exports = router;
