const express = require('express');
const router = express.Router({ mergeParams: true }); // Support nested routers if needed
const { 
    getAssets, createAsset, updateAsset, deleteAsset, getAssetById, archiveAsset, restoreAsset,
    bulkCreateAssets, bulkDeleteAssets, bulkArchiveAssets, searchAssets, filterAssets,
    assignOwner, removeOwner, assignTeam, removeTeam, getAssetHistory, getAssetStatistics
} = require('../controllers/assetController');
const { authenticate } = require('../middleware/auth');

// Note: enforcePermission relies on req.params.orgId, but if we're using a header, we might need a generic RBAC check.
// Since the AssetService explicitly validates RBAC (e.g., await RBACService.requirePermission), 
// we can safely remove the legacy middleware here and let the Service layer handle it.
// This is structurally better as the Service is the Source of Truth.

router.get('/', authenticate, getAssets);
router.post('/', authenticate, createAsset);
router.post('/bulk', authenticate, bulkCreateAssets);
router.delete('/bulk', authenticate, bulkDeleteAssets);
router.put('/bulk/archive', authenticate, bulkArchiveAssets);

router.get('/search', authenticate, searchAssets);
router.get('/filter', authenticate, filterAssets);
router.get('/statistics', authenticate, getAssetStatistics);

router.get('/:assetId', authenticate, getAssetById);
router.put('/:assetId', authenticate, updateAsset);
router.delete('/:assetId', authenticate, deleteAsset);
router.put('/:assetId/archive', authenticate, archiveAsset);
router.put('/:assetId/restore', authenticate, restoreAsset);

router.put('/:assetId/owner', authenticate, assignOwner);
router.delete('/:assetId/owner', authenticate, removeOwner);
router.put('/:assetId/team', authenticate, assignTeam);
router.delete('/:assetId/team', authenticate, removeTeam);

router.get('/:assetId/history', authenticate, getAssetHistory);

module.exports = router;
