const express = require('express');
const router = express.Router();
const { performScan, verifyScanSignature } = require('../controllers/scanController');
const { authenticate } = require('../middleware/auth');
const { scanValidationRules, handleValidationErrors } = require('../utils/validators');

router.post('/', authenticate, scanValidationRules, handleValidationErrors, performScan);
router.post('/verify-signature', verifyScanSignature);

module.exports = router;
