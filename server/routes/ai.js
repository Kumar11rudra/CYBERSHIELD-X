const express = require('express');
const router = express.Router();
const { processChat } = require('../controllers/aiController');
const { tryAuthenticate } = require('../middleware/auth');

router.post('/chat', tryAuthenticate, processChat);

module.exports = router;
