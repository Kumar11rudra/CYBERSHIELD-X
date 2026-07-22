const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getHistory, getEntityHistory } = require('../controllers/historyController');

router.use(authenticate);

router.get('/', getHistory);
router.get('/entity/:entityType/:entityId', getEntityHistory);

module.exports = router;
