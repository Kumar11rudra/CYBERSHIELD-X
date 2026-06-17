const logger = require('../utils/logger');
const IntegrationConfig = require('../models/IntegrationConfig');

// Import modular connectors
const jira = require('./jira');
const github = require('./github');
const slack = require('./slack');
const teams = require('./teams');
const genericWebhook = require('./genericWebhook');
const { sendGenericAlertEmail } = require('../services/emailAlerts');

/**
 * Update the health status of an IntegrationConfig record
 */
const updateIntegrationHealth = async (configId, success, errorMsg = '') => {
  if (!configId) return;

  try {
    const status = success ? 'Healthy' : 'Failed';
    const update = {
      healthStatus: status,
      lastTestedAt: new Date(),
      lastTestStatus: success ? 'success' : 'failed',
      lastError: errorMsg,
    };

    if (success) {
      update.lastSuccessAt = new Date();
    } else {
      update.lastFailureAt = new Date();
    }

    await IntegrationConfig.findByIdAndUpdate(configId, update);
    logger.info(`[INTEGRATION-HEALTH] Config ${configId} updated to ${status}`);
  } catch (err) {
    logger.error(`[INTEGRATION-HEALTH] Failed updating health: ${err.message}`);
  }
};

/**
 * Execute a playbook integration action
 * @param {string} actionType
 * @param {string|object} integrationRef - IntegrationConfig ID or plain config object
 * @param {object} actionConfig
 * @param {object} context
 * @param {string} organizationId
 */
const executeIntegrationAction = async (actionType, integrationRef, actionConfig = {}, context = {}, organizationId = null) => {
  const start = Date.now();
  let configId = null;
  let configData = {};

  try {
    // 1. Resolve configuration data
    if (typeof integrationRef === 'string' || (integrationRef && integrationRef.constructor.name === 'ObjectId')) {
      configId = integrationRef.toString();
      const integrationConfig = await IntegrationConfig.findById(configId);
      if (!integrationConfig) {
        throw new Error(`IntegrationConfig not found with ID: ${configId}`);
      }
      if (!integrationConfig.active) {
        throw new Error(`IntegrationConfig ${integrationConfig.name} is inactive.`);
      }
      configData = { ...integrationConfig.config, ...actionConfig };
    } else if (integrationRef && typeof integrationRef === 'object') {
      // It's a config object or a config model document
      if (integrationRef._id) {
        configId = integrationRef._id.toString();
      }
      configData = { ...(integrationRef.config || integrationRef), ...actionConfig };
    } else {
      configData = actionConfig;
    }

    let response = null;

    // 2. Dispatch to correct connector
    switch (actionType) {
      case 'create_jira':
        response = await jira.createJiraTicket(configData, context);
        break;
      case 'create_github_issue':
        response = await github.createGitHubIssue(configData, context);
        break;
      case 'send_slack':
        response = await slack.sendSlackBlocks(configData, context);
        break;
      case 'send_teams':
        response = await teams.sendTeamsRichCard(configData, context);
        break;
      case 'generic_webhook':
        response = await genericWebhook.sendGenericPayload(configData, context);
        break;
      case 'send_email':
        const toAddress = configData.to || context.email;
        if (!toAddress) throw new Error('Email action missing recipient "to" address');
        await sendGenericAlertEmail({
          to: toAddress,
          username: configData.username || toAddress,
          title: context.title || `Alert: ${context.cve || 'System notification'}`,
          message: context.message || `${context.cve || 'Finding'} on ${context.asset || 'Asset'}`,
          severity: context.severity?.toLowerCase() || 'warning',
          category: 'vulnerability',
          source: 'playbook',
        });
        response = { delivered: true, to: toAddress };
        break;
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }

    // 3. Mark Healthy if successful
    if (configId) {
      await updateIntegrationHealth(configId, true);
    }

    return {
      success: true,
      response,
      error: null,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    logger.error(`[INTEGRATION-SERVICE] Action ${actionType} failed: ${err.message}`);
    // 4. Mark Failed if error
    if (configId) {
      await updateIntegrationHealth(configId, false, err.message);
    }

    return {
      success: false,
      response: null,
      error: err.message,
      durationMs: Date.now() - start,
    };
  }
};

/**
 * Test integration connection
 */
const testIntegrationConnection = async (type, config, configId = null) => {
  try {
    let result = null;
    switch (type) {
      case 'Jira':
        result = await jira.testJiraConnection(config);
        break;
      case 'GitHub':
        result = await github.testGitHubConnection(config);
        break;
      case 'Slack':
        result = await slack.testSlackConnection(config);
        break;
      case 'Teams':
        result = await teams.testTeamsConnection(config);
        break;
      case 'Generic Webhook':
      case 'Webhook':
        result = await genericWebhook.testWebhookConnection(config);
        break;
      default:
        throw new Error(`Unknown integration type: ${type}`);
    }

    if (configId) {
      await updateIntegrationHealth(configId, true);
    }
    return { success: true, result };
  } catch (err) {
    logger.error(`[INTEGRATION-TEST] Test for ${type} failed: ${err.message}`);
    if (configId) {
      await updateIntegrationHealth(configId, false, err.message);
    }
    return { success: false, error: err.message };
  }
};

module.exports = {
  executeIntegrationAction,
  testIntegrationConnection,
};
