/**
 * 🛡️ CyberShield X — Approval Routes (Phase 70)
 */

const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approvalController');
const { authenticate, tryAuthenticate } = require('../middleware/auth');
const { requireMinimumRole } = require('../middleware/rbac');

// Read approval queue (Analyst and above)
router.get('/', tryAuthenticate, approvalController.listApprovals);

// Propose action (Analyst and above)
router.post('/', authenticate, requireMinimumRole('analyst'), approvalController.proposeAction);

// Approve / Deny action (Operator and above)
router.post('/:approvalId/approve', authenticate, requireMinimumRole('operator'), approvalController.approveAction);
router.post('/:approvalId/deny', authenticate, requireMinimumRole('operator'), approvalController.denyAction);

module.exports = router;
