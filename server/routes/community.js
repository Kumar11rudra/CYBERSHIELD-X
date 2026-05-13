const express = require('express');
const { getCommunityNotes, createCommunityNote, voteCommunityNote } = require('../controllers/communityController');
const { authenticate, tryAuthenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/notes', tryAuthenticate, getCommunityNotes);
router.post('/notes', authenticate, createCommunityNote);
router.post('/notes/:id/vote', authenticate, voteCommunityNote);

module.exports = router;
