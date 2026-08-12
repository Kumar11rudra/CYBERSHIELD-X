const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { workflowController } = require('../controllers/chatbot/chatbotController');

// All endpoints require authentication
router.use(authenticate);

router.post('/start', workflowController.start);
router.get('/', workflowController.list);
router.get('/:id', workflowController.get);
router.get('/:id/progress', workflowController.progress);
router.get('/:id/result', workflowController.result);
router.delete('/:id', workflowController.delete);

module.exports = router;
