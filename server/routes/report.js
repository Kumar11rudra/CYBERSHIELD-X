/**
 * 🛡️ CyberShield X — Unified Report Routes (Phase 74)
 *
 * Integrates legacy scan exports with Phase 74 Enterprise SOC Reporting,
 * Operational Metrics, Executive Intelligence, and Scheduled Reporting.
 */

const express = require('express');
const router = express.Router();
const { generatePdfReport, exportScanReport } = require('../controllers/reportController');
const socReportController = require('../controllers/socReportController');
const { authenticate, tryAuthenticate } = require('../middleware/auth');
const { requireMinimumRole } = require('../middleware/rbac');

// ─── Legacy Scan-Level Reports (Preserved for 100% Backward Compatibility) ────
router.get('/generate-pdf/:scanId', authenticate, generatePdfReport);
router.get('/export/:format/:scanId', authenticate, exportScanReport);

// ─── Phase 74 Real Operational Metrics & Executive Intelligence ──────────────
router.get('/metrics/kpis', tryAuthenticate, socReportController.getKPIs);
router.get('/metrics/mtta-mttr', tryAuthenticate, socReportController.getMTTAMTT);
router.get('/metrics/sla', tryAuthenticate, socReportController.getSLAPerformance);
router.get('/metrics/trends', tryAuthenticate, socReportController.getTrends);
router.get('/metrics/executive-risk', tryAuthenticate, socReportController.getExecutiveRisk);

// ─── Phase 74 Scheduled Reporting (Operator / Admin) ─────────────────────────
router.get('/schedules', authenticate, requireMinimumRole('analyst'), socReportController.listSchedules);
router.post('/schedules', authenticate, requireMinimumRole('operator'), socReportController.createSchedule);
router.put('/schedules/:scheduleId', authenticate, requireMinimumRole('operator'), socReportController.updateSchedule);
router.delete('/schedules/:scheduleId', authenticate, requireMinimumRole('admin'), socReportController.deleteSchedule);
router.post('/schedules/:scheduleId/run-now', authenticate, requireMinimumRole('operator'), socReportController.runScheduleNow);

// ─── Phase 74 Enterprise SOC Reports (Generation, List, View, Export) ─────────
router.post('/generate', authenticate, requireMinimumRole('analyst'), socReportController.generateReport);
router.get('/', tryAuthenticate, socReportController.listReports);
router.get('/:reportId', tryAuthenticate, socReportController.getReport);
router.get('/:reportId/export/:format', tryAuthenticate, socReportController.exportReport);

module.exports = router;
