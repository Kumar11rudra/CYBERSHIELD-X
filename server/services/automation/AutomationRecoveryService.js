const AutomationExecution = require('../../models/AutomationExecution');

class AutomationRecoveryService {
  /**
   * Scan and recover timed-out or stuck executions
   */
  static async recoverStuckExecutions(organizationId = null, maxTimeoutSeconds = 300) {
    const query = {
      status: 'RUNNING',
      startedAt: { $lt: new Date(Date.now() - maxTimeoutSeconds * 1000) }
    };
    if (organizationId) query.organizationId = organizationId;

    const stuckExecutions = await AutomationExecution.find(query);
    const recovered = [];

    for (const exec of stuckExecutions) {
      exec.status = 'FAILED';
      exec.failureReason = `Execution timed out after ${maxTimeoutSeconds} seconds without completion`;
      exec.completedAt = new Date();

      // Mark running step as failed
      exec.steps.forEach(step => {
        if (step.status === 'RUNNING') {
          step.status = 'FAILED';
          step.error = 'TIMED_OUT';
        }
      });

      await exec.save();
      recovered.push(exec.executionId);
    }

    return {
      scannedAt: new Date(),
      stuckCount: stuckExecutions.length,
      recoveredIds: recovered
    };
  }

  /**
   * Cancel an in-flight execution
   */
  static async cancelExecution(executionId, reason, user, organizationId = null) {
    const query = { executionId };
    if (organizationId) query.organizationId = organizationId;

    const execution = await AutomationExecution.findOne(query);
    if (!execution) throw new Error(`Execution ${executionId} not found`);

    if (execution.status === 'COMPLETED' || execution.status === 'FAILED' || execution.status === 'CANCELLED') {
      throw new Error(`Execution ${executionId} is already in terminal state ${execution.status}`);
    }

    execution.status = 'CANCELLED';
    execution.failureReason = `Cancelled by operator (${user?.username || 'admin'}): ${reason || 'Manual cancellation'}`;
    execution.completedAt = new Date();

    execution.steps.forEach(step => {
      if (step.status === 'RUNNING' || step.status === 'PENDING') {
        step.status = 'SKIPPED';
      }
    });

    await execution.save();
    return execution;
  }

  /**
   * Get Automation Health Telemetry
   */
  static async getAutomationHealth(organizationId = null) {
    const query = organizationId ? { organizationId } : {};

    const total = await AutomationExecution.countDocuments(query);
    const completed = await AutomationExecution.countDocuments({ ...query, status: 'COMPLETED' });
    const failed = await AutomationExecution.countDocuments({ ...query, status: 'FAILED' });
    const running = await AutomationExecution.countDocuments({ ...query, status: 'RUNNING' });
    const pendingApproval = await AutomationExecution.countDocuments({ ...query, status: 'PENDING_APPROVAL' });
    const rolledBack = await AutomationExecution.countDocuments({ ...query, status: 'ROLLED_BACK' });

    const successRate = total > 0 ? Number(((completed / total) * 100).toFixed(2)) : 100.0;

    return {
      evaluatedAt: new Date(),
      totalExecutions: total,
      completed,
      failed,
      running,
      pendingApproval,
      rolledBack,
      successRate
    };
  }
}

module.exports = AutomationRecoveryService;
