const Playbook = require('../models/Playbook');
const AutomationRun = require('../models/AutomationRun');
const Vulnerability = require('../models/Vulnerability');
const playbookEngine = require('../services/playbookEngine');
const logger = require('../utils/logger');

// List all playbooks
const getPlaybooks = async (req, res, next) => {
  try {
    const orgId = req.organizationId;
    if (!orgId) return res.status(400).json({ error: 'Organization ID is required' });

    const playbooks = await Playbook.find({ organizationId: orgId }).sort({ createdAt: -1 });
    return res.json(playbooks);
  } catch (err) {
    next(err);
  }
};

// Create a new playbook
const createPlaybook = async (req, res, next) => {
  try {
    const orgId = req.organizationId;
    if (!orgId) return res.status(400).json({ error: 'Organization ID is required' });

    const { name, description, enabled, trigger, actions } = req.body;
    if (!name || !trigger || !actions || actions.length === 0) {
      return res.status(400).json({ error: 'Name, Trigger and at least one action are required' });
    }

    const playbook = await Playbook.create({
      organizationId: orgId,
      name,
      description,
      enabled: enabled !== undefined ? enabled : true,
      trigger,
      actions,
      version: 1,
      publishedAt: new Date(),
    });

    return res.status(201).json(playbook);
  } catch (err) {
    next(err);
  }
};

// Update an existing playbook
const updatePlaybook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const orgId = req.organizationId;

    const existing = await Playbook.findOne({ _id: id, organizationId: orgId });
    if (!existing) {
      return res.status(404).json({ error: 'Playbook not found for this organization' });
    }

    const { name, description, enabled, trigger, actions } = req.body;
    let modified = false;

    if (name && name !== existing.name) {
      existing.name = name;
      modified = true;
    }
    if (description !== undefined && description !== existing.description) {
      existing.description = description;
      modified = true;
    }
    if (enabled !== undefined && enabled !== existing.enabled) {
      existing.enabled = enabled;
      modified = true;
    }
    if (trigger && JSON.stringify(trigger) !== JSON.stringify(existing.trigger)) {
      existing.trigger = trigger;
      modified = true;
    }
    if (actions && JSON.stringify(actions) !== JSON.stringify(existing.actions)) {
      existing.actions = actions;
      modified = true;
    }

    if (modified) {
      existing.version = (existing.version || 1) + 1;
      existing.publishedAt = new Date();
      await existing.save();
    }

    return res.json(existing);
  } catch (err) {
    next(err);
  }
};

// Delete a playbook
const deletePlaybook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const orgId = req.organizationId;

    const result = await Playbook.findOneAndDelete({ _id: id, organizationId: orgId });
    if (!result) {
      return res.status(404).json({ error: 'Playbook not found for this organization' });
    }

    return res.json({ success: true, message: 'Playbook deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// Manually trigger a playbook
const triggerPlaybookManually = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { entityId } = req.body;
    const orgId = req.organizationId;

    const playbook = await Playbook.findOne({ _id: id, organizationId: orgId });
    if (!playbook) {
      return res.status(404).json({ error: 'Playbook not found' });
    }

    let targetEntity = {
      _id: entityId || null,
      cve: 'CVE-MANUAL-TEST',
      severity: 'High',
      priority: 'P2-High',
      hostname: 'manual-test-asset.local',
      slaStatus: 'Within SLA',
      riskScore: 75,
      description: 'Manually triggered execution test.',
    };

    if (entityId) {
      const vuln = await Vulnerability.findOne({ _id: entityId, organizationId: orgId }).populate('assetId');
      if (vuln) {
        targetEntity = vuln;
      }
    }

    // Run trigger engine
    await playbookEngine.triggerPlaybook('manual', targetEntity, orgId);

    return res.json({ success: true, message: 'Playbook execution run queued successfully.' });
  } catch (err) {
    next(err);
  }
};

// List all automation runs
const getAutomationRuns = async (req, res, next) => {
  try {
    const orgId = req.organizationId;
    if (!orgId) return res.status(400).json({ error: 'Organization ID is required' });

    const runs = await AutomationRun.find({ organizationId: orgId })
      .populate('playbookId', 'name')
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json(runs);
  } catch (err) {
    next(err);
  }
};

// Seed default playbook templates
const seedTemplates = async (req, res, next) => {
  try {
    const orgId = req.organizationId;
    if (!orgId) return res.status(400).json({ error: 'Organization ID is required' });

    await playbookEngine.seedDefaultTemplates(orgId);
    return res.json({ success: true, message: 'Default templates seeded.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPlaybooks,
  createPlaybook,
  updatePlaybook,
  deletePlaybook,
  triggerPlaybookManually,
  getAutomationRuns,
  seedTemplates,
};
