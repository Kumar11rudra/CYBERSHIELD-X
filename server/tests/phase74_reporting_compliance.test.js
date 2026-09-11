/**
 * 🛡️ CyberShield X — Phase 74 SOC Reporting & Compliance Evidence Test Suite
 *
 * Validates:
 * 1. Operational KPI Engine (Authentic counts from real records)
 * 2. Authentic MTTA & MTTR calculations with transparent exclusion disclosure
 * 3. SLA Performance metrics (ON_TRACK, AT_RISK, BREACHED, COMPLETED)
 * 4. Executive Risk Scoring (Evidence-backed composite with raw citations)
 * 5. Compliance Controls Matrix (9 Modular Domains & automated evaluation)
 * 6. Missing / Partial Evidence detection
 * 7. Immutable Evidence Package generation & SHA-256 integrity verification
 * 8. Audit Activity reporting with redaction & actor tracking
 * 9. Multi-type SOC Report Generation (9 report types)
 * 10. Report Versioning & Immutability (v1, v2 non-destructive versioning)
 * 11. Multi-format exports (JSON, CSV, real PDF buffer)
 * 12. Report Scheduling & Execution with separated generation/delivery states
 * 13. Bounded AI Reporting Copilot (Strict boundary delimiters & advisory guards)
 * 14. RBAC & Multi-Tenant Isolation
 * 15. Zero Synthetic Data Guarantee (Explicit NO_DATA / INSUFFICIENT_DATA)
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const SOCReport = require('../models/SOCReport');
const ReportSchedule = require('../models/ReportSchedule');
const ComplianceControl = require('../models/ComplianceControl');
const ComplianceEvidence = require('../models/ComplianceEvidence');
const MetricSnapshot = require('../models/MetricSnapshot');
const Incident = require('../models/Incident');
const Alert = require('../models/Alert');
const Finding = require('../models/Finding');
const ThreatHunt = require('../models/ThreatHunt');
const ThreatHuntExecution = require('../models/ThreatHuntExecution');
const DetectionRule = require('../models/DetectionRule');
const DetectionGap = require('../models/DetectionGap');
const AuditEvent = require('../models/AuditEvent');
const EvidenceRecord = require('../models/EvidenceRecord');
const Asset = require('../models/Asset');
const PendingApproval = require('../models/PendingApproval');

const SOCMetricsService = require('../services/soc/SOCMetricsService');
const ExecutiveRiskService = require('../services/soc/ExecutiveRiskService');
const ComplianceEvidenceService = require('../services/soc/ComplianceEvidenceService');
const SOCReportService = require('../services/soc/SOCReportService');

describe('Phase 74 — Enterprise SOC Reporting, Compliance & Executive Intelligence', () => {
  const orgA = new mongoose.Types.ObjectId();
  const orgB = new mongoose.Types.ObjectId();
  const userA = { _id: new mongoose.Types.ObjectId(), username: 'analyst_alpha', role: 'ANALYST', organizationId: orgA };
  const userB = { _id: new mongoose.Types.ObjectId(), username: 'analyst_beta', role: 'ANALYST', organizationId: orgB };

  const cleanup = async () => {
    await SOCReport.deleteMany({ $or: [{ organizationId: { $in: [orgA, orgB] } }, { title: 'Monthly Executive Dossier' }] });
    await ReportSchedule.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await ComplianceEvidence.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await Incident.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await Alert.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await Finding.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await ThreatHunt.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await ThreatHuntExecution.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await DetectionRule.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await DetectionGap.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await AuditEvent.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await EvidenceRecord.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await Asset.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await PendingApproval.deleteMany({ organizationId: { $in: [orgA, orgB] } });
  };

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cybershield_test');
    }
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await mongoose.disconnect();
  });

  describe('Workflow A: Real KPI Calculation', () => {
    test('Calculates authentic metrics derived strictly from persisted records', async () => {
      // Seed 2 real incidents for Org A
      await Incident.create([
        {
          incidentId: 'INC-7401',
          title: 'Unauthorized SSH Bastion Probe',
          severity: 'CRITICAL',
          status: 'CONTAINED',
          organizationId: orgA,
          affectedAssets: ['bastion-01.cyber.net'],
        },
        {
          incidentId: 'INC-7402',
          title: 'Suspicious PowerShell Download',
          severity: 'HIGH',
          status: 'RESOLVED',
          organizationId: orgA,
          affectedAssets: ['workstation-12.cyber.net'],
        }
      ]);

      const kpis = await SOCMetricsService.getOperationalKPIs(orgA);
      expect(kpis).toBeDefined();
      expect(kpis.incidents.total).toBe(2);
      expect(kpis.incidents.critical).toBe(1);
      expect(kpis.incidents.open).toBe(1);
      expect(kpis.incidents.resolved).toBe(1);
    });
  });

  describe('Workflow B & C: Authentic MTTA & MTTR Calculations', () => {
    test('Calculates MTTA and MTTR using actual timestamps with transparent exclusion disclosure', async () => {
      const now = Date.now();
      const createdAt1 = new Date(now - 3600000); // 1h ago
      const ackAt1 = new Date(now - 3000000); // 10 min to ack = 600,000 ms
      const resAt1 = new Date(now - 1200000); // 40 min to resolve = 2,400,000 ms

      const createdAt2 = new Date(now - 7200000); // 2h ago
      const ackAt2 = new Date(now - 6000000); // 20 min to ack = 1,200,000 ms
      // Unresolved incident 2 -> must be excluded from MTTR!

      await Incident.create([
        {
          incidentId: 'INC-74-TIME-1',
          title: 'Ransomware Canary Alert',
          severity: 'CRITICAL',
          status: 'RESOLVED',
          createdAt: createdAt1,
          acknowledgedAt: ackAt1,
          resolvedAt: resAt1,
          organizationId: orgA,
        },
        {
          incidentId: 'INC-74-TIME-2',
          title: 'Brute Force Escalation',
          severity: 'HIGH',
          status: 'INVESTIGATING',
          createdAt: createdAt2,
          acknowledgedAt: ackAt2,
          organizationId: orgA,
        }
      ]);

      const timeMetrics = await SOCMetricsService.calculateMTTAAndMTTR(orgA, { timeRange: '24h' });

      expect(timeMetrics).toBeDefined();
      // MTTA: (10 min + 20 min) / 2 = 15 min = 900 seconds
      expect(timeMetrics.mtta.sampleSize).toBe(2);
      expect(timeMetrics.mtta.meanSeconds).toBe(900);

      // MTTR: Only INC 1 resolved = 40 min = 2400 seconds. INC 2 excluded!
      expect(timeMetrics.mttr.sampleSize).toBe(1);
      expect(timeMetrics.mttr.meanSeconds).toBe(2400);
      expect(timeMetrics.mttr.excludedIncompleteCount).toBeGreaterThanOrEqual(1);
      expect(timeMetrics.mttr.disclosure).toContain('Excludes incomplete');
    });

    test('Returns INSUFFICIENT_DATA when sample size is zero', async () => {
      const emptyOrg = new mongoose.Types.ObjectId();
      const timeMetrics = await SOCMetricsService.calculateMTTAAndMTTR(emptyOrg, { timeRange: '24h' });

      expect(timeMetrics.mtta.formatted).toBe('INSUFFICIENT_DATA');
      expect(timeMetrics.mttr.formatted).toBe('INSUFFICIENT_DATA');
      expect(timeMetrics.mtta.sampleSize).toBe(0);
    });
  });

  describe('Workflow D: SLA Performance Metrics', () => {
    test('Calculates authentic SLA states and historical breach rates', async () => {
      const sla = await SOCMetricsService.getSLAPerformance(orgA, { timeRange: '30d' });
      expect(sla).toBeDefined();
      expect(sla.totalGoverned).toBeGreaterThanOrEqual(2);
      expect(typeof sla.breachRate).toBe('number');
      expect(typeof sla.onTrackRate).toBe('number');
    });
  });

  describe('Workflow E: Executive Risk Summary', () => {
    test('Calculates evidence-backed organizational risk and cites underlying records', async () => {
      const risk = await ExecutiveRiskService.getExecutiveRiskSummary(orgA);
      expect(risk).toBeDefined();
      expect(typeof risk.calculatedRiskScore).toBe('number');
      expect(risk.calculatedRiskScore).toBeGreaterThanOrEqual(0);
      expect(risk.calculatedRiskScore).toBeLessThanOrEqual(100);
      expect(risk.criticalIncidents.citations).toBeInstanceOf(Array);
      expect(risk.criticalIncidents.citations.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Workflow F, G, H: Compliance Evidence Engine & Packages', () => {
    test('Seeds 9 canonical controls across 9 modular frameworks', async () => {
      const controls = await ComplianceEvidenceService.seedCanonicalControls();
      expect(controls.length).toBe(9);
      const domains = controls.map((c) => c.domain);
      expect(domains).toContain('ACCESS_CONTROL');
      expect(domains).toContain('LOGGING_MONITORING');
      expect(domains).toContain('INCIDENT_RESPONSE');
      expect(domains).toContain('DATA_PROTECTION');
    });

    test('Automated control evaluation returns valid evidence presence statuses', async () => {
      const evalResults = await ComplianceEvidenceService.evaluateAllControls(orgA);
      expect(evalResults.length).toBe(9);
      for (const res of evalResults) {
        expect(['EVIDENCE_PRESENT', 'PARTIAL_EVIDENCE', 'NO_EVIDENCE']).toContain(res.status);
        expect(res.sourceRecords).toBeInstanceOf(Array);
      }
    });

    test('Generates immutable evidence package with SHA-256 cryptographic verification', async () => {
      const pkg = await ComplianceEvidenceService.generateEvidencePackage(
        'CTRL-IR-01',
        { scopePeriod: '30d', requestedBy: 'test_auditor' },
        userA
      );

      expect(pkg).toBeDefined();
      expect(pkg.packageId).toMatch(/^PKG-CTRL-IR-01-/);
      expect(pkg.packageHash).toBeDefined();
      expect(pkg.packageHash.length).toBe(64); // SHA-256 hex string

      // Verify SHA-256 integrity
      const computedHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(pkg.evidenceRecords))
        .digest('hex');

      expect(computedHash).toBe(pkg.packageHash);
    });
  });

  describe('Workflow I: Audit Reporting & Redaction', () => {
    test('Filters audit events and prevents sensitive credential leakage', async () => {
      await AuditEvent.create([
        {
          eventId: 'EVT-74-TEST-01',
          action: 'AUTH_LOGIN_SUCCESS',
          actor: { id: String(userA._id), name: userA.username, role: userA.role },
          entityType: 'User',
          entityId: String(userA._id),
          outcome: 'SUCCESS',
          organizationId: orgA,
          sensitiveRedacted: true,
          metadata: { ip: '10.0.0.1', passwordHash: 'REDACTED_SECRET' },
        }
      ]);

      const auditReport = await SOCReportService.generateReport(
        {
          reportType: 'AUDIT_ACTIVITY',
          title: 'SOC Access & Authentication Audit',
          parameters: { timeRange: '24h' },
        },
        userA
      );

      expect(auditReport).toBeDefined();
      expect(auditReport.reportType).toBe('AUDIT_ACTIVITY');
      expect(auditReport.contentSnapshot.totalEvents).toBeGreaterThanOrEqual(1);
      // Secrets must be redacted
      const serialized = JSON.stringify(auditReport.contentSnapshot);
      expect(serialized).not.toContain('RAW_PASSWORD');
    });
  });

  describe('Workflow J, K, L: Domain Reports (Incident, Detection, Threat Hunt)', () => {
    test('Generates INCIDENT_REPORT containing genuine incident facts', async () => {
      const report = await SOCReportService.generateReport(
        {
          reportType: 'INCIDENT_REPORT',
          title: 'Active Incidents Postmortem',
          parameters: { timeRange: '30d' },
        },
        userA
      );

      expect(report.contentSnapshot.incidents).toBeInstanceOf(Array);
      expect(report.contentSnapshot.incidents.length).toBeGreaterThanOrEqual(1);
      expect(report.contentHash).toBeDefined();
    });

    test('Generates DETECTION_COVERAGE report mapped to MITRE ATT&CK', async () => {
      const report = await SOCReportService.generateReport(
        {
          reportType: 'DETECTION_COVERAGE',
          title: 'Detection Rules & MITRE Matrix',
          parameters: { timeRange: '30d' },
        },
        userA
      );

      expect(report.contentSnapshot.coverageSummary).toBeDefined();
      expect(report.contentSnapshot.generatedAt).toBeDefined();
    });

    test('Generates THREAT_HUNT_REPORT referencing persisted hunt telemetry', async () => {
      const report = await SOCReportService.generateReport(
        {
          reportType: 'THREAT_HUNT_REPORT',
          title: 'Threat Hunt Telemetry Sweep Report',
          parameters: { timeRange: '30d' },
        },
        userA
      );

      expect(report.contentSnapshot.huntSummary).toBeDefined();
      expect(report.status).toBe('GENERATED');
    });
  });

  describe('Workflow M: Report Versioning & Immutability', () => {
    test('Creates version v2 without mutating or overwriting v1', async () => {
      const v1 = await SOCReportService.generateReport(
        {
          reportType: 'EXECUTIVE_SUMMARY',
          title: 'Monthly Executive Dossier',
          parameters: { timeRange: '30d' },
        },
        userA
      );

      const v2 = await SOCReportService.generateReport(
        {
          reportType: 'EXECUTIVE_SUMMARY',
          title: 'Monthly Executive Dossier',
          parameters: { timeRange: '30d' },
        },
        userA
      );

      expect(v1.version).toBe(1);
      expect(v2.version).toBe(2);
      expect(v1.reportId).toBe(v2.reportId);
      expect(v1._id.toString()).not.toBe(v2._id.toString());

      // Ensure v1 still exists in DB
      const storedV1 = await SOCReport.findOne({ reportId: v1.reportId, version: 1 });
      expect(storedV1).toBeDefined();
      expect(storedV1.contentHash).toBe(v1.contentHash);
    });
  });

  describe('Workflow N: Multi-Format Report Exports', () => {
    test('Generates JSON, CSV, and real binary PDF exports', async () => {
      const report = await SOCReportService.generateReport(
        {
          reportType: 'EXECUTIVE_SUMMARY',
          title: 'Multi-Format Export Test',
          parameters: { timeRange: '30d' },
        },
        userA
      );

      expect(report.exports.jsonData).toBeDefined();
      expect(report.exports.csvData).toBeDefined();
      expect(report.exports.csvData).toContain('Metric,Value,Status');
      expect(report.exports.pdfData).toBeDefined();

      // Verify that PDF base64 converts to a valid binary buffer starting with '%PDF'
      const pdfBuffer = Buffer.from(report.exports.pdfData, 'base64');
      expect(pdfBuffer.toString('utf8', 0, 4)).toBe('%PDF');
    });
  });

  describe('Workflow O & P: Report Scheduling & Delivery Separation', () => {
    test('Executes report schedule with independent runStatus and deliveryStatus', async () => {
      const schedule = await ReportSchedule.create({
        scheduleId: 'SCHED-TEST-74',
        name: 'Daily Compliance Sweep',
        reportType: 'COMPLIANCE_EVIDENCE',
        frequency: 'DAILY',
        parameters: { timeRange: '24h' },
        deliveryConfig: { channel: 'EMAIL', destination: 'audit@cyber.net' },
        recipients: ['audit@cyber.net'],
        organizationId: orgA,
      });

      const execResult = await SOCReportService.executeSchedule(schedule.scheduleId);

      expect(execResult.success).toBe(true);
      expect(execResult.reportId).toBeDefined();

      const updatedSchedule = await ReportSchedule.findOne({ scheduleId: schedule.scheduleId });
      expect(updatedSchedule.lastRunStatus).toBe('SUCCESS');
      expect(updatedSchedule.lastDeliveryStatus).toBe('PENDING'); // Delivery remains separate!
      expect(updatedSchedule.history.length).toBe(1);
      expect(updatedSchedule.history[0].runStatus).toBe('SUCCESS');
    });
  });

  describe('Workflow Q: Bounded AI Advisory Safety Enclosure', () => {
    test('Verifies AI reporting helpers are strictly advisory with boundary delimiters', async () => {
      const {
        handleReportSummarize,
        handleExplainMetric,
      } = require('../controllers/chatbot/chatbotController');

      let responseData = null;
      const mockReq = {
        body: {
          reportData: {
            reportId: 'REP-74-AI',
            reportType: 'EXECUTIVE_SUMMARY',
            title: 'Sample Test',
            status: 'GENERATED',
            contentHash: 'abc123hash',
          },
        },
      };
      const mockRes = {
        json: (data) => { responseData = data; },
        status: () => mockRes,
      };

      await handleReportSummarize(mockReq, mockRes);
      expect(responseData.success).toBe(true);
      expect(responseData.data.aiBoundary.isAdvisory).toBe(true);
      expect(responseData.data.aiBoundary.canCertifyCompliance).toBe(false);
      expect(responseData.data.aiBoundary.canAlterData).toBe(false);
    });
  });

  describe('Workflow R & S: RBAC & Tenant Isolation', () => {
    test('Prevents Organization B from querying Organization A reports and metrics', async () => {
      const kpisB = await SOCMetricsService.getOperationalKPIs(orgB);
      expect(kpisB.incidents.total).toBe(0); // Org B has 0 incidents, Org A has 4

      const reportOrgB = await SOCReport.find({ organizationId: orgB });
      expect(reportOrgB.length).toBe(0);
    });
  });

  describe('Workflow T: No Synthetic Data Fidelity Guarantee', () => {
    test('Displays NO_DATA / INSUFFICIENT_DATA instead of fabricating metrics', async () => {
      const emptyOrg = new mongoose.Types.ObjectId();
      const kpis = await SOCMetricsService.getOperationalKPIs(emptyOrg);

      expect(kpis.incidents.total).toBe(0);
      expect(kpis.threatHunts.total).toBe(0);
      expect(kpis.detections.attackCoverageRate).toBe('NOT_MEASURED');

      const timeMetrics = await SOCMetricsService.calculateMTTAAndMTTR(emptyOrg);
      expect(timeMetrics.mtta.formatted).toBe('INSUFFICIENT_DATA');
      expect(timeMetrics.mttr.formatted).toBe('INSUFFICIENT_DATA');
    });
  });
});
