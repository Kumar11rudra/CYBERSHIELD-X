const express = require('express');
const router = express.Router();
const { getWatchlist, addToWatchlist, removeFromWatchlist } = require('../controllers/watchlistController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getWatchlist);
router.post('/', addToWatchlist);
router.delete('/:id', removeFromWatchlist);

module.exports = router;
