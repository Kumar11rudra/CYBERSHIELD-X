/**
 * 🛡️ CyberShield X — Observability & Reliability Routes (Phase 76)
 *
 * REST Endpoints for Platform Health, Real-Time API Telemetry,
 * SLO Evaluation, Resource Capacity, Incident Correlation,
 * Backup Verification, and Disaster Recovery Exercises.
 */

const express = require('express');
const router = express.Router();
const observabilityController = require('../controllers/observabilityController');
const { authenticate } = require('../middleware/auth');
const { requireMinimumRole } = require('../middleware/rbac');

// All observability routes require authenticated identity
router.use(authenticate);

// ==========================================
// 1. SUBSYSTEM & PLATFORM HEALTH
// ==========================================

// Read health status (Viewer+)
router.get('/health', requireMinimumRole('viewer'), observabilityController.getPlatformHealth);
router.get('/health/history', requireMinimumRole('viewer'), observabilityController.getHealthHistory);

// Trigger live subsystem probe (Operator+)
router.post('/health/probe', requireMinimumRole('operator'), observabilityController.triggerHealthProbe);

// Canonical 111-tool runtime state (Viewer+)
router.get('/health/tools', requireMinimumRole('viewer'), observabilityController.getToolRuntimeHealth);

// ==========================================
// 2. API TELEMETRY & METRIC SNAPSHOTS
// ==========================================

router.get('/metrics/api', requireMinimumRole('viewer'), observabilityController.getApiMetrics);
router.get('/metrics/snapshots', requireMinimumRole('viewer'), observabilityController.getMetricSnapshots);
router.post('/metrics/snapshots', requireMinimumRole('operator'), observabilityController.captureMetricSnapshot);

// ==========================================
// 3. CAPACITY & SATURATION
// ==========================================

router.get('/capacity', requireMinimumRole('viewer'), observabilityController.getCapacity);

// ==========================================
// 4. SERVICE LEVEL OBJECTIVES (SLO/SLI)
// ==========================================

router.get('/slos', requireMinimumRole('viewer'), observabilityController.listSLOs);
router.get('/slos/:sloId/history', requireMinimumRole('viewer'), observabilityController.getSLOHistory);

// Seed canonical SLOs (Operator+)
router.post('/slos/seed', requireMinimumRole('operator'), observabilityController.seedCanonicalSLOs);

// Custom SLO creation (Admin)
router.post('/slos', requireMinimumRole('admin'), observabilityController.createSLO);

// Evaluate SLOs (Operator+)
router.post('/slos/evaluate-all', requireMinimumRole('operator'), observabilityController.evaluateAllSLOs);
router.post('/slos/:sloId/evaluate', requireMinimumRole('operator'), observabilityController.evaluateSLO);

// ==========================================
// 5. RELIABILITY CORRELATIONS
// ==========================================

router.get('/correlations', requireMinimumRole('viewer'), observabilityController.getCorrelations);

// ==========================================
// 6. BACKUP INVENTORY & RESTORE VERIFICATION
// ==========================================

router.get('/backups', requireMinimumRole('viewer'), observabilityController.listBackups);

// Register backup source (Operator+)
router.post('/backups/register', requireMinimumRole('operator'), observabilityController.registerBackup);

// Verify backup checksum and run non-destructive isolated restore test (Admin)
router.post('/backups/:backupId/verify', requireMinimumRole('admin'), observabilityController.verifyBackup);
router.post('/backups/:backupId/test-restore', requireMinimumRole('admin'), observabilityController.testRestore);

// ==========================================
// 7. DISASTER RECOVERY EXERCISES
// ==========================================

router.get('/recovery/exercises', requireMinimumRole('viewer'), observabilityController.listRecoveryExercises);

// Plan recovery exercise (Operator+)
router.post('/recovery/exercises', requireMinimumRole('operator'), observabilityController.planRecoveryExercise);

// Authorize recovery exercise (Admin ONLY)
router.post('/recovery/exercises/:exerciseId/approve', requireMinimumRole('admin'), observabilityController.approveRecoveryExercise);

// Execute approved recovery exercise (Admin ONLY)
router.post('/recovery/exercises/:exerciseId/execute', requireMinimumRole('admin'), observabilityController.executeRecoveryExercise);

// Close exercise (Operator+)
router.post('/recovery/exercises/:exerciseId/close', requireMinimumRole('operator'), observabilityController.closeRecoveryExercise);

// ==========================================
// 8. RELIABILITY ALERTS
// ==========================================

router.get('/alerts', requireMinimumRole('viewer'), observabilityController.getReliabilityAlerts);

module.exports = router;
