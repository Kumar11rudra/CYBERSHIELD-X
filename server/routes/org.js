const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireOrgContext, enforcePermission } = require('../middleware/orgAuth');
const { PERMISSIONS } = require('../utils/permissions');
const {
  createOrg,
  getOrganizations,
  getUserOrgs,
  getOrgDetails,
  updateOrgSettings,
  deleteOrganization,
  addOrgMember,
  inviteMember,
  updateMemberRole,
  removeOrgMember,
  createTeam,
  listTeams,
  updateTeam,
  deleteTeam,
  createWebhook,
  listWebhooks,
  updateWebhook,
  deleteWebhook,
} = require('../controllers/orgController');

// Global routes for current user workspace contexts
router.post('/', authenticate, createOrg);
router.get('/', authenticate, getOrganizations);

// Scoped Tenant routes
router.get('/:orgId', authenticate, requireOrgContext, enforcePermission(PERMISSIONS.ORG_VIEW_MEMBERS), getOrgDetails);
router.put('/:orgId', authenticate, requireOrgContext, enforcePermission(PERMISSIONS.ORG_UPDATE_SETTINGS), updateOrgSettings);
router.delete('/:orgId', authenticate, requireOrgContext, enforcePermission(PERMISSIONS.ORG_UPDATE_SETTINGS), deleteOrganization);

// Member routes
router.post('/:orgId/members', authenticate, requireOrgContext, enforcePermission(PERMISSIONS.ORG_MANAGE_MEMBERS), inviteMember);
router.put('/:orgId/members/:userId', authenticate, requireOrgContext, enforcePermission(PERMISSIONS.ORG_MANAGE_MEMBERS), updateMemberRole);
router.delete('/:orgId/members/:userId', authenticate, requireOrgContext, enforcePermission(PERMISSIONS.ORG_MANAGE_MEMBERS), removeOrgMember);

// Team routes
router.post('/:orgId/teams', authenticate, requireOrgContext, enforcePermission(PERMISSIONS.ORG_MANAGE_TEAMS), createTeam);
router.get('/:orgId/teams', authenticate, requireOrgContext, enforcePermission(PERMISSIONS.ORG_VIEW_MEMBERS), listTeams);
router.put('/:orgId/teams/:teamId', authenticate, requireOrgContext, enforcePermission(PERMISSIONS.ORG_MANAGE_TEAMS), updateTeam);
router.delete('/:orgId/teams/:teamId', authenticate, requireOrgContext, enforcePermission(PERMISSIONS.ORG_MANAGE_TEAMS), deleteTeam);

// Webhook routes
router.post('/:orgId/webhooks', authenticate, requireOrgContext, enforcePermission(PERMISSIONS.WEBHOOK_MANAGE), createWebhook);
router.get('/:orgId/webhooks', authenticate, requireOrgContext, enforcePermission(PERMISSIONS.WEBHOOK_MANAGE), listWebhooks);
router.put('/:orgId/webhooks/:webhookId', authenticate, requireOrgContext, enforcePermission(PERMISSIONS.WEBHOOK_MANAGE), updateWebhook);
router.delete('/:orgId/webhooks/:webhookId', authenticate, requireOrgContext, enforcePermission(PERMISSIONS.WEBHOOK_MANAGE), deleteWebhook);

module.exports = router;
