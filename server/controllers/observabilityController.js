/**
 * 🛡️ CyberShield X — Observability & Reliability Controller (Phase 76)
 *
 * REST Controller for Platform Health, API Telemetry, Database Diagnostics,
 * SLO Evaluation, Capacity Saturation, Incident Correlation,
 * Backup Verification, and Disaster Recovery Exercises.
 */

const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();
const serviceHealthService = require('../services/observability/ServiceHealthService');
const apiObservabilityService = require('../services/observability/APIObservabilityService');
const sloService = require('../services/observability/SLOService');
const capacityService = require('../services/observability/CapacityService');
const reliabilityCorrelationService = require('../services/observability/ReliabilityCorrelationService');
const disasterRecoveryService = require('../services/observability/DisasterRecoveryService');

const ServiceHealthSnapshot = require('../models/ServiceHealthSnapshot');
const PlatformMetricSnapshot = require('../models/PlatformMetricSnapshot');
const SLODefinition = require('../models/SLODefinition');
const SLOEvaluation = require('../models/SLOEvaluation');
const RecoveryExercise = require('../models/RecoveryExercise');
const BackupVerification = require('../models/BackupVerification');

class ObservabilityController {
  // ==========================================
  // 1. SUBSYSTEM & PLATFORM HEALTH
  // ==========================================

  async getPlatformHealth(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const result = await serviceHealthService.evaluateAllServices(orgId, false);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async triggerHealthProbe(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const result = await serviceHealthService.evaluateAllServices(orgId, true);
      res.json({
        success: true,
        message: 'Live subsystem probe completed successfully',
        data: result,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getHealthHistory(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { serviceId, limit = 50 } = req.query;

      const filter = {};
      if (orgId) filter.organizationId = orgId;
      if (serviceId) filter.serviceId = serviceId;

      const history = await ServiceHealthSnapshot.find(filter)
        .sort({ observedAt: -1 })
        .limit(Math.min(Number(limit), 200))
        .lean();

      res.json({ success: true, count: history.length, data: history });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // 2. API TELEMETRY & METRIC SNAPSHOTS
  // ==========================================

  async getApiMetrics(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const windowMs = Number(req.query.windowMs) || 15 * 60 * 1000;

      const metrics = apiObservabilityService.getMetricsSummary(windowMs, orgId);
      res.json({ success: true, data: metrics });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async captureMetricSnapshot(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const period = req.body.period || '5m';

      const snapshot = await apiObservabilityService.captureSnapshot(period, orgId);
      res.json({ success: true, message: 'Platform metric snapshot captured', data: snapshot });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getMetricSnapshots(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { limit = 20 } = req.query;

      const filter = {};
      if (orgId) filter.organizationId = orgId;

      const snapshots = await PlatformMetricSnapshot.find(filter)
        .sort({ timestamp: -1 })
        .limit(Math.min(Number(limit), 100))
        .lean();

      res.json({ success: true, count: snapshots.length, data: snapshots });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // 3. CAPACITY & SATURATION
  // ==========================================

  async getCapacity(req, res) {
    try {
      const capacity = await capacityService.evaluateCapacity();
      res.json({ success: true, data: capacity });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // 4. SLO DEFINITIONS & EVALUATIONS
  // ==========================================

  async listSLOs(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const slos = await SLODefinition.find({
        $or: [{ organizationId: orgId }, { organizationId: null }],
      }).sort({ service: 1 }).lean();

      res.json({ success: true, count: slos.length, data: slos });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async seedCanonicalSLOs(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const seeded = await sloService.seedCanonicalSLOs(orgId);
      res.json({
        success: true,
        message: `Successfully seeded ${seeded.length} canonical SLOs`,
        data: seeded,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async createSLO(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { name, description, service, metricType, targetPercent, thresholdMs, windowDays } = req.body;

      if (!name || !service || !metricType || targetPercent === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, service, metricType, targetPercent',
        });
      }

      const sloId = `SLO-${service.toUpperCase()}-${uuidv4().substring(0, 6).toUpperCase()}`;

      const slo = new SLODefinition({
        sloId,
        name,
        description: description || '',
        service,
        metricType,
        targetPercent: Number(targetPercent),
        thresholdMs: thresholdMs ? Number(thresholdMs) : null,
        windowDays: windowDays ? Number(windowDays) : 7,
        status: 'NOT_MEASURED',
        organizationId: orgId,
        createdBy: req.user?.username || 'ADMIN',
      });

      await slo.save();
      res.status(201).json({ success: true, message: 'Custom SLO created', data: slo });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async evaluateSLO(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { sloId } = req.params;

      const result = await sloService.evaluateSLO(sloId, orgId);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async evaluateAllSLOs(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const results = await sloService.evaluateAll(orgId);
      res.json({
        success: true,
        message: `Evaluated ${results.length} registered SLOs`,
        data: results,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getSLOHistory(req, res) {
    try {
      const { sloId } = req.params;
      const evaluations = await SLOEvaluation.find({ sloId })
        .sort({ evaluatedAt: -1 })
        .limit(20)
        .lean();

      res.json({ success: true, count: evaluations.length, data: evaluations });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // 5. RELIABILITY & INCIDENT CORRELATIONS
  // ==========================================

  async getCorrelations(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const windowMinutes = Number(req.query.windowMinutes) || 60;

      const correlation = await reliabilityCorrelationService.correlateHealthWithIncidents(
        windowMinutes,
        orgId
      );
      res.json({ success: true, data: correlation });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // 6. BACKUP INVENTORY & DISASTER RECOVERY
  // ==========================================

  async listBackups(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const backups = await disasterRecoveryService.listBackups(orgId);
      res.json({ success: true, count: backups.length, data: backups });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async registerBackup(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const backup = await disasterRecoveryService.registerBackupSource(
        { ...req.body, organizationId: orgId },
        req.user
      );
      res.status(201).json({ success: true, message: 'Backup source registered', data: backup });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async verifyBackup(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { backupId } = req.params;

      const verified = await disasterRecoveryService.verifyBackupIntegrity(backupId, orgId);
      res.json({
        success: true,
        message: 'Cryptographic SHA-256 integrity check completed',
        data: verified,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async testRestore(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { backupId } = req.params;

      const result = await disasterRecoveryService.executeSafeRestoreTest(backupId, orgId);
      res.json({
        success: true,
        message: 'Safe non-destructive isolated restore test passed',
        data: result,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // 7. RECOVERY EXERCISES WORKFLOW
  // ==========================================

  async listRecoveryExercises(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const exercises = await RecoveryExercise.find({
        ...(orgId ? { organizationId: orgId } : {}),
      })
        .sort({ createdAt: -1 })
        .lean();

      res.json({ success: true, count: exercises.length, data: exercises });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async planRecoveryExercise(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { name, scope, targetBackupId } = req.body;

      if (!name || !scope) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, scope',
        });
      }

      const exercise = await disasterRecoveryService.planRecoveryExercise(
        { name, scope, targetBackupId, organizationId: orgId },
        req.user
      );

      res.status(201).json({
        success: true,
        message: 'Recovery exercise planned in PLANNED status',
        data: exercise,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async approveRecoveryExercise(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { exerciseId } = req.params;

      const approved = await disasterRecoveryService.approveRecoveryExercise(
        exerciseId,
        req.user,
        orgId
      );

      res.json({
        success: true,
        message: 'Recovery exercise authorized and transitioned to APPROVED',
        data: approved,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async executeRecoveryExercise(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { exerciseId } = req.params;

      const result = await disasterRecoveryService.executeRecoveryExercise(
        exerciseId,
        req.user,
        orgId
      );

      res.json({
        success: true,
        message: 'Recovery exercise completed with real observed RTO & RPO measurements',
        data: result,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async closeRecoveryExercise(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { exerciseId } = req.params;

      const closed = await disasterRecoveryService.closeRecoveryExercise(
        exerciseId,
        req.user,
        orgId
      );

      res.json({
        success: true,
        message: 'Recovery exercise transitioned to CLOSED status',
        data: closed,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // 8. CANONICAL 111-TOOL RUNTIME HEALTH
  // ==========================================

  async getToolRuntimeHealth(req, res) {
    try {
      const health = await serviceHealthService.probeToolRuntimeHealth();
      res.json({ success: true, data: health });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // 9. RELIABILITY ALERTS
  // ==========================================

  async getReliabilityAlerts(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const alerts = [];

      // Check for breached SLOs
      const breachedSLOs = await SLODefinition.find({
        status: { $in: ['BREACHED', 'AT_RISK'] },
        ...(orgId ? { organizationId: orgId } : {}),
      }).lean();

      for (const slo of breachedSLOs) {
        alerts.push({
          alertId: `ALERT-SLO-${slo.sloId}`,
          severity: slo.status === 'BREACHED' ? 'HIGH' : 'MEDIUM',
          title: `SLO ${slo.status}: ${slo.name}`,
          source: 'SLO_ENGINE',
          details: `Target: ${slo.targetPercent}%, Observed: ${slo.currentAttainmentPercent !== null ? slo.currentAttainmentPercent + '%' : 'N/A'}. Error budget remaining: ${slo.errorBudgetRemainingPercent !== null ? slo.errorBudgetRemainingPercent + '%' : '0%'}.`,
          timestamp: slo.lastEvaluatedAt || slo.updatedAt,
        });
      }

      // Check capacity
      const capacity = await capacityService.evaluateCapacity();
      if (capacity.status === 'WARNING' || capacity.status === 'SATURATED') {
        alerts.push({
          alertId: `ALERT-CAPACITY-${capacity.status}`,
          severity: capacity.status === 'SATURATED' ? 'CRITICAL' : 'HIGH',
          title: `Capacity Saturation Warning: ${capacity.status}`,
          source: 'CAPACITY_ENGINE',
          details: `Heap utilization: ${capacity.signals.memory.heapUtilizationPercent}%, Event loop lag: ${capacity.signals.eventLoop.lagMs}ms.`,
          timestamp: capacity.observedAt,
        });
      }

      // Check backups
      const failedBackups = await BackupVerification.find({
        status: 'FAILED',
        ...(orgId ? { organizationId: orgId } : {}),
      }).lean();

      for (const bkp of failedBackups) {
        alerts.push({
          alertId: `ALERT-BACKUP-${bkp.backupId}`,
          severity: 'HIGH',
          title: `Backup Verification Failure: ${bkp.backupId}`,
          source: 'DISASTER_RECOVERY',
          details: `Integrity check or isolated restore test failed for backup source: ${bkp.source}.`,
          timestamp: bkp.verifiedAt || bkp.updatedAt,
        });
      }

      res.json({ success: true, count: alerts.length, data: alerts });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new ObservabilityController();
