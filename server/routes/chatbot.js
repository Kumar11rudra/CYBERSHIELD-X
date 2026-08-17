const express = require('express');
const router = express.Router();
const { handleChat } = require('../controllers/chatbot/chatbotController');
const { tryAuthenticate } = require('../middleware/auth');

// Endpoint to handle chatbot interaction (supports both guests and authenticated operators)
router.post('/chat', tryAuthenticate, handleChat);

module.exports = router;

