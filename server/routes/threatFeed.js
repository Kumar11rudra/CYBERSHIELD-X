const express = require('express');
const { getLiveThreatFeed } = require('../controllers/threatFeedController');

const router = express.Router();

router.get('/', getLiveThreatFeed);

module.exports = router;
