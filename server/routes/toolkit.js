const express = require('express');
const router = express.Router();
const { executeTool } = require('../controllers/toolkitController');
const { authenticate } = require('../middleware/auth');

// Toolkit operations require authentication
router.post('/execute', authenticate, executeTool);

module.exports = router;
