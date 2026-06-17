const express = require('express');
const router = express.Router();
const { getAssets, createAsset, updateAsset, deleteAsset } = require('../controllers/assetController');
const { authenticate } = require('../middleware/auth');
const { enforcePermission } = require('../middleware/orgAuth');
const { PERMISSIONS } = require('../utils/permissions');

router.get('/', authenticate, enforcePermission(PERMISSIONS.ASSET_VIEW), getAssets);
router.post('/', authenticate, enforcePermission(PERMISSIONS.ASSET_CREATE), createAsset);
router.put('/:id', authenticate, enforcePermission(PERMISSIONS.ASSET_UPDATE), updateAsset);
router.delete('/:id', authenticate, enforcePermission(PERMISSIONS.ASSET_DELETE), deleteAsset);

module.exports = router;
