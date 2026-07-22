const express = require('express');
const router = express.Router();
const { handleChat } = require('../controllers/chatbot/chatbotController');

// Endpoint to handle chatbot interaction
router.post('/chat', handleChat);

module.exports = router;
