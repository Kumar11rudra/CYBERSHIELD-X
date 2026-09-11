const mongoose = require('mongoose');
const PlaybookService = require('../services/automation/PlaybookService');
const ControlValidationService = require('../services/automation/ControlValidationService');
const DriftDetectionService = require('../services/automation/DriftDetectionService');
const RemediationService = require('../services/automation/RemediationService');
const AutomationExecutionEngine = require('../services/automation/AutomationExecutionEngine');
const AutomationRecoveryService = require('../services/automation/AutomationRecoveryService');
const AutomationPlaybook = require('../models/AutomationPlaybook');
const AutomationPlaybookRevision = require('../models/AutomationPlaybookRevision');
const AutomationExecution = require('../models/AutomationExecution');
const SecurityDrift = require('../models/SecurityDrift');
const ControlValidation = require('../models/ControlValidation');
const GovernancePolicy = require('../models/GovernancePolicy');
const GovernancePolicyRevision = require('../models/GovernancePolicyRevision');

describe('Phase 77 Security Operations Automation Unit Suite', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cybershield_x_test');
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await AutomationPlaybook.deleteMany({});
    await AutomationPlaybookRevision.deleteMany({});
    await AutomationExecution.deleteMany({});
    await SecurityDrift.deleteMany({});
    await ControlValidation.deleteMany({});
    await GovernancePolicy.deleteMany({});
    await GovernancePolicyRevision.deleteMany({});
  });

  test('1. Playbook Lifecycle: DRAFT -> REVIEW -> APPROVED -> ACTIVE', async () => {
    const pb = await PlaybookService.createPlaybook({
      name: 'Test Lifecycle Playbook',
      description: 'Testing lifecycle transitions',
      category: 'GOVERNANCE_DRIFT',
      steps: [{ stepId: 'S1', name: 'Step 1', actionType: 'NOTIFY_OPERATOR', targetEntity: 'System' }]
    }, { username: 'test_user', role: 'ADMIN' });

    expect(pb.status).toBe('DRAFT');
    expect(pb.version).toBe(1);

    const reviewed = await PlaybookService.submitReview(pb.playbookId);
    expect(reviewed.status).toBe('REVIEW');

    const approved = await PlaybookService.approvePlaybook(pb.playbookId, { username: 'admin_user', role: 'ADMIN' });
    expect(approved.status).toBe('APPROVED');
    expect(approved.approvedRevisionHash).toBeDefined();

    const active = await PlaybookService.activatePlaybook(pb.playbookId);
    expect(active.status).toBe('ACTIVE');
  });

  test('2. Stale Approval Guard: Editing playbook steps invalidates approved revision hash', async () => {
    const pb = await PlaybookService.createPlaybook({
      name: 'Stale Approval Playbook',
      description: 'Testing hash validation',
      category: 'GOVERNANCE_DRIFT',
      steps: [{ stepId: 'S1', name: 'Original Step', actionType: 'NOTIFY_OPERATOR', targetEntity: 'System' }]
    }, { username: 'creator', role: 'ADMIN' });

    await PlaybookService.approvePlaybook(pb.playbookId, { username: 'approver', role: 'ADMIN' });
    
    // Revise steps after approval
    await PlaybookService.revisePlaybook(pb.playbookId, [
      { stepId: 'S1', name: 'Modified Step', actionType: 'NOTIFY_OPERATOR', targetEntity: 'System' }
    ], 'Modifying steps after approval', { username: 'editor', role: 'ADMIN' });

    const updated = await AutomationPlaybook.findOne({ playbookId: pb.playbookId });
    expect(updated.status).toBe('DRAFT');
    expect(updated.approvedRevisionHash).toBeNull();

    // Attempting activation without re-approval must throw
    await expect(PlaybookService.activatePlaybook(pb.playbookId)).rejects.toThrow('Approval required');
  });

  test('3. Idempotency Key Enforcement: Duplicate requests return existing execution', async () => {
    await PlaybookService.seedCanonicalPlaybooks();

    const idempotencyKey = `IDEM-TEST-${Date.now()}`;
    const result1 = await AutomationExecutionEngine.requestExecution(
      'PB-GOV-AUTO-RESTORE-01',
      { idempotencyKey, triggerType: 'MANUAL' },
      { username: 'operator', role: 'ADMIN' }
    );

    const result2 = await AutomationExecutionEngine.requestExecution(
      'PB-GOV-AUTO-RESTORE-01',
      { idempotencyKey, triggerType: 'MANUAL' },
      { username: 'operator', role: 'ADMIN' }
    );

    expect(result2.duplicate).toBe(true);
    expect(result2.execution.executionId).toBe(result1.executionId || result1.execution.executionId);
  });

  test('4. Safe Capability Enforcement: Unallowlisted action type is rejected', async () => {
    await expect(AutomationExecutionEngine.executeSafeStepAction(
      { actionType: 'EXECUTE_SH_COMMAND' },
      { organizationId: null }
    )).rejects.toThrow('Unsupported or unallowlisted action type');
  });

  test('5. Post-Action Server-Side Verification: Verifies status before marking REMEDIATED', async () => {
    const drift = await SecurityDrift.create({
      driftId: `DRIFT-TEST-${Date.now()}`,
      driftType: 'GOVERNANCE_POLICY_DRIFT',
      sourceRecord: 'GovernancePolicy:POL-TEST-99',
      baselineReference: 'GovernancePolicyRevision:v1:hash123',
      observedState: { status: 'ACTIVE', approvedRevisionHash: 'hash000' },
      expectedState: { approvedRevisionHash: 'hash123' },
      severity: 'HIGH',
      status: 'OPEN',
      checksum: 'chk123'
    });

    const verifyResult = await RemediationService.verifyRemediation(drift.driftId);
    expect(verifyResult.verified).toBe(false);
    expect(verifyResult.status).toBe('REMEDIATION_FAILED');
  });

  test('6. Rollback Execution: Safe deterministic rollback sets status to ROLLED_BACK', async () => {
    const execution = await AutomationExecution.create({
      executionId: `EXEC-ROLLBACK-${Date.now()}`,
      playbookId: 'PB-GOV-AUTO-RESTORE-01',
      playbookVersion: 1,
      triggerType: 'MANUAL',
      status: 'COMPLETED',
      steps: [{
        stepId: 'STEP-1',
        name: 'Restore Governance Policy',
        actionType: 'RESTORE_GOVERNANCE_POLICY',
        status: 'COMPLETED',
        onFailure: 'ROLLBACK'
      }],
      idempotencyKey: `IDEM-ROLLBACK-${Date.now()}`
    });

    const rollbackResult = await RemediationService.executeRollback(execution.executionId);
    expect(rollbackResult.supported).toBe(true);
    expect(rollbackResult.status).toBe('ROLLED_BACK');
  });

  test('7. Automation Health Telemetry', async () => {
    const health = await AutomationRecoveryService.getAutomationHealth();
    expect(health.totalExecutions).toBeGreaterThanOrEqual(0);
    expect(health.successRate).toBeDefined();
  });
});
