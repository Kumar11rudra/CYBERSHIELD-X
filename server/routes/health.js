const express = require('express');
const router = express.Router();
const healthService = require('../services/healthService');

// General Liveness Check
router.get('/', async (req, res) => {
  const health = await healthService.getDetailedHealth();
  if (health.status === 'healthy') {
    res.json({ status: 'healthy', timestamp: health.timestamp });
  } else {
    res.status(503).json({ status: 'unhealthy', timestamp: health.timestamp });
  }
});

// Detailed Diagnostics data
router.get('/details', async (req, res) => {
  const health = await healthService.getDetailedHealth();
  res.json(health);
});

module.exports = router;
