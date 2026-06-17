const logger = require('../utils/logger');
const Playbook = require('../models/Playbook');
const AutomationRun = require('../models/AutomationRun');
const actionQueue = require('../integrations/actionQueue');

/**
 * Evaluate a single playbook condition against the trigger context
 */
const evaluateCondition = (condition, context) => {
  const { field, operator, value } = condition;
  let contextValue = context[field];

  if (field.includes('.')) {
    const parts = field.split('.');
    let temp = context;
    for (const part of parts) {
      if (temp) temp = temp[part];
    }
    contextValue = temp;
  }

  if (contextValue === undefined || contextValue === null) {
    return false;
  }

  const strVal = String(value).toLowerCase();
  const strCtx = String(contextValue).toLowerCase();

  switch (operator) {
    case 'equals':
      return strCtx === strVal;
    case 'not_equals':
      return strCtx !== strVal;
    case 'contains':
      return strCtx.includes(strVal);
    case 'greater_than':
      return Number(contextValue) > Number(value);
    case 'less_than':
      return Number(contextValue) < Number(value);
    default:
      return false;
  }
};

/**
 * Seed default playbook templates for an organization if none exist
 */
const seedDefaultTemplates = async (organizationId) => {
  try {
    const existing = await Playbook.findOne({ organizationId });
    if (existing) return;

    logger.info(`[PLAYBOOK-ENGINE] Seeding default templates for organization: ${organizationId}`);

    const defaults = [
      {
        organizationId,
        name: 'Auto-Remediate Critical Vulnerabilities',
        description: 'Sends alerts to Slack, triggers AI Remediation, and logs an audit entry when a critical vulnerability is found.',
        enabled: true,
        trigger: {
          event: 'vulnerability_detected',
          conditions: [
            { field: 'severity', operator: 'equals', value: 'Critical' }
          ]
        },
        actions: [
          { type: 'send_slack', config: { channel: '#security-alerts' }, order: 0 },
          { type: 'ai_remediation', config: {}, order: 1 },
          { type: 'create_notification', config: {}, order: 2 }
        ],
        version: 1,
      },
      {
        organizationId,
        name: 'Critical IOC Incident Response',
        description: 'Escalates critical threat intelligence feeds correlations directly to slack and audit logs.',
        enabled: true,
        trigger: {
          event: 'critical_ioc',
          conditions: []
        },
        actions: [
          { type: 'send_slack', config: { channel: '#security-alerts' }, order: 0 },
          { type: 'create_audit_entry', config: {}, order: 1 }
        ],
        version: 1,
      },
      {
        organizationId,
        name: 'SSL Certificate Expiration Escalation',
        description: 'Creates system notifications and sends emails when an SSL certificate is close to expiration.',
        enabled: true,
        trigger: {
          event: 'ssl_expired',
          conditions: []
        },
        actions: [
          { type: 'send_email', config: {}, order: 0 },
          { type: 'create_notification', config: {}, order: 1 }
        ],
        version: 1,
      }
    ];

    await Playbook.insertMany(defaults);
    logger.info(`[PLAYBOOK-ENGINE] Default templates seeded.`);
  } catch (err) {
    logger.error(`[PLAYBOOK-ENGINE] Seeding default templates failed: ${err.message}`);
  }
};

/**
 * Trigger matching playbooks for an event
 */
const triggerPlaybook = async (event, entity, organizationId) => {
  if (!organizationId) return;

  try {
    // 1. Find active playbooks for event
    const playbooks = await Playbook.find({
      organizationId,
      enabled: true,
      'trigger.event': event,
    });

    if (playbooks.length === 0) return;

    logger.info(`[PLAYBOOK-ENGINE] Triggered event "${event}" matching ${playbooks.length} playbook(s) for org: ${organizationId}`);

    // Normalize entity context properties
    const context = {
      event,
      playbookId: null,
      vulnId: entity._id,
      cve: entity.cve || entity.indicator || 'N/A',
      severity: entity.severity || 'High',
      priority: entity.priority || 'P2-High',
      asset: entity.assetId?.hostname || entity.hostname || 'Unknown Host',
      slaStatus: entity.slaStatus || 'Within SLA',
      riskScore: entity.riskScore || 50,
      description: entity.description || entity.message || 'Security event detected.',
      email: entity.assignedTo?.email || entity.email || '',
      title: entity.title || `Vulnerability ${entity.cve || 'Alert'}`,
      message: entity.message || `vulnerability ${entity.cve || 'alert'} severity ${entity.severity || 'Medium'}`
    };

    for (const playbook of playbooks) {
      // 2. Evaluate conditions
      let conditionsPass = true;
      if (playbook.trigger.conditions && playbook.trigger.conditions.length > 0) {
        conditionsPass = playbook.trigger.conditions.every(cond => evaluateCondition(cond, context));
      }

      if (!conditionsPass) {
        logger.info(`[PLAYBOOK-ENGINE] Playbook "${playbook.name}" conditions evaluated to false. Skipping.`);
        continue;
      }

      logger.info(`[PLAYBOOK-ENGINE] Executing playbook: "${playbook.name}"`);

      // 3. Create AutomationRun record
      const runActions = playbook.actions.map(act => ({
        type: act.type,
        status: 'pending',
        startedAt: null,
        completedAt: null,
        result: null,
        error: '',
      }));

      const playbookContext = { ...context, playbookId: playbook._id };

      const run = await AutomationRun.create({
        playbookId: playbook._id,
        organizationId,
        trigger: {
          event,
          entityId: entity._id,
          entityType: event.includes('vulnerability') || event.includes('sla') ? 'Vulnerability' : 'Notification',
        },
        status: 'pending',
        actions: runActions,
        actionCount: runActions.length,
        startedAt: new Date(),
      });

      // Update Playbook lastRun stats
      playbook.runCount += 1;
      playbook.lastRunAt = new Date();
      playbook.lastRunStatus = 'pending';
      await playbook.save();

      // 4. Enqueue actions
      for (let i = 0; i < playbook.actions.length; i++) {
        const action = playbook.actions[i];
        await actionQueue.enqueue({
          runId: run._id,
          actionIndex: i,
          actionType: action.type,
          integrationId: action.integrationId,
          actionConfig: action.config,
          context: playbookContext,
          organizationId,
        });
      }
    }
  } catch (err) {
    logger.error(`[PLAYBOOK-ENGINE] Error triggering playbooks: ${err.message}`);
  }
};

module.exports = {
  triggerPlaybook,
  seedDefaultTemplates,
  evaluateCondition,
};
