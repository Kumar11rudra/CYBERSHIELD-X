const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getPlatformStats,
  updateUserRole,
  deleteUser,
  toggleBanUser,
  getUserReport,
  getFirewallRules,
  addFirewallRule,
  removeFirewallRule,
  getMaintenanceStatus,
  toggleMaintenanceMode,
  getAuditLogs,
  injectTestThreat,
  getSecurityMetrics,
  getProductionTelemetry,
} = require('../controllers/adminController');
const { getMetrics } = require('../middleware/observability');
const { authenticate, requireAdmin } = require('../middleware/auth');

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// ─── Observability & Metrics ──────────────────────────────────────────────────
router.get('/metrics', (req, res) => res.json(getMetrics()));

// ─── Existing Routes ──────────────────────────────────────────────────────────
router.get('/stats', getPlatformStats);
router.get('/users', getAllUsers);
router.get('/users/:id/report', getUserReport);
router.patch('/users/:id/role', updateUserRole);
router.post('/users/:id/ban', toggleBanUser);
router.delete('/users/:id', deleteUser);
router.get('/telemetry', getProductionTelemetry);

// ─── TOOL 1: Global IP Firewall ───────────────────────────────────────────────
router.get('/firewall', getFirewallRules);
router.post('/firewall', addFirewallRule);
router.delete('/firewall/:ip', removeFirewallRule);

// ─── TOOL 2: Maintenance Mode ────────────────────────────────────────────────
router.get('/maintenance', getMaintenanceStatus);
router.post('/maintenance', toggleMaintenanceMode);

// ─── TOOL 3: Admin Audit Logs ────────────────────────────────────────────────
router.get('/audit-logs', getAuditLogs);

// ─── TOOL 4: Threat Injection (Security Testing) ─────────────────────────────
router.post('/inject-threat', injectTestThreat);

// ─── TOOL 5: Security Headers Dashboard ──────────────────────────────────────
router.get('/security-metrics', getSecurityMetrics);

module.exports = router;
