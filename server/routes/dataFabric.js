/**
 * 🛡️ CyberShield X — Security Data Fabric & Investigation Graph Routes (Phase 78)
 *
 * REST Endpoints for Unified Investigation Graph, Bounded Neighborhood Queries,
 * Shortest Path Discovery, Correlation Rules, Unified Timelines, and Snapshots.
 */

const express = require('express');
const router = express.Router();
const dataFabricController = require('../controllers/dataFabricController');
const { authenticate } = require('../middleware/auth');
const { requireMinimumRole } = require('../middleware/rbac');

// All data fabric routes require authenticated user identity
router.use(authenticate);

// ==========================================
// 1. GRAPH MATERIALIZATION & QUERIES
// ==========================================
router.post('/graph/sync', requireMinimumRole('operator'), dataFabricController.syncGraph);
router.get('/graph/neighborhood', requireMinimumRole('viewer'), dataFabricController.getNeighborhood);
router.get('/graph/path', requireMinimumRole('viewer'), dataFabricController.findPath);

// ==========================================
// 2. CORRELATION ENGINE
// ==========================================
router.get('/correlation/rules', requireMinimumRole('viewer'), dataFabricController.listCorrelationRules);
router.post('/correlation/rules', requireMinimumRole('operator'), dataFabricController.createCorrelationRule);
router.post('/correlation/rules/:ruleId/activate', requireMinimumRole('admin'), dataFabricController.activateCorrelationRule);
router.post('/correlation/rules/:ruleId/execute', requireMinimumRole('operator'), dataFabricController.executeCorrelationRule);
router.get('/correlation/results', requireMinimumRole('viewer'), dataFabricController.listCorrelationResults);

// ==========================================
// 3. UNIFIED TIMELINE FUSION
// ==========================================
router.get('/timeline', requireMinimumRole('viewer'), dataFabricController.getTimeline);

// ==========================================
// 4. GRAPH SNAPSHOTS & INTEGRITY
// ==========================================
router.post('/snapshots', requireMinimumRole('analyst'), dataFabricController.createSnapshot);
router.get('/snapshots/:snapshotId', requireMinimumRole('viewer'), dataFabricController.getSnapshot);
router.post('/snapshots/:snapshotId/verify', requireMinimumRole('analyst'), dataFabricController.verifySnapshot);
router.get('/integrity', requireMinimumRole('viewer'), dataFabricController.getGraphIntegrity);

module.exports = router;
