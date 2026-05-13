const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// Get subscription plans
router.get('/plans', (req, res) => {
  res.json({
    plans: [
      { id: 'free', name: 'Standard (Free)', price: 0, features: ['Core Scanners', '3 Scans/Day', 'Community Access'] },
      { id: 'pro', name: 'Nexus Pro', price: 999, features: ['Unlimited Scans', 'Deep AI Analysis', 'API Access', '24/7 Support'] },
      { id: 'enterprise', name: 'CyberShield Enterprise', price: 'Custom', features: ['Global Threat Intel', 'SOC Integration', 'Private Instances'] }
    ]
  });
});

// Get current user membership status
router.get('/status', authenticate, (req, res) => {
  res.json({ 
    plan: req.user.role === 'admin' ? 'Enterprise' : 'Free', 
    status: 'active',
    expiresAt: null, // Lifetime for free
    features: req.user.role === 'admin' ? ['All Access'] : ['Standard Scanners']
  });
});

module.exports = router;
