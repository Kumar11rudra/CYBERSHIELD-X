const express = require('express');
const router = express.Router();
const { handleChat } = require('../controllers/chatbot/chatbotController');

const { authenticate } = require('../middleware/auth');

// Endpoint to handle chatbot interaction (requires authentication)
router.post('/chat', authenticate, handleChat);

module.exports = router;
