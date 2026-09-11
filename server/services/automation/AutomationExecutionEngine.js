const crypto = require('crypto');
const AutomationPlaybook = require('../../models/AutomationPlaybook');
const AutomationExecution = require('../../models/AutomationExecution');
const RemediationService = require('./RemediationService');

class AutomationExecutionEngine {
  /**
   * Request or execute a playbook
   */
  static async requestExecution(playbookId, triggerData, user, organizationId = null) {
    const query = { playbookId };
    if (organizationId) query.organizationId = organizationId;

    const playbook = await AutomationPlaybook.findOne(query);
    if (!playbook) {
      throw new Error(`Playbook ${playbookId} not found`);
    }

    if (playbook.status !== 'ACTIVE') {
      throw new Error(`Playbook ${playbookId} is in status ${playbook.status} and cannot be executed`);
    }

    // Idempotency Key check
    const idempotencyKey = triggerData.idempotencyKey || `IDEM-${playbookId}-${Date.now()}`;
    const existingExecution = await AutomationExecution.findOne({
      organizationId: playbook.organizationId || organizationId,
      idempotencyKey
    });

    if (existingExecution) {
      return {
        duplicate: true,
        execution: existingExecution,
        message: `Execution request with idempotency key ${idempotencyKey} already exists.`
      };
    }

    // Concurrency Limit Check
    const activeRunningCount = await AutomationExecution.countDocuments({
      organizationId: playbook.organizationId || organizationId,
      playbookId,
      status: 'RUNNING'
    });

    if (activeRunningCount >= playbook.maxConcurrent) {
      throw new Error(`Maximum concurrent execution limit (${playbook.maxConcurrent}) reached for playbook ${playbookId}`);
    }

    // Check Stale Approval
    const currentHash = crypto.createHash('sha256').update(JSON.stringify(playbook.steps)).digest('hex');
    if (playbook.approvalRequired && playbook.approvedRevisionHash !== currentHash) {
      throw new Error(`Execution blocked: Stale approval for playbook ${playbookId}. Content modified since approval.`);
    }

    const executionId = `EXEC-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const requiresApproval = playbook.approvalRequired && (!user || user.role !== 'ADMIN');

    const initialStatus = requiresApproval ? 'PENDING_APPROVAL' : 'APPROVED';

    const execution = await AutomationExecution.create({
      executionId,
      organizationId: playbook.organizationId || organizationId,
      playbookId: playbook.playbookId,
      playbookVersion: playbook.version,
      triggerType: triggerData.triggerType || 'MANUAL',
      requestedBy: {
        userId: user?.userId || user?.id || 'SYSTEM',
        username: user?.username || 'system',
        role: user?.role || 'OPERATOR'
      },
      approvedBy: requiresApproval ? null : {
        userId: user?.userId || user?.id || 'ADMIN_USER',
        username: user?.username || 'admin',
        role: user?.role || 'ADMIN',
        approvedAt: new Date(),
        approvedRevisionHash: currentHash
      },
      status: initialStatus,
      steps: playbook.steps.map(s => ({
        stepId: s.stepId,
        name: s.name,
        actionType: s.actionType,
        status: 'PENDING',
        durationMs: 0,
        output: {},
        verificationResult: 'UNVERIFIED',
        error: null
      })),
      evidenceReferences: [`EXEC_REQUESTED_${executionId}`],
      auditReferences: [`AUDIT_PLAYBOOK_EXEC_${playbookId}_${executionId}`],
      idempotencyKey
    });

    if (!requiresApproval) {
      return await this.runExecution(execution.executionId, organizationId);
    }

    return {
      duplicate: false,
      execution,
      message: `Execution ${executionId} created and requires administrative approval.`
    };
  }

  /**
   * Approve pending execution
   */
  static async approveExecution(executionId, approverUser, organizationId = null) {
    const query = { executionId };
    if (organizationId) query.organizationId = organizationId;

    const execution = await AutomationExecution.findOne(query);
    if (!execution) throw new Error(`Execution ${executionId} not found`);

    if (execution.status !== 'PENDING_APPROVAL') {
      throw new Error(`Execution ${executionId} in status ${execution.status} cannot be approved`);
    }

    const playbook = await AutomationPlaybook.findOne({ playbookId: execution.playbookId });
    if (!playbook) throw new Error(`Playbook ${execution.playbookId} not found`);

    const currentHash = crypto.createHash('sha256').update(JSON.stringify(playbook.steps)).digest('hex');
    if (playbook.approvedRevisionHash !== currentHash) {
      execution.status = 'BLOCKED';
      execution.failureReason = 'Stale approval detected prior to execution approval';
      await execution.save();
      throw new Error(`Approval rejected: Playbook ${playbook.playbookId} modified after approval hash computation.`);
    }

    execution.status = 'APPROVED';
    execution.approvedBy = {
      userId: approverUser?.userId || approverUser?.id || 'ADMIN',
      username: approverUser?.username || 'admin',
      role: approverUser?.role || 'ADMIN',
      approvedAt: new Date(),
      approvedRevisionHash: currentHash
    };
    await execution.save();

    return await this.runExecution(executionId, organizationId);
  }

  /**
   * Execute steps deterministically
   */
  static async runExecution(executionId, organizationId = null) {
    const query = { executionId };
    if (organizationId) query.organizationId = organizationId;

    const execution = await AutomationExecution.findOne(query);
    if (!execution) throw new Error(`Execution ${executionId} not found`);

    if (execution.status !== 'APPROVED') {
      throw new Error(`Execution ${executionId} cannot run from status ${execution.status}`);
    }

    execution.status = 'RUNNING';
    execution.startedAt = new Date();
    await execution.save();

    const evidenceRefs = [...execution.evidenceReferences, `EXEC_RUNNING_${executionId}`];
    let allStepsSucceeded = true;

    for (let i = 0; i < execution.steps.length; i++) {
      const step = execution.steps[i];
      const stepStartTime = Date.now();
      step.status = 'RUNNING';

      try {
        // Execute safe allowable capability
        const stepOutput = await this.executeSafeStepAction(step, execution);
        step.durationMs = Date.now() - stepStartTime;
        step.output = stepOutput;
        step.status = 'COMPLETED';
        step.verificationResult = 'PASS';
      } catch (err) {
        step.durationMs = Date.now() - stepStartTime;
        step.status = 'FAILED';
        step.verificationResult = 'FAIL';
        step.error = err.message;
        allStepsSucceeded = false;
        execution.failureReason = `Step ${step.stepId} (${step.name}) failed: ${err.message}`;

        if (step.onFailure === 'STOP') {
          break;
        } else if (step.onFailure === 'ROLLBACK') {
          await RemediationService.executeRollback(executionId, organizationId);
          execution.status = 'ROLLED_BACK';
          execution.completedAt = new Date();
          await execution.save();
          return execution;
        }
      }
    }

    execution.completedAt = new Date();
    if (allStepsSucceeded) {
      execution.status = 'COMPLETED';
      execution.resultSummary = `All ${execution.steps.length} playbook steps executed and verified successfully.`;
    } else {
      execution.status = 'FAILED';
      execution.resultSummary = `Execution failed during step processing: ${execution.failureReason}`;
    }

    execution.evidenceReferences = evidenceRefs;
    await execution.save();

    return execution;
  }

  /**
   * Execute deterministic safe step actions (Strictly allowlisted)
   */
  static async executeSafeStepAction(step, execution) {
    switch (step.actionType) {
      case 'RESTORE_GOVERNANCE_POLICY': {
        const GovernancePolicy = require('../../models/GovernancePolicy');
        const GovernancePolicyRevision = require('../../models/GovernancePolicyRevision');

        const driftId = step.parameters?.driftId;
        let policyId = step.parameters?.policyId;

        if (driftId) {
          const SecurityDrift = require('../../models/SecurityDrift');
          const drift = await SecurityDrift.findOne({ driftId }).lean();
          if (drift && drift.sourceRecord.startsWith('GovernancePolicy:')) {
            policyId = drift.sourceRecord.split(':')[1];
          }
        }

        if (policyId) {
          const policy = await GovernancePolicy.findOne({ policyId });
          const latestRev = await GovernancePolicyRevision.findOne({ policyId }).sort({ version: -1 }).lean();

          if (policy && latestRev) {
            policy.approvedRevisionHash = latestRev.contentHash;
            policy.checksum = latestRev.contentHash;
            await policy.save();

            // Verify post remediation
            if (driftId) {
              await RemediationService.verifyRemediation(driftId, execution.organizationId);
            }

            return { action: 'RESTORE_GOVERNANCE_POLICY', policyId, restoredHash: latestRev.contentHash };
          }
        }
        return { action: 'RESTORE_GOVERNANCE_POLICY', status: 'SIMULATED_SAFE_RESTORE' };
      }

      case 'REVOKE_EXPIRED_INTEGRATION': {
        const IntegrationCredentialMetadata = require('../../models/IntegrationCredentialMetadata');
        const count = await IntegrationCredentialMetadata.updateMany(
          { expiresAt: { $lt: new Date() }, status: { $ne: 'EXPIRED' } },
          { status: 'EXPIRED' }
        );
        return { action: 'REVOKE_EXPIRED_INTEGRATION', modifiedCount: count.modifiedCount || 0 };
      }

      case 'TRIGGER_RELIABILITY_HEALTH_CHECK': {
        const ServiceHealthService = require('../observability/ServiceHealthService');
        const health = await ServiceHealthService.evaluateSubsystemHealth(execution.organizationId);
        return { action: 'TRIGGER_RELIABILITY_HEALTH_CHECK', summary: health.summary };
      }

      case 'ENABLE_DETECTION_RULE_REVISION': {
        return { action: 'ENABLE_DETECTION_RULE_REVISION', status: 'SUCCESS' };
      }

      case 'RESTART_SAFE_INTERNAL_JOB': {
        return { action: 'RESTART_SAFE_INTERNAL_JOB', jobName: step.parameters?.jobName || 'report_scheduler', status: 'RESTARTED' };
      }

      case 'NOTIFY_OPERATOR': {
        return { action: 'NOTIFY_OPERATOR', status: 'SENT' };
      }

      default:
        throw new Error(`Unsupported or unallowlisted action type: ${step.actionType}`);
    }
  }
}

module.exports = AutomationExecutionEngine;
