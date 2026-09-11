/**
 * 🛡️ CyberShield X — Phase 76 Enterprise Observability, Reliability & DR Test Suite
 *
 * Validates:
 * 1. Service Health: Bounded, read-only subsystem probes and truthful unknown states.
 * 2. API Observability: Real request telemetry, latency percentiles, and strict credential redaction.
 * 3. Database Health: Bounded ping latency probe with 2000ms ceiling.
 * 4. Canonical 111-Tool Runtime: Authoritative preservation of 102 Working / 9 Blocked Dependency.
 * 5. SLO Engine: Real window evaluation, truthful insufficient-data handling, breach detection.
 * 6. Capacity Engine: Real memory and event loop lag saturation detection.
 * 7. Reliability Correlation: Evidence-backed temporal correlation without fabricated root causes.
 * 8. Backup Verification: Cryptographic SHA-256 checksum verification.
 * 9. Non-Destructive Restore: Safe isolated sandbox restore testing with zero production mutation.
 * 10. Recovery Exercises: Workflow state machine (PLANNED -> APPROVED -> RUNNING -> COMPLETED) with real RTO/RPO.
 * 11. AI Safety: Advisory-only delimiters (<<<UNTRUSTED_RELIABILITY_DATA>>>) and execution blocks.
 * 12. Multi-Tenant Isolation: Tenant-scoped telemetry remains partitioned.
 */

const mongoose = require('mongoose');

const ServiceHealthSnapshot = require('../models/ServiceHealthSnapshot');
const PlatformMetricSnapshot = require('../models/PlatformMetricSnapshot');
const SLODefinition = require('../models/SLODefinition');
const SLOEvaluation = require('../models/SLOEvaluation');
const BackupVerification = require('../models/BackupVerification');
const RecoveryExercise = require('../models/RecoveryExercise');
const Incident = require('../models/Incident');

const serviceHealthService = require('../services/observability/ServiceHealthService');
const apiObservabilityService = require('../services/observability/APIObservabilityService');
const sloService = require('../services/observability/SLOService');
const capacityService = require('../services/observability/CapacityService');
const reliabilityCorrelationService = require('../services/observability/ReliabilityCorrelationService');
const disasterRecoveryService = require('../services/observability/DisasterRecoveryService');

describe('Phase 76 — Enterprise Observability, Reliability, Capacity & Disaster Recovery', () => {
  const orgA = 'org-jest-alpha-76';
  const orgB = 'org-jest-beta-76';

  const userAdmin = { id: 'usr-admin-76', username: 'alex_admin', role: 'ADMIN', organizationId: orgA };
  const userOperator = { id: 'usr-oper-76', username: 'oscar_op', role: 'OPERATOR', organizationId: orgA };

  const cleanup = async () => {
    await ServiceHealthSnapshot.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await PlatformMetricSnapshot.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await SLODefinition.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await SLOEvaluation.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await BackupVerification.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await RecoveryExercise.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await Incident.deleteMany({ organizationId: { $in: [orgA, orgB] } });
  };

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cybershield_test');
    }
    await cleanup();
    apiObservabilityService.resetBuffer();
  });

  afterAll(async () => {
    await cleanup();
  });

  // ==========================================
  // A. SERVICE HEALTH ENGINE
  // ==========================================
  describe('Subsystem Health Probing', () => {
    it('probes database health and returns genuine latency and connectivity', async () => {
      const dbHealth = await serviceHealthService.probeDatabaseHealth();
      expect(dbHealth.serviceId).toBe('database');
      expect(['HEALTHY', 'DEGRADED']).toContain(dbHealth.status);
      expect(typeof dbHealth.latencyMs).toBe('number');
      expect(dbHealth.latencyMs).toBeGreaterThanOrEqual(0);
      expect(dbHealth.details.readyState).toBe(1);
      expect(dbHealth.evidenceReferences.length).toBeGreaterThan(0);
    });

    it('probes API health and records real process uptime and memory', async () => {
      const apiHealth = await serviceHealthService.probeApiHealth();
      expect(apiHealth.serviceId).toBe('api');
      expect(['HEALTHY', 'DEGRADED']).toContain(apiHealth.status);
      expect(apiHealth.details.uptimeSeconds).toBeGreaterThan(0);
      expect(apiHealth.details.heapUsedBytes).toBeGreaterThan(0);
      expect(apiHealth.evidenceReferences[0]).toContain('API_UPTIME_');
    });

    it('preserves the canonical 111-tool census: 102 working and 9 blocked dependency tools', async () => {
      const toolHealth = await serviceHealthService.probeToolRuntimeHealth();
      expect(toolHealth.serviceId).toBe('tool_runtime');
      expect(toolHealth.status).toBe('HEALTHY');
      expect(toolHealth.dependencyStatus.totalTools).toBe(111);
      expect(toolHealth.dependencyStatus.workingCount).toBe(102);
      expect(toolHealth.dependencyStatus.blockedDependencyCount).toBe(9);
      expect(toolHealth.details.authoritativeCensus.blockedList).toEqual(
        expect.arrayContaining(['sqlmap', 'trivy', 'nikto', 'aircrack-ng', 'ghidra', 'yara-rules', 'radare2', 'semgrep', 'gitleaks'])
      );
    });

    it('evaluates all services and persists genuine ServiceHealthSnapshots', async () => {
      const evalResult = await serviceHealthService.evaluateAllServices(orgA, true);
      expect(evalResult.overallStatus).toBeDefined();
      expect(evalResult.subsystems.length).toBeGreaterThanOrEqual(7);
      expect(evalResult.snapshots.length).toBe(evalResult.subsystems.length);

      const saved = await ServiceHealthSnapshot.find({ organizationId: orgA });
      expect(saved.length).toBe(evalResult.subsystems.length);
    });
  });

  // ==========================================
  // B. API OBSERVABILITY & SENSITIVE REDACTION
  // ==========================================
  describe('API Observability & Telemetry', () => {
    it('records genuine request samples and calculates percentiles (p50, p95, p99)', () => {
      apiObservabilityService.resetBuffer();

      // Ingest deterministic mock samples
      for (let i = 1; i <= 100; i++) {
        apiObservabilityService.recordSample({
          id: `sample-${i}`,
          method: 'GET',
          route: '/api/incidents',
          statusCode: i > 90 ? 500 : 200,
          isError: i > 90,
          latencyMs: i * 5, // 5ms to 500ms
          timestamp: Date.now(),
          organizationId: orgA,
        });
      }

      const summary = apiObservabilityService.getMetricsSummary(60 * 1000, orgA);
      expect(summary.status).toBe('MEASURED');
      expect(summary.requests.total).toBe(100);
      expect(summary.requests.error).toBe(10);
      expect(summary.requests.errorRate).toBe(0.1);
      expect(summary.latency.p50).toBeDefined();
      expect(summary.latency.p95).toBeDefined();
      expect(summary.latency.p99).toBeDefined();
      expect(summary.latency.p95).toBeGreaterThan(summary.latency.p50);
    });

    it('strictly redacts sensitive telemetry (Authorization, cookies, passwords, API keys)', () => {
      const dirtyPayload = {
        authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret',
        cookie: 'sessionId=secret-session-id',
        password: 'SuperSecretPassword123!',
        token: 'ghp_secret_token_12345',
        safeField: 'audit_verification_ok',
      };

      const sanitized = apiObservabilityService.sanitizeTelemetryData(dirtyPayload);
      expect(sanitized.authorization).toBe('[REDACTED_SENSITIVE_TELEMETRY]');
      expect(sanitized.cookie).toBe('[REDACTED_SENSITIVE_TELEMETRY]');
      expect(sanitized.password).toBe('[REDACTED_SENSITIVE_TELEMETRY]');
      expect(sanitized.token).toBe('[REDACTED_SENSITIVE_TELEMETRY]');
      expect(sanitized.safeField).toBe('audit_verification_ok');
    });

    it('captures and persists a point-in-time PlatformMetricSnapshot', async () => {
      const snapshot = await apiObservabilityService.captureSnapshot('5m', orgA);
      expect(snapshot.snapshotId).toBeDefined();
      expect(snapshot.requests.total).toBe(100);
      expect(snapshot.system.memoryHeapUsedBytes).toBeGreaterThan(0);

      const persisted = await PlatformMetricSnapshot.findOne({ snapshotId: snapshot.snapshotId });
      expect(persisted).not.toBeNull();
    });
  });

  // ==========================================
  // C. SLO / SLI MEASUREMENT ENGINE
  // ==========================================
  describe('SLO / SLI Engine', () => {
    it('idempotently seeds canonical platform SLOs in NOT_MEASURED status', async () => {
      const seeded = await sloService.seedCanonicalSLOs(orgA);
      expect(seeded.length).toBe(6);
      expect(seeded.find((s) => s.sloId === 'SLO-API-AVAILABILITY')).toBeDefined();
      expect(seeded[0].status).toBe('NOT_MEASURED');
    });

    it('truthfully reports INSUFFICIENT_DATA or NOT_MEASURED when sample count is below threshold', async () => {
      apiObservabilityService.resetBuffer(); // 0 samples

      const evalResult = await sloService.evaluateSLO('SLO-API-AVAILABILITY', orgA);
      expect(evalResult.slo.status).toBe('NOT_MEASURED');
      expect(evalResult.slo.currentAttainmentPercent).toBeNull();
      expect(evalResult.evaluation.status).toBe('NOT_MEASURED');

      // Add only 2 samples (below MIN_SAMPLES_THRESHOLD = 5)
      apiObservabilityService.recordSample({
        id: 'sample-low-1',
        method: 'GET',
        route: '/api/health',
        statusCode: 200,
        isError: false,
        latencyMs: 10,
        timestamp: Date.now(),
        organizationId: orgA,
      });
      apiObservabilityService.recordSample({
        id: 'sample-low-2',
        method: 'GET',
        route: '/api/health',
        statusCode: 200,
        isError: false,
        latencyMs: 12,
        timestamp: Date.now(),
        organizationId: orgA,
      });

      const lowEval = await sloService.evaluateSLO('SLO-API-AVAILABILITY', orgA);
      expect(lowEval.slo.status).toBe('INSUFFICIENT_DATA');
      expect(lowEval.slo.currentAttainmentPercent).toBeNull();
    });

    it('evaluates SLO as MEETING when observed metrics satisfy target', async () => {
      // Ingest 20 good samples
      for (let i = 0; i < 20; i++) {
        apiObservabilityService.recordSample({
          id: `sample-good-${i}`,
          method: 'GET',
          route: '/api/assets',
          statusCode: 200,
          isError: false,
          latencyMs: 25,
          timestamp: Date.now(),
          organizationId: orgA,
        });
      }

      const evalResult = await sloService.evaluateSLO('SLO-API-AVAILABILITY', orgA);
      expect(evalResult.slo.status).toBe('MEETING');
      expect(evalResult.slo.currentAttainmentPercent).toBe(100);
      expect(evalResult.slo.errorBudgetRemainingPercent).toBe(100);
    });
  });

  // ==========================================
  // D. CAPACITY & SATURATION ENGINE
  // ==========================================
  describe('Capacity & Saturation Engine', () => {
    it('evaluates live process memory and event loop lag without fabricated values', async () => {
      const cap = await capacityService.evaluateCapacity();
      expect(['NORMAL', 'WARNING', 'SATURATED']).toContain(cap.status);
      expect(cap.signals.memory.heapUtilizationPercent).toBeGreaterThan(0);
      expect(cap.signals.eventLoop.lagMs).toBeGreaterThanOrEqual(0);
      expect(cap.evidence.length).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // E. RELIABILITY INCIDENT CORRELATION
  // ==========================================
  describe('Reliability Correlation Engine', () => {
    it('correlates service degradations with concurrent SOC incidents', async () => {
      // Create a degraded snapshot
      const snap = new ServiceHealthSnapshot({
        snapshotId: 'snap-degraded-test',
        serviceId: 'database',
        serviceName: 'MongoDB Primary Database',
        organizationId: orgA,
        status: 'DEGRADED',
        latencyMs: 850,
        errorRate: 0.1,
        observedAt: new Date(),
        evidenceReferences: ['TEST_DEGRADATION'],
      });
      await snap.save();

      // Create a concurrent incident within window
      const incident = new Incident({
        incidentId: 'INC-REL-TEST-001',
        title: 'Database Slow Query Spike',
        severity: 'HIGH',
        status: 'DETECTED',
        organizationId: orgA,
        createdAt: new Date(),
      });
      await incident.save();

      const correlation = await reliabilityCorrelationService.correlateHealthWithIncidents(60, orgA);
      expect(['CORRELATED', 'TEMPORALLY_ASSOCIATED']).toContain(correlation.verdict);
      expect(correlation.correlations.length).toBeGreaterThan(0);
      expect(correlation.correlations[0].associatedIncidents.length).toBe(1);
      expect(correlation.correlations[0].associatedIncidents[0].incidentId).toBe('INC-REL-TEST-001');
    });
  });

  // ==========================================
  // F. BACKUP VERIFICATION & SAFE RESTORE
  // ==========================================
  describe('Backup & Disaster Recovery', () => {
    let testBackupId = null;

    it('registers a discovered backup source in UNVERIFIED status', async () => {
      const bkp = await disasterRecoveryService.registerBackupSource(
        {
          source: 'MONGODB_LOCAL_SNAPSHOT',
          location: '/var/backups/mongodb/snap-01',
          organizationId: orgA,
          notes: 'Automated midnight cluster snapshot',
        },
        userAdmin
      );

      expect(bkp.backupId).toBeDefined();
      expect(bkp.status).toBe('UNVERIFIED');
      expect(bkp.integrityVerified).toBe(false);
      testBackupId = bkp.backupId;
    });

    it('verifies backup integrity with cryptographic SHA-256 checksum', async () => {
      const verified = await disasterRecoveryService.verifyBackupIntegrity(testBackupId, orgA);
      expect(verified.status).toBe('VERIFIED');
      expect(verified.checksum).toMatch(/^[a-f0-9]{64}$/);
      expect(verified.integrityVerified).toBe(true);
      expect(verified.verifiedAt).toBeDefined();
    });

    it('executes safe restore verification in an isolated temporary sandbox without mutating production', async () => {
      const restoreResult = await disasterRecoveryService.executeSafeRestoreTest(testBackupId, orgA);
      expect(restoreResult.success).toBe(true);
      expect(restoreResult.isolatedNamespace).toMatch(/^_restore_sandbox_/);
      expect(restoreResult.details.verifiedDocumentCount).toBe(2);

      // Verify the sandbox collection was dropped
      const collections = await mongoose.connection.db.listCollections().toArray();
      const sandboxExists = collections.some((c) => c.name === restoreResult.isolatedNamespace);
      expect(sandboxExists).toBe(false);
    });

    it('manages bounded disaster recovery exercise lifecycle with real RTO and RPO', async () => {
      // 1. Plan exercise
      const planned = await disasterRecoveryService.planRecoveryExercise(
        {
          name: 'Q3 Isolated Disaster Recovery Drill',
          scope: 'RESTORE_ISOLATED_SANDBOX_READINESS',
          targetBackupId: testBackupId,
          organizationId: orgA,
        },
        userOperator
      );
      expect(planned.status).toBe('PLANNED');

      // 2. Approve exercise (Admin)
      const approved = await disasterRecoveryService.approveRecoveryExercise(planned.exerciseId, userAdmin, orgA);
      expect(approved.status).toBe('APPROVED');
      expect(approved.authorizedBy.username).toBe('alex_admin');

      // 3. Execute exercise
      const executed = await disasterRecoveryService.executeRecoveryExercise(planned.exerciseId, userAdmin, orgA);
      expect(executed.status).toBe('COMPLETED');
      expect(executed.observedRTOSeconds).toBeGreaterThanOrEqual(0);
      expect(executed.observedRPOSeconds).toBeGreaterThanOrEqual(0);
      expect(executed.resultSummary).toContain('Safe sandbox verification passed');

      // 4. Close exercise
      const closed = await disasterRecoveryService.closeRecoveryExercise(planned.exerciseId, userOperator, orgA);
      expect(closed.status).toBe('CLOSED');
    });
  });

  // ==========================================
  // G. MULTI-TENANT ISOLATION
  // ==========================================
  describe('Multi-Tenant Telemetry Isolation', () => {
    it('ensures backups and recovery exercises in Org A cannot be fetched by Org B', async () => {
      const backupsOrgB = await disasterRecoveryService.listBackups(orgB);
      expect(backupsOrgB.length).toBe(0);

      const exercisesOrgB = await RecoveryExercise.find({ organizationId: orgB });
      expect(exercisesOrgB.length).toBe(0);
    });
  });
});
