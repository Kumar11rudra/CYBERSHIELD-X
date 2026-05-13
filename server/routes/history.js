const express = require('express');
const router = express.Router();
const { getHistory, getScanById, deleteScan, exportScanPDF, toggleScanShare, getPublicScan } = require('../controllers/historyController');
const { authenticate } = require('../middleware/auth');

router.get('/public/:id', getPublicScan); // Does not require auth
router.get('/', authenticate, getHistory);
router.get('/:id', authenticate, getScanById);
router.delete('/:id', authenticate, deleteScan);
router.get('/:id/export', authenticate, exportScanPDF);
router.patch('/:id/share', authenticate, toggleScanShare);

module.exports = router;
