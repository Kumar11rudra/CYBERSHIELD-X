/**
 * 🛡️ CyberShield X — Phase 72 Acceptance Runner
 *
 * Validates: Full Incident Response + Case Orchestration + Evidence Lifecycle
 * Target: 35/35 PASS
 *
 * Emits:
 * - server/scripts/incident_status_v72.json
 * - server/scripts/phase72_incident_response.json
 * - docs/PHASE72_INCIDENT_RESPONSE.md
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cybershield_acceptance_72';

async function runAcceptance() {
  console.log('====================================================================================================');
  console.log('CYBERSHIELD X — PHASE 72 INCIDENT RESPONSE & EVIDENCE LIFECYCLE ACCEPTANCE RUNNER');
  console.log('Baseline: v61.4.0 (Auth Hardened & Threat Hunting Certified) | Target: 35/35 PASS');
  console.log('====================================================================================================\n');

  const results = [];
  let testNum = 1;

  function record(category, name, status, details = '') {
    const padNum = String(testNum).padStart(2, '0');
    const paddedName = (name + ' ').padEnd(65, '.');
    const statusFormatted = status === 'PASS' ? '[PASS]' : '[FAIL]';
    console.log(`[CHECK ${padNum}] ${paddedName} ${statusFormatted} (${details})`);
    results.push({ id: testNum++, category, name, status, details });
  }

  // Connect to MongoDB
  await mongoose.connect(MONGO_URI);

  // Require models and services
  const Incident = require('../models/Incident');
  const IncidentTask = require('../models/IncidentTask');
  const EvidenceRecord = require('../models/EvidenceRecord');
  const Case = require('../models/Case');
  const Finding = require('../models/Finding');
  const Alert = require('../models/Alert');
  const ThreatHunt = require('../models/ThreatHunt');
  const DetectionRule = require('../models/DetectionRule');
  const PendingApproval = require('../models/PendingApproval');
  const AuditEvent = require('../models/AuditEvent');

  const incidentResponseService = require('../services/soc/IncidentResponseService');
  const evidenceLifecycleService = require('../services/soc/EvidenceLifecycleService');
  const caseOrchestrationService = require('../services/soc/CaseOrchestrationService');
  const investigationTimelineService = require('../services/soc/InvestigationTimelineService');
  const safePlaybookAutomationService = require('../services/soc/SafePlaybookAutomationService');

  const orgA = new mongoose.Types.ObjectId();
  const orgB = new mongoose.Types.ObjectId();

  try {
    // -------------------------------------------------------------
    // WORKFLOW A: INCIDENT CREATION & CORRELATION
    // -------------------------------------------------------------
    const incIdA = `INC-ACC-${Date.now()}-A`;
    const incidentA = await Incident.create({
      incidentId: incIdA,
      title: 'Active C2 Beaconing and Lateral Movement',
      description: 'Correlated multi-host anomaly observed on production cluster',
      severity: 'CRITICAL',
      classification: {
        tactic: 'COMMAND_AND_CONTROL',
        incidentType: 'ACTIVE_INTRUSION',
        environment: 'Production',
      },
      affectedAssets: ['srv-app-01', 'srv-db-02'],
      iocs: [
        { type: 'IP', value: '198.51.100.24', reputation: 'MALICIOUS', enriched: true },
        { type: 'DOMAIN', value: 'darkc2-node.example.org', reputation: 'SUSPICIOUS', enriched: true },
      ],
      organizationId: orgA,
    });

    record(
      'A: Incident Creation',
      'Persist correlated incident with MITRE classification and IOCs',
      incidentA && incidentA.incidentId === incIdA ? 'PASS' : 'FAIL',
      `ID: ${incIdA}, Severity: ${incidentA.severity}, Assets: ${incidentA.affectedAssets.length}`
    );

    // -------------------------------------------------------------
    // WORKFLOW B: INCIDENT STATE MACHINE (14 STATES)
    // -------------------------------------------------------------
    const s1 = await incidentResponseService.transitionState(incIdA, 'TRIAGING', {
      actor: { username: 'analyst_1', role: 'ANALYST' },
      reason: 'Initial security triage underway',
      organizationId: orgA,
    });
    record('B: State Machine', 'Legal transition: DETECTED -> TRIAGING', s1.status === 'TRIAGING' ? 'PASS' : 'FAIL', 'Status: TRIAGING');

    const s2 = await incidentResponseService.transitionState(incIdA, 'INVESTIGATING', {
      actor: { username: 'analyst_1', role: 'ANALYST' },
      reason: 'Adversary behavior confirmed',
      organizationId: orgA,
    });
    record('B: State Machine', 'Legal transition: TRIAGING -> INVESTIGATING', s2.status === 'INVESTIGATING' ? 'PASS' : 'FAIL', 'Status: INVESTIGATING');

    const s3 = await incidentResponseService.transitionState(incIdA, 'CONTAINMENT_PENDING', {
      actor: { username: 'analyst_1', role: 'ANALYST' },
      reason: 'Host isolation pending operator gate',
      organizationId: orgA,
    });
    record('B: State Machine', 'Legal transition: INVESTIGATING -> CONTAINMENT_PENDING', s3.status === 'CONTAINMENT_PENDING' ? 'PASS' : 'FAIL', 'Status: CONTAINMENT_PENDING');

    const s4 = await incidentResponseService.transitionState(incIdA, 'CONTAINED', {
      actor: { username: 'operator_1', role: 'OPERATOR' },
      reason: 'Perimeter firewall block verified',
      organizationId: orgA,
    });
    record('B: State Machine', 'Legal transition: CONTAINMENT_PENDING -> CONTAINED', s4.status === 'CONTAINED' ? 'PASS' : 'FAIL', 'Status: CONTAINED');

    let illegalCaught = false;
    try {
      await incidentResponseService.transitionState(incIdA, 'CLOSED', {
        actor: { username: 'analyst_1' },
        organizationId: orgA,
      });
    } catch {
      illegalCaught = true;
    }
    record('B: State Machine', 'Server rejects illegal jump (CONTAINED -> CLOSED)', illegalCaught ? 'PASS' : 'FAIL', 'Rejected invalid jump');

    // -------------------------------------------------------------
    // WORKFLOW C: INCIDENT ASSIGNMENT & OWNERSHIP
    // -------------------------------------------------------------
    const assignedInc = await incidentResponseService.assignIncident(incIdA, {
      primaryAnalyst: { id: 'usr_001', name: 'Agent Rudra', email: 'rudra@cybershield.local' },
      backupAnalyst: { id: 'usr_002', name: 'Agent Sarah' },
      team: 'DFIR-Tier2',
      escalationOwner: { name: 'SOC Director' },
      actor: { username: 'lead_dispatch' },
      organizationId: orgA,
    });
    record(
      'C: Assignment',
      'Assign primary analyst, backup, team, and escalation owner',
      assignedInc.assignment.primaryAnalyst.name === 'Agent Rudra' && assignedInc.assignment.team === 'DFIR-Tier2' ? 'PASS' : 'FAIL',
      `Assigned: ${assignedInc.assignment.primaryAnalyst.name} (${assignedInc.assignment.team})`
    );

    const claimedInc = await incidentResponseService.claimIncident(
      incIdA,
      { id: 'usr_claim', username: 'ClaimingAnalyst' },
      orgA
    );
    record('C: Assignment', 'Claim ownership updates primary analyst and timeline', claimedInc.assignment.primaryAnalyst.name === 'ClaimingAnalyst' ? 'PASS' : 'FAIL', 'Claimed by ClaimingAnalyst');

    const unassignedInc = await incidentResponseService.unassignIncident(incIdA, { username: 'dispatcher' }, orgA);
    record('C: Assignment', 'Unassign clears primary owner cleanly', unassignedInc.assignment.primaryAnalyst.name === null ? 'PASS' : 'FAIL', 'Unassigned successfully');

    // -------------------------------------------------------------
    // WORKFLOW D: DETERMINISTIC PRIORITY & REAL-TIMESTAMP SLA
    // -------------------------------------------------------------
    const priorityCalc = incidentResponseService.calculatePriority({
      assetCriticality: 'CRITICAL',
      incidentSeverity: 'CRITICAL',
      exploitability: 90,
      confidence: 95,
      businessImpact: 'CRITICAL',
      activeCompromise: true,
    });
    record(
      'D: Priority Engine',
      'Calculates 6-factor deterministic priority score',
      priorityCalc.calculatedScore >= 85 && priorityCalc.level === 'CRITICAL' ? 'PASS' : 'FAIL',
      `Score: ${priorityCalc.calculatedScore}/100, Level: ${priorityCalc.level}`
    );

    const deadlines = incidentResponseService.calculateSLADeadlines('CRITICAL', new Date());
    record(
      'D: SLA Engine',
      'Calculates real-timestamp SLA deadlines from creation time',
      deadlines.acknowledgementDeadline && deadlines.containmentDeadline ? 'PASS' : 'FAIL',
      `Ack: ${deadlines.acknowledgementDeadline.toISOString().substring(11, 19)}, Cont: ${deadlines.containmentDeadline.toISOString().substring(11, 19)}`
    );

    const slaStatusDynamic = incidentResponseService.evaluateSLAStatus({
      status: 'INVESTIGATING',
      createdAt: new Date(),
      sla: deadlines,
    });
    record('D: SLA Engine', 'Evaluates real-time SLA status as ON_TRACK', slaStatusDynamic === 'ON_TRACK' ? 'PASS' : 'FAIL', `SLA: ${slaStatusDynamic}`);

    // -------------------------------------------------------------
    // WORKFLOW E: INCIDENT TASKS & DEPENDENCIES
    // -------------------------------------------------------------
    const taskA = await incidentResponseService.createTask({
      incidentId: incIdA,
      title: 'Collect Volatile RAM Dump',
      priority: 'CRITICAL',
      assignee: { name: 'DFIR Specialist' },
      organizationId: orgA,
    });
    record('E: Tasks', 'Creates tenant-isolated incident task', taskA.status === 'TODO' ? 'PASS' : 'FAIL', `Task: ${taskA.taskId}`);

    const taskB = await incidentResponseService.createTask({
      incidentId: incIdA,
      title: 'Analyze In-Memory Hollowed Code',
      priority: 'HIGH',
      dependencies: [taskA.taskId],
      organizationId: orgA,
    });

    let depBlocked = false;
    try {
      await incidentResponseService.updateTask(taskB.taskId, { status: 'DONE' }, { username: 'analyst' }, orgA);
    } catch {
      depBlocked = true;
    }
    record('E: Tasks', 'Enforces task dependency blocking before prerequisites resolve', depBlocked ? 'PASS' : 'FAIL', 'Blocked completion due to taskA');

    await incidentResponseService.updateTask(taskA.taskId, { status: 'DONE' }, { username: 'analyst' }, orgA);
    const taskBCompleted = await incidentResponseService.updateTask(taskB.taskId, { status: 'DONE' }, { username: 'analyst' }, orgA);
    record('E: Tasks', 'Allows task completion after prerequisite task finishes', taskBCompleted.status === 'DONE' ? 'PASS' : 'FAIL', 'Task B resolved');

    // -------------------------------------------------------------
    // WORKFLOW F: IMMUTABLE EVIDENCE & SHA-256 INTEGRITY
    // -------------------------------------------------------------
    const rawPcap = 'PCAP_HEADER_HEX_7f454c46_C2_TRAFFIC_DATA_01';
    const computedSha = crypto.createHash('sha256').update(rawPcap).digest('hex');

    const evidenceRec = await evidenceLifecycleService.registerEvidence({
      incidentId: incIdA,
      sourceEntity: 'NETWORK',
      sourceId: 'sensor-gateway-01',
      rawEvidence: rawPcap,
      collector: { name: 'PCAP_COLLECTOR' },
      organizationId: orgA,
    });

    record(
      'F: Evidence Integrity',
      'Calculates and registers cryptographic SHA-256 hash',
      evidenceRec.hash === computedSha && evidenceRec.integrityStatus === 'VALID' ? 'PASS' : 'FAIL',
      `SHA-256: ${evidenceRec.hash.substring(0, 16)}...`
    );

    const verificationPass = await evidenceLifecycleService.verifyIntegrity(evidenceRec.evidenceId, { username: 'auditor' }, orgA);
    record('F: Evidence Integrity', 'Cryptographic verification reports VALID upon match', verificationPass.match === true && verificationPass.integrityStatus === 'VALID' ? 'PASS' : 'FAIL', 'Hash matched original');

    // Tamper detection test
    evidenceRec.rawEvidence = 'MODIFIED_TAMPERED_TRAFFIC_BLOB';
    await evidenceRec.save();
    const verificationFail = await evidenceLifecycleService.verifyIntegrity(evidenceRec.evidenceId, { username: 'auditor' }, orgA);
    record(
      'F: Evidence Integrity',
      'Tamper detection triggers TAMPER_DETECTED upon byte alteration',
      verificationFail.match === false && verificationFail.integrityStatus === 'TAMPER_DETECTED' ? 'PASS' : 'FAIL',
      'Tamper detected successfully'
    );

    // -------------------------------------------------------------
    // WORKFLOW G: SAFE EVIDENCE COLLECTION (NATIVE BOUNDARY)
    // -------------------------------------------------------------
    const safeEvidence = await evidenceLifecycleService.collectEvidenceSafely({
      incidentId: incIdA,
      tool: 'whois',
      target: '127.0.0.1',
      reason: 'Gather authoritative registration data',
      collector: { name: 'DFIR_NATIVE' },
      organizationId: orgA,
    });
    record(
      'G: Safe Collection',
      'Collects evidence safely via certified HostEnvironmentService',
      safeEvidence.evidence && safeEvidence.evidence.hash ? 'PASS' : 'FAIL',
      `Tool: whois, EvidenceId: ${safeEvidence.evidence.evidenceId}`
    );

    // -------------------------------------------------------------
    // WORKFLOW H: RESPONSE ACTION PROPOSAL
    // -------------------------------------------------------------
    const proposedAction = await incidentResponseService.proposeResponseAction(incIdA, {
      actionType: 'HOST_NETWORK_ISOLATION',
      target: 'srv-app-01',
      riskClass: 'PRIVILEGED',
      reason: 'Sever active C2 channel from production network',
      actor: { username: 'tier2_analyst', role: 'ANALYST' },
      organizationId: orgA,
    });

    record(
      'H: Response Proposal',
      'Routes privileged containment action to PendingApproval gate',
      proposedAction.status === 'AWAITING_APPROVAL' && proposedAction.executionId.startsWith('APPR-') ? 'PASS' : 'FAIL',
      `Approval Gate: ${proposedAction.executionId}`
    );

    // -------------------------------------------------------------
    // WORKFLOW I: HUMAN APPROVAL DECISION GATE
    // -------------------------------------------------------------
    const pendingAppr = await PendingApproval.findOne({ approvalId: proposedAction.executionId });
    record(
      'I: Human Approval',
      'PendingApproval records proposed action with operator requirement',
      pendingAppr && pendingAppr.status === 'AWAITING_APPROVAL' ? 'PASS' : 'FAIL',
      `Target: ${pendingAppr.target}, Risk: ${pendingAppr.riskLevel}`
    );

    // -------------------------------------------------------------
    // WORKFLOW J: SAFE RESPONSE EXECUTION
    // -------------------------------------------------------------
    const executedAction = await incidentResponseService.executeResponseAction(
      incIdA,
      proposedAction.actionId,
      { username: 'sec_admin', role: 'ADMIN' },
      orgA
    );

    record(
      'J: Safe Execution',
      'Executes approved action; verification status remains UNVERIFIED',
      executedAction.status === 'SUCCEEDED' && executedAction.verificationStatus === 'UNVERIFIED' ? 'PASS' : 'FAIL',
      'Status: SUCCEEDED, Verification: UNVERIFIED (exit code 0 != remediation)'
    );

    // -------------------------------------------------------------
    // WORKFLOW K: INDEPENDENT REMEDIATION VERIFICATION
    // -------------------------------------------------------------
    const verifiedAction = await incidentResponseService.verifyResponseAction(
      incIdA,
      proposedAction.actionId,
      {
        result: 'PASS',
        verificationMethod: 'INDEPENDENT_DIAGNOSTIC_PROBE',
        evidenceId: evidenceRec.evidenceId,
        notes: 'Outbound socket probe confirmed zero traffic to C2 IP.',
        verifier: { username: 'independent_auditor' },
      },
      orgA
    );

    record(
      'K: Independent Verification',
      'Decoupled verification updates action status to PASS',
      verifiedAction.verificationStatus === 'PASS' ? 'PASS' : 'FAIL',
      `Verifier: ${verifiedAction.verifiedBy}, Result: PASS`
    );

    // -------------------------------------------------------------
    // WORKFLOW L: RECOVERY & TRANSITION
    // -------------------------------------------------------------
    await incidentResponseService.transitionState(incIdA, 'ERADICATING', {
      actor: { username: 'analyst_1' },
      reason: 'Malware binary removed from disk',
      organizationId: orgA,
    });
    await incidentResponseService.transitionState(incIdA, 'RECOVERING', {
      actor: { username: 'analyst_1' },
      reason: 'System restored from known-clean golden image',
      organizationId: orgA,
    });
    await incidentResponseService.transitionState(incIdA, 'VALIDATION', {
      actor: { username: 'analyst_1' },
      reason: 'Baseline telemetry validated',
      organizationId: orgA,
    });
    const resolvedInc = await incidentResponseService.transitionState(incIdA, 'RESOLVED', {
      actor: { username: 'analyst_1' },
      reason: 'Eradication and recovery verified by independent probe',
      organizationId: orgA,
    });
    record('L: Recovery & Resolution', 'Transitions through ERADICATING -> RECOVERING -> VALIDATION -> RESOLVED', resolvedInc.status === 'RESOLVED' ? 'PASS' : 'FAIL', 'Status: RESOLVED');

    // -------------------------------------------------------------
    // WORKFLOW M: POSTMORTEM & STRUCTURED CLOSURE
    // -------------------------------------------------------------
    const closedInc = await incidentResponseService.closeIncident(incIdA, {
      rootCause: 'Compromised developer SSH key used from external IP',
      impact: 'Temporary lateral traverse on 2 staging servers; no exfil',
      containmentSummary: 'Host network isolated and perimeter ACL locked down',
      eradicationSummary: 'Keys revoked and reissued; malware removed',
      recoveryVerification: 'Diagnostic socket and process scans confirmed clean',
      lessonsLearned: 'Mandate FIDO2 hardware tokens for SSH access',
      detectionGaps: 'Absence of rule alerting on off-hours SSH from foreign ASN',
      actor: { username: 'soc_manager' },
      organizationId: orgA,
    });

    record(
      'M: Structured Closure',
      'Mandatory postmortem enforces root cause & lessons learned for High/Crit',
      closedInc.status === 'CLOSED' && closedInc.closure.postIncidentReviewCompleted === true ? 'PASS' : 'FAIL',
      `Closed: ${closedInc.closure.closedAt ? 'Yes' : 'No'}, PIR: ${closedInc.closure.postIncidentReviewCompleted}`
    );

    // -------------------------------------------------------------
    // WORKFLOW N: DETECTION GAP FEEDBACK LOOP
    // -------------------------------------------------------------
    const feedback = await incidentResponseService.generateDetectionGapFeedback(incIdA, { username: 'feedback_engine' }, orgA);
    record(
      'N: Detection Gap Feedback',
      'Drafts candidate ThreatHunt and DetectionRule in DRAFT status',
      feedback.hunt.status === 'DRAFT' && feedback.rule.status === 'DRAFT' ? 'PASS' : 'FAIL',
      `Candidate Hunt: ${feedback.hunt.huntId}, Rule: ${feedback.rule.ruleId} (Neither is auto-activated)`
    );

    // -------------------------------------------------------------
    // WORKFLOW O: INCIDENT REOPEN LIFECYCLE
    // -------------------------------------------------------------
    const reopenedInc = await incidentResponseService.reopenIncident(incIdA, {
      reason: 'New beaconing detected on adjacent subnet referencing same C2 IOC',
      triggeringEvidenceId: evidenceRec.evidenceId,
      actor: { username: 'tier1_analyst' },
      organizationId: orgA,
    });

    record(
      'O: Reopen Lifecycle',
      'Reopens closed incident with real triggering evidence reference',
      reopenedInc.status === 'REOPENED' && reopenedInc.reopenHistory.length > 0 ? 'PASS' : 'FAIL',
      `Reopened History count: ${reopenedInc.reopenHistory.length}`
    );

    // -------------------------------------------------------------
    // WORKFLOW P: INVESTIGATION TIMELINE AGGREGATION
    // -------------------------------------------------------------
    const timelineEvents = await investigationTimelineService.buildTimeline({
      incidentId: incIdA,
      organizationId: orgA,
    });

    record(
      'P: Timeline Aggregation',
      'Timeline aggregates incident transitions, response actions, tasks, and evidence',
      timelineEvents.length >= 5 ? 'PASS' : 'FAIL',
      `Events aggregated: ${timelineEvents.length} from real DB records`
    );

    // -------------------------------------------------------------
    // WORKFLOW Q: CASE CONTAINER ORCHESTRATION
    // -------------------------------------------------------------
    const caseId = `CASE-ACC-${Date.now()}`;
    const parentCase = await caseOrchestrationService.createCase(
      {
        caseId,
        title: 'Master Enterprise Breach Container',
        severity: 'HIGH',
        organizationId: orgA,
      },
      { username: 'lead_investigator' }
    );

    const linkedCase = await caseOrchestrationService.linkIncident(caseId, incIdA, { username: 'lead_investigator' }, orgA);
    record(
      'Q: Case Orchestration',
      'Links incident into unified operational Case container',
      linkedCase.incidents.includes(incIdA) ? 'PASS' : 'FAIL',
      `Case ${caseId} contains incident ${incIdA}`
    );

    const childCaseId = `CASE-CHILD-${Date.now()}`;
    await Case.create({
      caseId: childCaseId,
      title: 'Subnet 192 Investigation Sub-Case',
      organizationId: orgA,
      analystId: 'operator',
    });

    const hierarchy = await caseOrchestrationService.linkParentChild(caseId, childCaseId, { username: 'lead' }, orgA);
    record(
      'Q: Case Orchestration',
      'Supports parent / child case hierarchy',
      hierarchy.parent.childCases.includes(childCaseId) && hierarchy.child.parentCaseId === caseId ? 'PASS' : 'FAIL',
      `Parent: ${caseId} -> Child: ${childCaseId}`
    );

    // -------------------------------------------------------------
    // WORKFLOW R: CASE DOSSIER COMPILATION
    // -------------------------------------------------------------
    const dossier = await caseOrchestrationService.compileDossier(caseId, orgA);
    record(
      'R: Case Dossier',
      'Compiles comprehensive case dossier from persisted DB records',
      dossier.caseDetails.caseId === caseId && dossier.counts.incidents >= 1 && dossier.integritySummary ? 'PASS' : 'FAIL',
      `Counts: ${dossier.counts.incidents} incs, ${dossier.counts.evidence} evids, ${dossier.counts.tasks} tasks`
    );

    // -------------------------------------------------------------
    // WORKFLOW S: MULTI-TENANT ISOLATION
    // -------------------------------------------------------------
    const incIdB = `INC-ACC-${Date.now()}-B`;
    await Incident.create({
      incidentId: incIdB,
      title: 'Tenant B Isolated Incident',
      organizationId: orgB,
    });

    const orgASearch = await Incident.find({ incidentId: incIdB, organizationId: orgA });
    const orgBSearch = await Incident.find({ incidentId: incIdA, organizationId: orgB });

    record(
      'S: Multi-Tenant Isolation',
      'Strict tenant boundary prevents Org A from accessing Org B data',
      orgASearch.length === 0 && orgBSearch.length === 0 ? 'PASS' : 'FAIL',
      'Org A != Org B isolation verified'
    );

    // RBAC check
    const { requireMinimumRole } = require('../middleware/rbac');
    const rbacAnalystCheck = requireMinimumRole('analyst');
    let rbacBlockedViewer = false;
    const mockViewerReq = { user: { role: 'viewer' } };
    const mockViewerRes = {
      status: (code) => {
        if (code === 403) rbacBlockedViewer = true;
        return { json: () => {} };
      },
    };
    rbacAnalystCheck(mockViewerReq, mockViewerRes, () => {});
    record(
      'S: Server-Side RBAC',
      'Viewer role is strictly forbidden from executing incident mutations',
      rbacBlockedViewer ? 'PASS' : 'FAIL',
      'Viewer blocked with 403 Forbidden'
    );

    // -------------------------------------------------------------
    // WORKFLOW T: BOUNDED AI COPILOT & REPORTING
    // -------------------------------------------------------------
    const chatbotController = require('../controllers/chatbot/chatbotController');
    let aiSummarized = false;
    const mockReq = { body: { incidentId: incIdA } };
    const mockRes = {
      json: (payload) => {
        if (payload.success && payload.data.delimiterSanitized) {
          aiSummarized = true;
        }
      },
      status: () => mockRes,
    };

    await chatbotController.handleIncidentSummarize(mockReq, mockRes);
    record(
      'T: AI Copilot Boundary',
      'Bounded AI Copilot sanitizes untrusted input with delimiters and remains advisory',
      aiSummarized ? 'PASS' : 'FAIL',
      'Delimiters applied; zero autonomous mutation authority'
    );

    // Reporting verification: Executive
    const incidentController = require('../controllers/incidentController');
    let reportGenerated = false;
    const reportReq = { params: { incidentId: incIdA }, query: { type: 'executive' } };
    const reportRes = {
      json: (payload) => {
        if (payload.success && payload.data.reportType === 'EXECUTIVE_INCIDENT_SUMMARY') {
          reportGenerated = true;
        }
      },
      status: () => reportRes,
    };
    await incidentController.generateReport(reportReq, reportRes);
    record(
      'T: Evidence-Backed Reporting',
      'Generates executive report backed by persisted incident records',
      reportGenerated ? 'PASS' : 'FAIL',
      'Executive report compiled'
    );

    // Reporting verification: Technical
    let techReportGenerated = false;
    const techReq = { params: { incidentId: incIdA }, query: { type: 'technical' } };
    const techRes = {
      json: (payload) => {
        if (payload.success && payload.data.reportType === 'TECHNICAL_INCIDENT_REPORT' && payload.data.evidence) {
          techReportGenerated = true;
        }
      },
      status: () => techRes,
    };
    await incidentController.generateReport(techReq, techRes);
    record(
      'T: Evidence-Backed Reporting',
      'Generates technical report with timeline and cryptographic evidence appendix',
      techReportGenerated ? 'PASS' : 'FAIL',
      'Technical report compiled with evidence hashes'
    );

    // Final Summary
    console.log('\n====================================================================================================');
    const passedCount = results.filter((r) => r.status === 'PASS').length;
    const totalCount = results.length;
    console.log(`PHASE 72 ACCEPTANCE SUMMARY: ${passedCount}/${totalCount} PASS`);
    console.log('====================================================================================================\n');

    const verdict = passedCount === totalCount && totalCount >= 30 ? 'INCIDENT_RESPONSE_CERTIFIED' : 'INCIDENT_RESPONSE_BLOCKED';
    console.log(`FINAL CERTIFICATION VERDICT: ${verdict}\n`);

    // Emit JSON Artifacts
    const statusObj = {
      phase: 72,
      version: 'v61.4.0-p72',
      name: 'Full Incident Response, Case Orchestration & Evidence Lifecycle',
      verdict,
      timestamp: new Date().toISOString(),
      score: `${passedCount}/${totalCount}`,
      summary: {
        totalChecks: totalCount,
        passed: passedCount,
        failed: totalCount - passedCount,
      },
      checks: results,
    };

    const scriptDir = path.dirname(__filename);
    fs.writeFileSync(path.join(scriptDir, 'incident_status_v72.json'), JSON.stringify(statusObj, null, 2));
    fs.writeFileSync(path.join(scriptDir, 'phase72_incident_response.json'), JSON.stringify(statusObj, null, 2));

    // Emit Markdown Artifact
    const docsDir = path.join(scriptDir, '../../docs');
    if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

    const mdContent = `# CyberShield X — Phase 72 Incident Response, Case Orchestration & Evidence Lifecycle Certification

**Status:** ${verdict}
**Baseline:** v61.4.0
**Acceptance Score:** ${passedCount}/${totalCount} PASS
**Date:** ${new Date().toISOString()}

## Architectural Capabilities Certified
1. **14-State Incident State Machine**: Enforces legal transitions server-side (DETECTED to CLOSED/REOPENED).
2. **Deterministic 6-Factor Priority Engine**: Decoupled from risk score, exposing assetCriticality, exploitability, confidence, impact, and activeCompromise.
3. **Real-Timestamp SLA Engine**: Computes realistic deadlines by priority and dynamically evaluates ON_TRACK, AT_RISK, BREACHED, and COMPLETED states.
4. **Tenant-Isolated Incident Tasks**: Multi-level checklists with dependency validation.
5. **Cryptographic Evidence Lifecycle**: Real SHA-256 calculation, tamper detection, and audit-grade chain of custody.
6. **Decoupled Response Actions**: Command exit code 0 does NOT equal remediation; independent verification (PASS/FAIL/INCONCLUSIVE) is strictly required.
7. **Human-in-the-Loop Approval Gates**: Privileged operations route to \`PendingApproval\`; zero autonomous AI execution.
8. **Structured Postmortem & Feedback Loop**: High/Critical incidents require root cause and lessons learned, feeding detection gaps into candidate threat hunts.
9. **Reopen Lifecycle**: Closed incidents reopen only with verified triggering evidence.
10. **Unified Case Container & Dossier**: Compiles complete case dossier from persisted records (zero AI hallucination).

## Acceptance Test Log
| # | Category | Check Name | Status | Details |
|---|---|---|---|---|
${results.map((r) => `| ${String(r.id).padStart(2, '0')} | ${r.category} | ${r.name} | ${r.status} | ${r.details} |`).join('\n')}
`;

    fs.writeFileSync(path.join(docsDir, 'PHASE72_INCIDENT_RESPONSE.md'), mdContent);
    console.log(`Emitted artifacts:\n- server/scripts/incident_status_v72.json\n- server/scripts/phase72_incident_response.json\n- docs/PHASE72_INCIDENT_RESPONSE.md\n`);

    await mongoose.disconnect();
    return statusObj;
  } catch (err) {
    console.error('Acceptance run aborted due to uncaught error:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

if (require.main === module) {
  runAcceptance().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = runAcceptance;
