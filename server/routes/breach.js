const express = require('express');
const router = express.Router();
const { checkEmail, checkPhone, checkPassword } = require('../controllers/breachController');
const { authenticate } = require('../middleware/auth');

router.post('/email', authenticate, checkEmail);
router.post('/phone', authenticate, checkPhone);
router.post('/password', authenticate, checkPassword);

module.exports = router;
