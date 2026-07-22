const express = require('express');
const router = express.Router();
const vaultController = require('../controllers/vaultController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', vaultController.getAssets);
router.post('/add', vaultController.addAsset);
router.delete('/:id', vaultController.deleteAsset);

module.exports = router;
