const express = require('express');
const router = express.Router();
const { analyzeSMS, verifyUPI, whoisLookup, checkSSL, detectPhishing } = require('../controllers/toolsController');
const { authenticate } = require('../middleware/auth');

router.post('/sms', authenticate, analyzeSMS);
router.post('/upi', authenticate, verifyUPI);
router.post('/whois', authenticate, whoisLookup);
router.post('/ssl', authenticate, checkSSL);
router.post('/phishing', authenticate, detectPhishing);

module.exports = router;
