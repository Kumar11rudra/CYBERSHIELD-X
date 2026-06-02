const express = require('express');
const router = express.Router();
const { executeTool } = require('../controllers/toolkitController');
const { tryAuthenticate } = require('../middleware/auth');

// Toolkit operations allow guest checks
router.post('/execute', tryAuthenticate, executeTool);

module.exports = router;
