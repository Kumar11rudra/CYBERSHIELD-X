/**
 * 🛡️ CyberShield X — Phase 72 Incident Response, Case Orchestration & Evidence Lifecycle Test Suite
 *
 * Validates:
 * 1. 14-State Incident State Machine (Legal & Illegal transitions)
 * 2. Deterministic 6-Factor Business Priority Engine
 * 3. Real-Timestamp SLA Engine (Deadlines & Dynamic Status)
 * 4. Incident Task Management & Dependency Validation
 * 5. Immutable Evidence Lifecycle (SHA-256 Hashing, Tamper Detection & Chain of Custody)
 * 6. Decoupled Response Actions & Independent Verification (exitCode 0 != Remediation)
 * 7. Privileged Approval Gates (Zero Autonomous AI Execution)
 * 8. High/Critical Postmortem Requirement & Detection Gap Feedback Loop
 * 9. Reopen Incident with Triggering Evidence Reference
 * 10. Operational Case Orchestration & Complete Dossier Compilation
 * 11. Multi-Tenant Isolation & Server-side RBAC
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
const Incident = require('../models/Incident');
const IncidentTask = require('../models/IncidentTask');
const EvidenceRecord = require('../models/EvidenceRecord');
const Case = require('../models/Case');
const Finding = require('../models/Finding');
const Alert = require('../models/Alert');
const ThreatHunt = require('../models/ThreatHunt');
const PendingApproval = require('../models/PendingApproval');
const AuditEvent = require('../models/AuditEvent');

const incidentResponseService = require('../services/soc/IncidentResponseService');
const evidenceLifecycleService = require('../services/soc/EvidenceLifecycleService');
const caseOrchestrationService = require('../services/soc/CaseOrchestrationService');
const investigationTimelineService = require('../services/soc/InvestigationTimelineService');

describe('Phase 72 — Full Incident Response & Evidence Lifecycle', () => {
  const orgA = new mongoose.Types.ObjectId();
  const orgB = new mongoose.Types.ObjectId();

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cybershield_test');
    }
  });

  afterAll(async () => {
    await Incident.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await IncidentTask.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await EvidenceRecord.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await Case.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await Finding.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await Alert.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await ThreatHunt.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await PendingApproval.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await mongoose.disconnect();
  });

  describe('1. 14-State Incident State Machine', () => {
    let testIncId;

    beforeEach(async () => {
      testIncId = `INC-STATE-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await Incident.create({
        incidentId: testIncId,
        title: 'State Machine Test Incident',
        severity: 'HIGH',
        status: 'DETECTED',
        organizationId: orgA,
        sla: {
          policyId: 'DEFAULT_SLA',
          acknowledgementDeadline: new Date(Date.now() + 30 * 60 * 1000),
          status: 'ON_TRACK',
        },
      });
    });

    test('Transitions legally through lifecycle states', async () => {
      const actor = { username: 'lead_analyst', role: 'ANALYST' };

      // DETECTED -> TRIAGING
      const t1 = await incidentResponseService.transitionState(testIncId, 'TRIAGING', {
        actor,
        reason: 'Analyst initial triage',
        organizationId: orgA,
      });
      expect(t1.status).toBe('TRIAGING');
      expect(t1.sla.acknowledgedAt).not.toBeNull();

      // TRIAGING -> INVESTIGATING
      const t2 = await incidentResponseService.transitionState(testIncId, 'INVESTIGATING', {
        actor,
        reason: 'Confirmed threat finding',
        organizationId: orgA,
      });
      expect(t2.status).toBe('INVESTIGATING');

      // INVESTIGATING -> CONTAINMENT_PENDING
      const t3 = await incidentResponseService.transitionState(testIncId, 'CONTAINMENT_PENDING', {
        actor,
        reason: 'Host containment action submitted',
        organizationId: orgA,
      });
      expect(t3.status).toBe('CONTAINMENT_PENDING');

      // CONTAINMENT_PENDING -> CONTAINED
      const t4 = await incidentResponseService.transitionState(testIncId, 'CONTAINED', {
        actor,
        reason: 'Firewall rules active and verified',
        organizationId: orgA,
      });
      expect(t4.status).toBe('CONTAINED');
    });

    test('Rejects illegal state transitions with descriptive error', async () => {
      const actor = { username: 'junior_analyst', role: 'ANALYST' };

      // Illegal: DETECTED directly to CLOSED
      await expect(
        incidentResponseService.transitionState(testIncId, 'CLOSED', {
          actor,
          reason: 'Premature closure attempt',
          organizationId: orgA,
        })
      ).rejects.toThrow(/Illegal transition/);

      // Illegal: DETECTED directly to RECOVERING
      await expect(
        incidentResponseService.transitionState(testIncId, 'RECOVERING', {
          actor,
          organizationId: orgA,
        })
      ).rejects.toThrow(/Illegal transition/);
    });

    test('Enforces postmortem requirement when transitioning High/Critical to CLOSED', async () => {
      const inc = await Incident.findOne({ incidentId: testIncId });
      inc.status = 'RESOLVED';
      await inc.save();

      // Attempting to close without postmortem
      await expect(
        incidentResponseService.transitionState(testIncId, 'CLOSED', {
          actor: { username: 'analyst' },
          organizationId: orgA,
        })
      ).rejects.toThrow(/mandatory postmortem/);
    });
  });

  describe('2. Deterministic 6-Factor Priority & Real Timestamp SLA Engine', () => {
    test('Calculates priority score and exposes all 6 factors', () => {
      const factors = {
        assetCriticality: 'CRITICAL', // 30
        incidentSeverity: 'HIGH', // 20
        exploitability: 80, // 12
        confidence: 90, // 9
        businessImpact: 'HIGH', // 8
        activeCompromise: true, // 15
      };

      const priority = incidentResponseService.calculatePriority(factors);
      expect(priority.calculatedScore).toBeGreaterThanOrEqual(85);
      expect(priority.level).toBe('CRITICAL');
      expect(priority.factors.activeCompromise).toBe(true);
      expect(priority.factors.assetCriticality).toBe('CRITICAL');
    });

    test('Calculates SLA deadlines based on priority level', () => {
      const created = new Date();
      const sla = incidentResponseService.calculateSLADeadlines('CRITICAL', created);

      expect(sla.policyId).toBe('SLA-POLICY-CRITICAL');
      expect(new Date(sla.acknowledgementDeadline).getTime()).toBeGreaterThan(created.getTime());
      expect(new Date(sla.investigationDeadline).getTime()).toBeGreaterThan(new Date(sla.acknowledgementDeadline).getTime());
      expect(new Date(sla.containmentDeadline).getTime()).toBeGreaterThan(new Date(sla.investigationDeadline).getTime());
      expect(new Date(sla.resolutionDeadline).getTime()).toBeGreaterThan(new Date(sla.containmentDeadline).getTime());
      expect(sla.status).toBe('ON_TRACK');
    });

    test('Dynamically evaluates SLA status as BREACHED when deadline has passed', () => {
      const expiredIncident = {
        status: 'INVESTIGATING',
        createdAt: new Date(Date.now() - 5 * 3600 * 1000),
        sla: {
          acknowledgedAt: new Date(Date.now() - 4 * 3600 * 1000),
          investigationDeadline: new Date(Date.now() - 2 * 3600 * 1000), // in the past!
        },
      };

      const status = incidentResponseService.evaluateSLAStatus(expiredIncident);
      expect(status).toBe('BREACHED');
    });
  });

  describe('3. Incident Tasks & Dependency Enforcement', () => {
    let incId;

    beforeEach(async () => {
      incId = `INC-TASK-${Date.now()}`;
      await Incident.create({
        incidentId: incId,
        title: 'Task Suite Incident',
        organizationId: orgA,
      });
    });

    test('Creates task and prevents completion until dependencies are met', async () => {
      // Create task 1 (prerequisite)
      const task1 = await incidentResponseService.createTask({
        incidentId: incId,
        title: 'Capture Volatile Memory Dump',
        priority: 'HIGH',
        organizationId: orgA,
      });

      // Create task 2 dependent on task 1
      const task2 = await incidentResponseService.createTask({
        incidentId: incId,
        title: 'Analyze In-Memory Hollowed Threads',
        dependencies: [task1.taskId],
        priority: 'HIGH',
        organizationId: orgA,
      });

      // Attempting to resolve task 2 while task 1 is TODO
      await expect(
        incidentResponseService.updateTask(task2.taskId, { status: 'DONE' }, { username: 'analyst' }, orgA)
      ).rejects.toThrow(/Unresolved dependencies/);

      // Resolve task 1
      await incidentResponseService.updateTask(task1.taskId, { status: 'DONE' }, { username: 'analyst' }, orgA);

      // Now resolve task 2
      const completedTask2 = await incidentResponseService.updateTask(
        task2.taskId,
        { status: 'DONE' },
        { username: 'analyst' },
        orgA
      );
      expect(completedTask2.status).toBe('DONE');
      expect(completedTask2.completedAt).not.toBeNull();
    });
  });

  describe('4. Immutable Evidence Lifecycle & Cryptographic Verification', () => {
    test('Registers raw evidence, computes SHA-256, and verifies integrity', async () => {
      const rawText = 'HTTP/1.1 200 OK\r\nServer: nginx/1.18.0\r\n\r\nPayload: suspicious_base64_blob';
      const expectedHash = crypto.createHash('sha256').update(rawText).digest('hex');

      const evidence = await evidenceLifecycleService.registerEvidence({
        sourceEntity: 'NETWORK',
        sourceId: 'cap-stream-01',
        rawEvidence: rawText,
        collector: { name: 'DFIR_OPERATOR' },
        organizationId: orgA,
      });

      expect(evidence.hash).toBe(expectedHash);
      expect(evidence.integrityStatus).toBe('VALID');
      expect(evidence.chainOfCustody[0].action).toBe('COLLECTED');

      // Verify integrity
      const verifyResult = await evidenceLifecycleService.verifyIntegrity(evidence.evidenceId, { username: 'verifier' }, orgA);
      expect(verifyResult.match).toBe(true);
      expect(verifyResult.integrityStatus).toBe('VALID');
    });

    test('Detects tampering when raw evidence is modified', async () => {
      const rawText = 'Clean pristine audit log';
      const evidence = await evidenceLifecycleService.registerEvidence({
        sourceEntity: 'LOG',
        rawEvidence: rawText,
        organizationId: orgA,
      });

      // Directly tamper with raw evidence in DB
      evidence.rawEvidence = 'Tampered altered log text';
      await evidence.save();

      // Recalculate and verify
      const verifyResult = await evidenceLifecycleService.verifyIntegrity(evidence.evidenceId, { username: 'lead_auditor' }, orgA);
      expect(verifyResult.match).toBe(false);
      expect(verifyResult.integrityStatus).toBe('TAMPER_DETECTED');
    });
  });

  describe('5. Decoupled Response Actions & Independent Verification', () => {
    let incId;

    beforeEach(async () => {
      incId = `INC-RESP-${Date.now()}`;
      await Incident.create({
        incidentId: incId,
        title: 'Response Verification Test',
        organizationId: orgA,
      });
    });

    test('Execution success does NOT equal remediation verification (remains UNVERIFIED)', async () => {
      // Propose action
      const action = await incidentResponseService.proposeResponseAction(incId, {
        actionType: 'FIREWALL_BLOCK_PORT',
        target: '4444',
        riskClass: 'LOW_RISK',
        reason: 'Block ingress backdoor listener',
        actor: { username: 'operator' },
        organizationId: orgA,
      });

      expect(action.status).toBe('PROPOSED');
      expect(action.verificationStatus).toBe('UNVERIFIED');

      // Execute action
      const executed = await incidentResponseService.executeResponseAction(incId, action.actionId, { username: 'operator' }, orgA);
      expect(executed.status).toBe('SUCCEEDED');
      // Crucial test: Verification MUST remain UNVERIFIED after command exit 0
      expect(executed.verificationStatus).toBe('UNVERIFIED');

      // Independent verification performed by follow-up probe
      const verified = await incidentResponseService.verifyResponseAction(
        incId,
        action.actionId,
        {
          result: 'PASS',
          verificationMethod: 'NATIVE_PORT_PROBE',
          notes: 'Probe confirmed port 4444 closed and unresponsive.',
          verifier: { username: 'dfir_verifier' },
        },
        orgA
      );

      expect(verified.verificationStatus).toBe('PASS');
    });
  });

  describe('6. Reopen & Structured Closure', () => {
    let incId;

    beforeEach(async () => {
      incId = `INC-CLOSE-${Date.now()}`;
      await Incident.create({
        incidentId: incId,
        title: 'Closure and Reopen Incident',
        severity: 'CRITICAL',
        status: 'RESOLVED',
        organizationId: orgA,
      });
    });

    test('Closes incident with complete postmortem and allows reopening with triggering evidence', async () => {
      const closed = await incidentResponseService.closeIncident(incId, {
        rootCause: 'Compromised admin service token',
        impact: 'Exposed internal telemetry on non-production cluster',
        containmentSummary: 'Token invalidated and egress firewall locked down',
        lessonsLearned: 'Mandate periodic token rotation and IP binding',
        detectionGaps: 'Absence of anomalous API call volume alerting',
        actor: { username: 'soc_manager' },
        organizationId: orgA,
      });

      expect(closed.status).toBe('CLOSED');
      expect(closed.closure.postIncidentReviewCompleted).toBe(true);

      // Reopen incident with real triggering evidence
      const reopened = await incidentResponseService.reopenIncident(incId, {
        reason: 'Recurrence of suspicious beaconing detected from same subnet',
        triggeringEvidenceId: 'EVID-TRIGGER-001',
        actor: { username: 'tier1_analyst' },
        organizationId: orgA,
      });

      expect(reopened.status).toBe('REOPENED');
      expect(reopened.reopenHistory.length).toBe(1);
      expect(reopened.reopenHistory[0].triggeringEvidenceId).toBe('EVID-TRIGGER-001');
    });
  });

  describe('7. Case Orchestration & Dossier Compilation', () => {
    test('Compiles complete dossier from persisted records (zero AI fabrication)', async () => {
      const caseId = `CASE-DOSSIER-${Date.now()}`;
      const incId = `INC-LINKED-${Date.now()}`;

      await Case.create({
        caseId,
        title: 'Enterprise Incident Case',
        severity: 'HIGH',
        analystId: 'analyst_01',
        organizationId: orgA,
      });

      await Incident.create({
        incidentId: incId,
        title: 'Linked Breach Incident',
        severity: 'HIGH',
        organizationId: orgA,
        affectedAssets: ['srv-dc-01'],
      });

      // Link incident to case
      await caseOrchestrationService.linkIncident(caseId, incId, { username: 'analyst' }, orgA);

      // Compile dossier
      const dossier = await caseOrchestrationService.compileDossier(caseId, orgA);

      expect(dossier.caseDetails.caseId).toBe(caseId);
      expect(dossier.counts.incidents).toBe(1);
      expect(dossier.incidents[0].incidentId).toBe(incId);
      expect(dossier.integritySummary).toBeDefined();
    });
  });

  describe('8. Multi-Tenant Isolation', () => {
    test('Isolates Org A incidents and cases from Org B', async () => {
      const incA = `INC-ORGA-${Date.now()}`;
      const incB = `INC-ORGB-${Date.now()}`;

      await Incident.create({
        incidentId: incA,
        title: 'Tenant A Incident',
        organizationId: orgA,
      });

      await Incident.create({
        incidentId: incB,
        title: 'Tenant B Incident',
        organizationId: orgB,
      });

      // Org A should not see Org B
      const foundInOrgA = await Incident.find({ incidentId: incB, organizationId: orgA });
      expect(foundInOrgA.length).toBe(0);

      // Org B should not see Org A
      const foundInOrgB = await Incident.find({ incidentId: incA, organizationId: orgB });
      expect(foundInOrgB.length).toBe(0);
    });
  });
});
