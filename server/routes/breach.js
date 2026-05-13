const express = require('express');
const router = express.Router();
const { checkEmail, checkPhone, checkPassword } = require('../controllers/breachController');
const auth = require('../middleware/auth');

// Note: We're not making these 'auth' required to allow guest checks, 
// but we can add rate limiting later.
router.post('/email', checkEmail);
router.post('/phone', checkPhone);
router.post('/password', checkPassword);

module.exports = router;
