const IntegrationConfig = require('../models/IntegrationConfig');
const { testIntegrationConnection } = require('../integrations/integrationService');
const logger = require('../utils/logger');

// Get all integrations for organization
const getIntegrations = async (req, res, next) => {
  try {
    const orgId = req.organizationId;
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const configs = await IntegrationConfig.find({ organizationId: orgId });
    // Mask secrets using the helper
    const safeConfigs = configs.map(cfg => cfg.toSafeObject());
    return res.json(safeConfigs);
  } catch (err) {
    next(err);
  }
};

// Create a new integration
const createIntegration = async (req, res, next) => {
  try {
    const orgId = req.organizationId;
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const { type, name, config, active } = req.body;
    if (!type || !name || !config) {
      return res.status(400).json({ error: 'Type, Name and Config are required' });
    }

    const newConfig = await IntegrationConfig.create({
      organizationId: orgId,
      type,
      name,
      config,
      active: active !== undefined ? active : true,
      healthStatus: 'Unknown',
    });

    return res.status(201).json(newConfig.toSafeObject());
  } catch (err) {
    next(err);
  }
};

// Update an existing integration
const updateIntegration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const orgId = req.organizationId;

    const existing = await IntegrationConfig.findOne({ _id: id, organizationId: orgId });
    if (!existing) {
      return res.status(404).json({ error: 'Integration not found for this organization' });
    }

    const { name, config, active } = req.body;
    if (name) existing.name = name;
    if (active !== undefined) existing.active = active;
    
    if (config) {
      // Merge keys: if a password/secret is passed as '••••••••', keep the old one!
      const oldConfig = existing.config || {};
      const newConfig = { ...config };
      ['apiToken', 'token', 'webhookUrl', 'routingKey', 'secret'].forEach(key => {
        if (newConfig[key] === '••••••••') {
          newConfig[key] = oldConfig[key];
        }
      });
      existing.config = newConfig;
    }

    await existing.save();
    return res.json(existing.toSafeObject());
  } catch (err) {
    next(err);
  }
};

// Delete an integration
const deleteIntegration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const orgId = req.organizationId;

    const result = await IntegrationConfig.findOneAndDelete({ _id: id, organizationId: orgId });
    if (!result) {
      return res.status(404).json({ error: 'Integration not found for this organization' });
    }

    return res.json({ success: true, message: 'Integration deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// Test connection on existing integration or on provided parameters
const testIntegration = async (req, res, next) => {
  try {
    const { id } = req.body;
    let type = req.body.type;
    let config = req.body.config;

    const orgId = req.organizationId;

    if (id) {
      const existing = await IntegrationConfig.findOne({ _id: id, organizationId: orgId });
      if (!existing) {
        return res.status(404).json({ error: 'Integration not found' });
      }
      type = existing.type;
      config = existing.config;
    }

    if (!type || !config) {
      return res.status(400).json({ error: 'Type and config credentials are required' });
    }

    // If updating/testing from client request, make sure we don't overwrite secrets with masked characters
    if (id) {
      const existing = await IntegrationConfig.findOne({ _id: id });
      if (existing) {
        const oldConfig = existing.config || {};
        ['apiToken', 'token', 'webhookUrl', 'routingKey', 'secret'].forEach(key => {
          if (config[key] === '••••••••') {
            config[key] = oldConfig[key];
          }
        });
      }
    }

    const testResult = await testIntegrationConnection(type, config, id || null);
    if (testResult.success) {
      return res.json({ success: true, message: 'Connection test passed successfully.' });
    } else {
      return res.status(400).json({ success: false, error: testResult.error });
    }
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getIntegrations,
  createIntegration,
  updateIntegration,
  deleteIntegration,
  testIntegration,
};
