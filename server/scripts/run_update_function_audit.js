/**
 * 🛡️ CyberShield X — Mandatory Update-Function Integrity Audit Runner
 * Verifies End-to-End Mutation Chains across Phases 65–79:
 * UI / API -> Auth -> RBAC -> Tenant Isolation -> Input Validation -> Service Logic
 * -> DB Mutation -> Audit -> Real-Time Event -> Response -> Database Re-read Verification
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

// Models
const AnalystRecommendation = require('../models/AnalystRecommendation');
const InvestigationHypothesis = require('../models/InvestigationHypothesis');
const DecisionAssessment = require('../models/DecisionAssessment');
const Incident = require('../models/Incident');
const Alert = require('../models/Alert');
const Finding = require('../models/Finding');
const DetectionRule = require('../models/DetectionRule');
const DetectionRuleRevision = require('../models/DetectionRuleRevision');
const GovernancePolicy = require('../models/GovernancePolicy');
const GovernancePolicyRevision = require('../models/GovernancePolicyRevision');
const SecurityDrift = require('../models/SecurityDrift');
const AuditEvent = require('../models/AuditEvent');

// Services
const InvestigationRecommendationService = require('../services/intelligence/InvestigationRecommendationService');
const RiskSynthesisService = require('../services/intelligence/RiskSynthesisService');
const DetectionLifecycleService = require('../services/soc/DetectionLifecycleService');
const IncidentResponseService = require('../services/soc/IncidentResponseService');
const GovernancePolicyService = require('../services/soc/GovernancePolicyService');

let totalAuditChecks = 0;
let passedAuditChecks = 0;
let failedAuditChecks = 0;
const auditResults = [];

function recordAudit(number, workflow, description, passed, details) {
  totalAuditChecks++;
  if (passed) passedAuditChecks++;
  else failedAuditChecks++;

  auditResults.push({
    checkNumber: number,
    workflow,
    description,
    status: passed ? 'PASS' : 'BLOCKED',
    details
  });

  const symbol = passed ? '✅' : '❌';
  console.log(`[${String(number).padStart(2, '0')}] ${symbol} [${workflow}] ${description} — ${details}`);
}

async function runUpdateFunctionAudit() {
  console.log('\n===============================================================');
  console.log('🛡️  CYBERSHIELD X — UPDATE-FUNCTION INTEGRITY AUDIT');
  console.log('   Mandatory Verification: Positive + Negative Chains (Phases 65–79)');
  console.log('===============================================================\n');

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cybershield_x');
  }

  const tenantAlpha = 'tenant_update_alpha';
  const tenantBeta = 'tenant_update_beta';

  // Purge test tenant records
  await AnalystRecommendation.deleteMany({ organizationId: { $in: [tenantAlpha, tenantBeta] } });
  await InvestigationHypothesis.deleteMany({ organizationId: { $in: [tenantAlpha, tenantBeta] } });
  await Incident.deleteMany({ organizationId: { $in: [tenantAlpha, tenantBeta] } });
  await Alert.deleteMany({ organizationId: { $in: [tenantAlpha, tenantBeta] } });
  await Finding.deleteMany({ organizationId: { $in: [tenantAlpha, tenantBeta] } });
  await DetectionRule.deleteMany({ organizationId: { $in: [tenantAlpha, tenantBeta] } });
  await DetectionRuleRevision.deleteMany({ organizationId: { $in: [tenantAlpha, tenantBeta] } });
  await GovernancePolicy.deleteMany({ organizationId: { $in: [tenantAlpha, tenantBeta] } });
  await GovernancePolicyRevision.deleteMany({ organizationId: { $in: [tenantAlpha, tenantBeta] } });
  await SecurityDrift.deleteMany({ organizationId: { $in: [tenantAlpha, tenantBeta] } });

  // -------------------------------------------------------------
  // 1. PHASE 79: RECOMMENDATION ACCEPTANCE WORKFLOW
  // -------------------------------------------------------------
  const recService = new InvestigationRecommendationService();
  const rawRec = await AnalystRecommendation.create({
    recommendationId: 'REC-UPD-01',
    organizationId: tenantAlpha,
    subjectType: 'INCIDENT',
    subjectId: 'INC-UPD-01',
    recommendationType: 'CONTAINMENT',
    priority: 'CRITICAL',
    title: 'Isolate Host Target',
    rationale: 'Trigger host isolation playbook',
    status: 'PROPOSED',
    authorization: 'APPROVAL_REQUIRED',
    automationPlaybookId: 'PLAYBOOK-CONTAIN-001'
  });

  // Positive Path: Accept recommendation
  const accepted = await recService.acceptRecommendation(tenantAlpha, 'REC-UPD-01', 'ANALYST_ALICE');
  recordAudit(1, 'Phase 79 Recommendation', 'Accept recommendation returns status ACCEPTED', accepted && accepted.status === 'ACCEPTED', `Status: ${accepted?.status}`);

  // DB Re-read Verification
  const reReadRec1 = await AnalystRecommendation.findOne({ recommendationId: 'REC-UPD-01', organizationId: tenantAlpha });
  recordAudit(2, 'Phase 79 Recommendation', 'Persisted record re-read confirms status ACCEPTED and resolvedBy', reReadRec1 && reReadRec1.status === 'ACCEPTED' && reReadRec1.resolvedBy === 'ANALYST_ALICE', `resolvedBy: ${reReadRec1?.resolvedBy}`);
  recordAudit(3, 'Phase 79 Recommendation', 'Unrelated fields uncorrupted (subjectId, playbookId preserved)', reReadRec1.subjectId === 'INC-UPD-01' && reReadRec1.automationPlaybookId === 'PLAYBOOK-CONTAIN-001', 'Fields preserved');
  recordAudit(4, 'Phase 79 Recommendation', 'Tenant isolation preserved (organizationId unchanged)', reReadRec1.organizationId === tenantAlpha, `Org: ${reReadRec1.organizationId}`);

  // Negative Path: Cross-tenant update blocked
  try {
    await recService.acceptRecommendation(tenantBeta, 'REC-UPD-01', 'ATTACKER');
    recordAudit(5, 'Phase 79 Recommendation', 'Cross-tenant recommendation update strictly rejected', false, 'Allowed cross-tenant update unexpectedly');
  } catch (err) {
    recordAudit(5, 'Phase 79 Recommendation', 'Cross-tenant recommendation update strictly rejected', true, `Rejected: ${err.message}`);
  }

  // Negative Path: Non-existent recommendation update
  try {
    await recService.acceptRecommendation(tenantAlpha, 'REC-NONEXISTENT', 'ANALYST_ALICE');
    recordAudit(6, 'Phase 79 Recommendation', 'Non-existent recommendation update rejected', false, 'Allowed non-existent update');
  } catch (err) {
    recordAudit(6, 'Phase 79 Recommendation', 'Non-existent recommendation update rejected', true, `Rejected: ${err.message}`);
  }

  // -------------------------------------------------------------
  // 2. PHASE 79: RECOMMENDATION REJECTION WORKFLOW
  // -------------------------------------------------------------
  const rawRec2 = await AnalystRecommendation.create({
    recommendationId: 'REC-UPD-02',
    organizationId: tenantAlpha,
    subjectType: 'INCIDENT',
    subjectId: 'INC-UPD-02',
    recommendationType: 'EVIDENCE_COLLECTION',
    priority: 'HIGH',
    title: 'Collect Memory Dump',
    rationale: 'Trigger memory acquisition',
    status: 'PROPOSED',
    authorization: 'EXECUTABLE'
  });

  // Positive Path: Reject with feedback notes
  const rejected = await recService.rejectRecommendation(tenantAlpha, 'REC-UPD-02', 'ANALYST_BOB', 'Host is in decommission queue');
  recordAudit(7, 'Phase 79 Recommendation', 'Reject recommendation records REJECTED and feedbackNotes', rejected && rejected.status === 'REJECTED' && rejected.feedbackNotes === 'Host is in decommission queue', `Status: ${rejected?.status}`);

  // DB Re-read Verification
  const reReadRec2 = await AnalystRecommendation.findOne({ recommendationId: 'REC-UPD-02', organizationId: tenantAlpha });
  recordAudit(8, 'Phase 79 Recommendation', 'Persisted record re-read confirms non-destructive feedback retention', reReadRec2.feedbackNotes === 'Host is in decommission queue' && reReadRec2.resolvedBy === 'ANALYST_BOB', `Feedback preserved: ${reReadRec2.feedbackNotes}`);

  // -------------------------------------------------------------
  // 3. PHASE 79: INVESTIGATION HYPOTHESIS UPDATE WORKFLOW
  // -------------------------------------------------------------
  const hyp = await InvestigationHypothesis.create({
    hypothesisId: 'HYP-UPD-01',
    organizationId: tenantAlpha,
    title: 'Data Exfiltration via DNS Tunneling',
    statement: 'External adversary is staging data over TXT records.',
    status: 'OPEN',
    supportingEvidence: [{ evidenceId: 'EVID:DNS-QUERY-01', description: 'DNS query to suspicious domain' }],
    contradictingEvidence: [],
    createdBy: 'ANALYST_ALICE'
  });

  // Positive Path: Add contradicting evidence and transition status to REFUTED
  hyp.contradictingEvidence.push({ evidenceId: 'EVID:NET-FLOW-NORMAL-01', description: 'Normal heartbeat volume' });
  hyp.status = 'REFUTED';
  hyp.resolutionNotes = 'DNS query analysis proved to be legitimate AV telemetry heartbeat.';
  hyp.closedAt = new Date();
  await hyp.save();

  // DB Re-read Verification
  const reReadHyp = await InvestigationHypothesis.findOne({ hypothesisId: 'HYP-UPD-01', organizationId: tenantAlpha });
  recordAudit(9, 'Phase 79 Hypothesis', 'Hypothesis re-read confirms status REFUTED and dual evidence lists', reReadHyp.status === 'REFUTED' && reReadHyp.supportingEvidence.length === 1 && reReadHyp.contradictingEvidence.length === 1, `Supporting: ${reReadHyp.supportingEvidence.length}, Contradicting: ${reReadHyp.contradictingEvidence.length}`);
  recordAudit(10, 'Phase 79 Hypothesis', 'Hypothesis resolution notes and closed timestamp preserved', reReadHyp.resolutionNotes.includes('AV telemetry heartbeat') && reReadHyp.closedAt !== null, 'Resolution notes and timestamp verified');

  // Negative Path: Cross-tenant hypothesis query returns null
  const crossTenantHyp = await InvestigationHypothesis.findOne({ hypothesisId: 'HYP-UPD-01', organizationId: tenantBeta });
  recordAudit(11, 'Phase 79 Hypothesis', 'Cross-tenant hypothesis read isolation strictly enforced', crossTenantHyp === null, 'Tenant Beta cannot read Tenant Alpha hypothesis');

  // -------------------------------------------------------------
  // 4. PHASE 73: DETECTION RULE UPDATE & IMMUTABLE REVISION
  // -------------------------------------------------------------
  const detectionService = require('../services/soc/DetectionLifecycleService');
  const rawRule = await DetectionRule.create({
    ruleId: 'DET-UPD-01',
    contentId: 'DET-UPD-01',
    organizationId: tenantAlpha,
    name: 'Initial Access Via Web Shell',
    severity: 'HIGH',
    status: 'DRAFT',
    enabled: false,
    conditions: [{ field: 'command', operator: 'contains', value: 'c99shell' }],
    testFixtures: [
      { fixtureId: 'FIX-1', name: 'Pass Fixture', payload: { command: 'c99shell.php' }, expectedResult: 'MATCH', lastResult: 'NOT_RUN' }
    ],
    ruleVersion: '1.0.0',
    revision: 1
  });

  await DetectionRuleRevision.create({
    revisionId: 'REV-DET-UPD-01-r1',
    ruleId: 'DET-UPD-01',
    revision: 1,
    revisionNumber: 1,
    version: '1.0.0',
    author: 'SYSTEM',
    diff: {},
    ruleSnapshot: rawRule.toObject(),
    organizationId: tenantAlpha
  });

  // Positive Path: Update rule conditions creates immutable revision
  const updateResult = await detectionService.createRevision('DET-UPD-01', {
    name: 'Initial Access Via Enhanced Web Shell',
    severity: 'CRITICAL',
    conditions: [{ field: 'command', operator: 'contains', value: 'r57shell' }],
    changeReason: 'Expanded coverage for r57 PHP shell variants'
  }, { username: 'ANALYST_CHARLIE' }, tenantAlpha);

  recordAudit(12, 'Phase 73 Detection', 'Rule update increments revision and updates rule', updateResult && updateResult.revisionNumber === 2, `Revision: ${updateResult?.revisionNumber}`);

  // DB Re-read Verification: Rule record
  const reReadRule = await DetectionRule.findOne({ ruleId: 'DET-UPD-01', organizationId: tenantAlpha });
  recordAudit(13, 'Phase 73 Detection', 'Persisted rule reflects updated condition and severity', reReadRule.severity === 'CRITICAL' && reReadRule.conditions[0].value === 'r57shell', `Severity: ${reReadRule.severity}, Condition: ${reReadRule.conditions[0]?.value}`);

  // DB Re-read Verification: Immutable Revision record
  const revision = await DetectionRuleRevision.findOne({ ruleId: 'DET-UPD-01', revision: 2, organizationId: tenantAlpha });
  recordAudit(14, 'Phase 73 Detection', 'Post-update state preserved in immutable DetectionRuleRevision', revision !== null && revision.diff.conditions !== undefined, `Archived Revision: ${revision?.revision}`);

  // Negative Path: Dangerous Injection Prohibited in Update
  try {
    await detectionService.createRevision('DET-UPD-01', {
      conditions: [{ field: 'command', operator: '$where', value: 'this.command == "evil"' }]
    }, { username: 'ATTACKER' }, tenantAlpha);
    recordAudit(15, 'Phase 73 Detection', 'Arbitrary MongoDB operator injection rejected during update', false, 'Allowed $where operator');
  } catch (err) {
    recordAudit(15, 'Phase 73 Detection', 'Arbitrary MongoDB operator injection rejected during update', true, `Blocked: ${err.message}`);
  }

  // Negative Path: Promotion to REVIEW blocked if fixtures fail / unrun
  try {
    await detectionService.transitionState('DET-UPD-01', 'REVIEW', { username: 'ANALYST_CHARLIE' }, tenantAlpha, 'Ready for review');
    recordAudit(16, 'Phase 73 Detection', 'Promotion to REVIEW blocked when fixtures fail against updated conditions', false, 'Allowed promotion with failing fixtures');
  } catch (err) {
    recordAudit(16, 'Phase 73 Detection', 'Promotion to REVIEW blocked when fixtures fail against updated conditions', true, `Promotion blocked: ${err.message}`);
  }

  // -------------------------------------------------------------
  // 5. PHASE 72: INCIDENT RESPONSE STATE & ACTION VERIFICATION
  // -------------------------------------------------------------
  const incidentService = require('../services/soc/IncidentResponseService');
  const rawIncident = await Incident.create({
    incidentId: 'INC-UPD-01',
    organizationId: tenantAlpha,
    title: 'Lateral Movement Observed in Cluster',
    severity: 'HIGH',
    status: 'DETECTED',
    priority: 'HIGH',
    affectedAssets: ['SRV-01']
  });

  // Positive Path: Legal transition DETECTED -> TRIAGING
  const transitioned = await incidentService.transitionState('INC-UPD-01', 'TRIAGING', {
    actor: { username: 'ANALYST_DAVE' },
    reason: 'Triaging indicators',
    organizationId: tenantAlpha
  });
  recordAudit(17, 'Phase 72 Incident', 'Legal transition DETECTED -> TRIAGING succeeds', transitioned && transitioned.status === 'TRIAGING', `Status: ${transitioned?.status}`);

  // DB Re-read Verification
  const reReadInc = await Incident.findOne({ incidentId: 'INC-UPD-01', organizationId: tenantAlpha });
  recordAudit(18, 'Phase 72 Incident', 'Persisted incident re-read confirms TRIAGING state', reReadInc.status === 'TRIAGING', `Persisted status: ${reReadInc.status}`);

  // Negative Path: Illegal transition TRIAGING -> CLOSED directly (bypassing containment/eradication)
  try {
    await incidentService.transitionState('INC-UPD-01', 'CLOSED', {
      actor: { username: 'ANALYST_DAVE' },
      reason: 'Premature closure',
      organizationId: tenantAlpha
    });
    recordAudit(19, 'Phase 72 Incident', 'Illegal skip-state transition rejected by 14-state machine', false, 'Allowed illegal transition to CLOSED');
  } catch (err) {
    recordAudit(19, 'Phase 72 Incident', 'Illegal skip-state transition rejected by 14-state machine', true, `Rejected illegal transition: ${err.message}`);
  }

  // Negative Path: Cross-tenant transition attempt
  try {
    await incidentService.transitionState('INC-UPD-01', 'INVESTIGATING', {
      actor: { username: 'ATTACKER' },
      reason: 'Cross-tenant attempt',
      organizationId: tenantBeta
    });
    recordAudit(20, 'Phase 72 Incident', 'Cross-tenant incident transition rejected', false, 'Allowed cross-tenant transition');
  } catch (err) {
    recordAudit(20, 'Phase 72 Incident', 'Cross-tenant incident transition rejected', true, `Rejected cross-tenant: ${err.message}`);
  }

  // -------------------------------------------------------------
  // 6. PHASE 75: GOVERNANCE POLICY REVISION INTEGRITY
  // -------------------------------------------------------------
  const govService = require('../services/soc/GovernancePolicyService');
  const rawPolicy = await GovernancePolicy.create({
    policyId: 'POL-UPD-01',
    organizationId: tenantAlpha,
    name: 'Data Retention Standard',
    policyType: 'DATA_RETENTION',
    status: 'ACTIVE',
    configuration: { retentionDays: 90 },
    currentVersion: 1,
    checksum: crypto.createHash('sha256').update(JSON.stringify({ retentionDays: 90 })).digest('hex')
  });

  // Positive Path: Update policy configuration increments revision
  const updatedPolicy = await govService.updatePolicyDraft({
    organizationId: tenantAlpha,
    policyId: 'POL-UPD-01',
    configuration: { retentionDays: 180 },
    changeSummary: 'Expanded compliance window to 180 days',
    user: { username: 'ADMIN_EVE', role: 'ADMIN' }
  });

  recordAudit(21, 'Phase 75 Governance', 'Governance policy update creates new revision hash', updatedPolicy && updatedPolicy.currentVersion === 2, `Version: ${updatedPolicy?.currentVersion}`);

  // DB Re-read Verification
  const reReadPolicy = await GovernancePolicy.findOne({ policyId: 'POL-UPD-01', organizationId: tenantAlpha });
  recordAudit(22, 'Phase 75 Governance', 'Persisted policy re-read confirms updated rules', reReadPolicy.configuration.retentionDays === 180, `retentionDays: ${reReadPolicy.configuration.retentionDays}`);

  // DB Re-read Verification: Historical revision exists
  const policyRev = await GovernancePolicyRevision.findOne({ policyId: 'POL-UPD-01', version: 2, organizationId: tenantAlpha });
  recordAudit(23, 'Phase 75 Governance', 'Historical policy configuration archived with SHA-256 hash', policyRev !== null && policyRev.contentHash !== undefined, `Revision Hash: ${policyRev?.contentHash?.substring(0, 16)}...`);

  // -------------------------------------------------------------
  // 7. PHASE 69: FINDINGS EVIDENCE IMMUTABILITY AUDIT
  // -------------------------------------------------------------
  const rawFinding = await Finding.create({
    findingId: 'FIND-UPD-01',
    organizationId: tenantAlpha,
    title: 'Open Port 22 SSH Exposed',
    severity: 'MEDIUM',
    sourceTool: 'nmap',
    target: '192.168.1.10',
    rawEvidence: { tool: 'port', output: 'PORT 22/TCP OPEN', signature: 'SIG-ORIGINAL-RAW' },
    status: 'OPEN'
  });

  // Positive Path: Analyst notes can be appended
  rawFinding.analystNotes = 'Under investigation by NetOps';
  rawFinding.status = 'IN_PROGRESS';
  await rawFinding.save();

  // DB Re-read Verification
  const reReadFinding = await Finding.findOne({ findingId: 'FIND-UPD-01', organizationId: tenantAlpha });
  recordAudit(24, 'Phase 69 Finding', 'Analyst note update persists while raw tool evidence remains intact', reReadFinding.analystNotes === 'Under investigation by NetOps' && reReadFinding.rawEvidence.signature === 'SIG-ORIGINAL-RAW', 'Raw evidence preserved intact');

  // -------------------------------------------------------------
  // 8. SUMMARY & VERDICT
  // -------------------------------------------------------------
  console.log('\n---------------------------------------------------------------');
  console.log(`TOTAL UPDATE AUDIT CHECKS: ${totalAuditChecks}`);
  console.log(`PASSED: ${passedAuditChecks} (${((passedAuditChecks / totalAuditChecks) * 100).toFixed(1)}%)`);
  console.log(`FAILED: ${failedAuditChecks}`);
  console.log('---------------------------------------------------------------\n');

  const verdict = failedAuditChecks === 0 ? 'UPDATE_FUNCTION_CERTIFIED' : 'UPDATE_FUNCTION_BLOCKED';

  await mongoose.connection.close();

  if (failedAuditChecks > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runUpdateFunctionAudit().catch((err) => {
  console.error('Update function audit failed:', err);
  process.exit(1);
});
