const crypto = require('crypto');
const Organization = require('../models/Organization');
const OrganizationSettings = require('../models/OrganizationSettings');
const Membership = require('../models/Membership');
const Team = require('../models/Team');
const User = require('../models/User');
const Webhook = require('../models/Webhook');
const Invitation = require('../models/Invitation');
const logger = require('../utils/logger');
const cache = require('../utils/cache');

// ─── Organization CRUD ───────────────────────────────────────────────────────

const createOrg = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Organization name is required.' });
    }

    const org = await Organization.create({
      name,
      ownerId: req.user._id,
      description,
    });

    await OrganizationSettings.create({
      organizationId: org._id,
    });

    await Membership.create({
      organizationId: org._id,
      userId: req.user._id,
      role: 'owner',
    });

    logger.info(`[SaaS] Organization created: ${name} (Owner: ${req.user.username})`);
    res.status(201).json({ success: true, org });
  } catch (error) {
    next(error);
  }
};

const getUserOrgs = async (req, res, next) => {
  try {
    const memberships = await Membership.find({ userId: req.user._id })
      .populate('organizationId')
      .lean();

    const orgs = memberships
      .filter((m) => m.organizationId)
      .map((m) => ({
        ...m.organizationId,
        role: m.role,
        teams: m.teams,
      }));

    res.json({ success: true, orgs });
  } catch (error) {
    next(error);
  }
};

const getOrgDetails = async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const cacheKey = `org:details:${orgId}`;

    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const org = await Organization.findById(orgId).lean();
    if (!org) {
      return res.status(404).json({ error: 'Organization not found.' });
    }

    const settings = await OrganizationSettings.findOne({ organizationId: orgId }).lean();
    const members = await Membership.find({ organizationId: orgId })
      .populate('userId', 'username email fullName role')
      .lean();
    const teams = await Team.find({ organizationId: orgId }).lean();
    const webhooks = await Webhook.find({ organizationId: orgId }).lean();
    const invitations = await Invitation.find({ organizationId: orgId }).lean();

    const responseData = {
      success: true,
      org,
      settings,
      members,
      teams,
      webhooks,
      invitations,
    };

    await cache.set(cacheKey, responseData, 300);
    res.json(responseData);
  } catch (error) {
    next(error);
  }
};

const updateOrgSettings = async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const { defaultRiskThreshold, alertChannels, retentionDays, aiModel, branding, timezone } = req.body;

    const settings = await OrganizationSettings.findOneAndUpdate(
      { organizationId: orgId },
      {
        defaultRiskThreshold,
        alertChannels,
        retentionDays,
        aiModel,
        branding,
        timezone,
      },
      { new: true, upsert: true }
    );

    await cache.delete(`org:details:${orgId}`);
    logger.info(`[SaaS] Settings updated for Org: ${orgId}`);
    res.json({ success: true, settings });
  } catch (error) {
    next(error);
  }
};

// ─── Membership Management ───────────────────────────────────────────────────

const addOrgMember = async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const { email, role, teamIds } = req.body;

    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required.' });
    }

    // Resolve PII encrypted search hash
    const emailHash = crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
    const user = await User.findOne({ emailHash });

    if (!user) {
      return res.status(404).json({ error: 'User with this email not registered on CyberShield X.' });
    }

    // Check duplicate
    const exists = await Membership.findOne({ organizationId: orgId, userId: user._id });
    if (exists) {
      return res.status(409).json({ error: 'User is already a member of this organization.' });
    }

    const membership = await Membership.create({
      organizationId: orgId,
      userId: user._id,
      role,
      teams: teamIds || [],
    });

    await cache.delete(`org:details:${orgId}`);
    logger.info(`[SaaS] Member ${user.username} added to Org ${orgId} as ${role}`);
    res.status(201).json({ success: true, membership });
  } catch (error) {
    next(error);
  }
};

const updateMemberRole = async (req, res, next) => {
  try {
    const { orgId, userId } = req.params;
    const { role, teamIds } = req.body;

    const membership = await Membership.findOne({ organizationId: orgId, userId });
    if (!membership) {
      return res.status(404).json({ error: 'Membership record not found.' });
    }

    // Protect Owner modification
    if (membership.role === 'owner' && role !== 'owner') {
      return res.status(400).json({ error: 'Owner role cannot be modified. Transfer ownership first.' });
    }

    if (role) membership.role = role;
    if (teamIds) membership.teams = teamIds;
    await membership.save();

    await cache.delete(`org:details:${orgId}`);
    logger.info(`[SaaS] Member ${userId} role/teams updated in Org ${orgId}`);
    res.json({ success: true, membership });
  } catch (error) {
    next(error);
  }
};

const removeOrgMember = async (req, res, next) => {
  try {
    const { orgId, userId } = req.params;

    const membership = await Membership.findOne({ organizationId: orgId, userId });
    if (!membership) {
      return res.status(404).json({ error: 'Membership record not found.' });
    }

    if (membership.role === 'owner') {
      return res.status(400).json({ error: 'Cannot remove organization owner.' });
    }

    await Membership.deleteOne({ _id: membership._id });
    await cache.delete(`org:details:${orgId}`);
    logger.info(`[SaaS] Member ${userId} removed from Org ${orgId}`);
    res.json({ success: true, message: 'Member successfully removed.' });
  } catch (error) {
    next(error);
  }
};

// ─── Team Management ─────────────────────────────────────────────────────────

const createTeam = async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Team name is required.' });
    }

    const team = await Team.create({
      organizationId: orgId,
      name,
    });

    await cache.delete(`org:details:${orgId}`);
    res.status(201).json({ success: true, team });
  } catch (error) {
    next(error);
  }
};

const updateTeam = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { name } = req.body;

    const existingTeam = await Team.findById(teamId);
    if (existingTeam) {
      await cache.delete(`org:details:${existingTeam.organizationId}`);
    }

    const team = await Team.findByIdAndUpdate(teamId, { name }, { new: true });
    if (!team) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    res.json({ success: true, team });
  } catch (error) {
    next(error);
  }
};

const deleteTeam = async (req, res, next) => {
  try {
    const { teamId } = req.params;

    const existingTeam = await Team.findById(teamId);
    if (existingTeam) {
      await cache.delete(`org:details:${existingTeam.organizationId}`);
    }

    const team = await Team.findByIdAndDelete(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    // Remove team reference from memberships
    await Membership.updateMany({ teams: teamId }, { $pull: { teams: teamId } });

    res.json({ success: true, message: 'Team deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ─── Webhook Management ──────────────────────────────────────────────────────

const createWebhook = async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const { name, url, type, events } = req.body;

    if (!name || !url) {
      return res.status(400).json({ error: 'Name and URL are required.' });
    }

    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = await Webhook.create({
      organizationId: orgId,
      name,
      url,
      type: type || 'Generic',
      events: events || ['critical_ioc', 'critical_vuln', 'ssl_expired', 'high_risk_correlation'],
      secret,
    });

    await cache.delete(`org:details:${orgId}`);
    logger.info(`[SaaS] Webhook registered: ${name} (Type: ${webhook.type})`);
    res.status(201).json({ success: true, webhook });
  } catch (error) {
    next(error);
  }
};

const deleteWebhook = async (req, res, next) => {
  try {
    const { webhookId } = req.params;

    const existingWebhook = await Webhook.findById(webhookId);
    if (existingWebhook) {
      await cache.delete(`org:details:${existingWebhook.organizationId}`);
    }

    const webhook = await Webhook.findByIdAndDelete(webhookId);
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found.' });
    }

    res.json({ success: true, message: 'Webhook deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrg,
  getUserOrgs,
  getOrgDetails,
  updateOrgSettings,
  addOrgMember,
  updateMemberRole,
  removeOrgMember,
  createTeam,
  updateTeam,
  deleteTeam,
  createWebhook,
  deleteWebhook,
};
