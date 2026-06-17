const logger = require('../utils/logger');
const AutomationRun = require('../models/AutomationRun');
const { integrationQueue } = require('../workers/queueProvider');

class ActionQueue {
  constructor() {
    // Legacy properties removed; concurrency/worker execution is now handled by the QueueProvider
  }

  /**
   * Enqueue a new action execution task
   */
  async enqueue(task) {
    logger.info(`[ACTION-QUEUE] Task routed to QueueProvider: ${task.actionType}`);
    return integrationQueue.enqueue(task);
  }

  /**
   * Execute the queued action
   */
  async runTask(task) {
    const { runId, actionIndex, actionType, integrationId, actionConfig, context, organizationId } = task;
    const start = Date.now();

    logger.info(`[ACTION-QUEUE] Running action ${actionType} (Run ID: ${runId}, Index: ${actionIndex})`);

    // Dynamic import to avoid circular dependency
    const { executeIntegrationAction } = require('./integrationService');

    // Update step status in AutomationRun to running
    try {
      await AutomationRun.updateOne(
        { _id: runId, 'actions.type': actionType }, // Match action by type
        {
          $set: {
            'actions.$.status': 'running',
            'actions.$.startedAt': new Date(),
          },
        }
      );
    } catch (err) {
      logger.error(`[ACTION-QUEUE] Failed updating step to running: ${err.message}`);
    }

    let result = null;
    let error = null;
    let success = false;

    // Handle local action types directly or hand off to integration service
    try {
      if (actionType === 'create_notification') {
        const Notification = require('../models/Notification');
        
        let targetUserId = context.userId;
        if (!targetUserId && organizationId) {
          const Membership = require('../models/Membership');
          const owner = await Membership.findOne({ organizationId, role: 'owner' });
          if (owner) {
            targetUserId = owner.userId;
          } else {
            const admin = await Membership.findOne({ organizationId, role: 'admin' });
            if (admin) targetUserId = admin.userId;
          }
        }

        if (!targetUserId) {
          throw new Error('Notification creation failed: no target userId resolved.');
        }

        const notification = await Notification.create({
          organizationId: organizationId || undefined,
          userId: targetUserId,
          title: context.title || `Alert: ${context.cve || 'System Notification'}`,
          message: context.message || `An automated action was triggered by playbook.`,
          type: 'alert',
          severity: context.severity?.toLowerCase() || 'warning',
          category: 'vulnerability',
          source: 'playbook',
          entityId: context.vulnId || undefined,
        });
        result = { notificationId: notification._id };
        success = true;
      } else if (actionType === 'create_audit_entry') {
        const ActivityLog = require('../models/ActivityLog');
        const audit = await ActivityLog.create({
          action: 'PLAYBOOK_AUTOMATION_RUN',
          status: 'success',
          metadata: {
            playbookId: context.playbookId,
            triggerEvent: context.event,
            details: context.message || `Playbook executed automated step ${actionType}`,
          },
        });
        result = { auditId: audit._id };
        success = true;
      } else {
        // Run external integration action
        const integrationResult = await executeIntegrationAction(
          actionType,
          integrationId,
          actionConfig,
          context,
          organizationId
        );
        success = integrationResult.success;
        result = integrationResult.response;
        error = integrationResult.error;
      }
    } catch (err) {
      error = err.message;
      success = false;
    }

    const durationMs = Date.now() - start;

    // Update action status in the AutomationRun record
    try {
      const updateFields = {};
      updateFields[`actions.${actionIndex}.status`] = success ? 'success' : 'failed';
      updateFields[`actions.${actionIndex}.completedAt`] = new Date();
      updateFields[`actions.${actionIndex}.durationMs`] = durationMs;
      updateFields[`actions.${actionIndex}.result`] = result;
      updateFields[`actions.${actionIndex}.error`] = error || '';

      const run = await AutomationRun.findByIdAndUpdate(
        runId,
        { $set: updateFields },
        { new: true }
      );

      if (run) {
        // Check if all actions in the run have finished (success or failed)
        const allFinished = run.actions.every((act) => act.status === 'success' || act.status === 'failed');

        if (allFinished) {
          const actionCount = run.actions.length;
          const successfulActions = run.actions.filter((a) => a.status === 'success').length;
          const failedActions = run.actions.filter((a) => a.status === 'failed').length;

          run.status =
            successfulActions === actionCount
              ? 'success'
              : successfulActions > 0
              ? 'partial'
              : 'failed';
          run.completedAt = new Date();
          run.durationMs = run.completedAt - run.startedAt;
          run.actionCount = actionCount;
          run.successfulActions = successfulActions;
          run.failedActions = failedActions;
          run.result = { summary: `Executed ${actionCount} actions: ${successfulActions} succeeded, ${failedActions} failed.` };
          
          if (failedActions > 0) {
            run.error = `${failedActions} actions failed.`;
          }

          await run.save();

          // Trigger Socket.io update to frontend
          if (global.io) {
            global.io.to('admins').emit('automation:run_completed', {
              runId: run._id,
              status: run.status,
              playbookId: run.playbookId,
            });
          }
        }
      }
    } catch (err) {
      logger.error(`[ACTION-QUEUE] Error updating run status: ${err.message}`);
    }
  }
}

module.exports = new ActionQueue();
