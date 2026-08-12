const crypto = require('crypto');
const RBACService = require('./RBACService');
const {
    organizationRepository,
    membershipRepository,
    teamRepository,
    webhookRepository,
    invitationRepository
} = require('../../repositories/OrgRepositories');
const ActivityLogRepository = require('../../repositories/ActivityLogRepository');

class OrganizationService {
    constructor() {
        this.activityLogRepo = new ActivityLogRepository();
    }

    async _log(actorId, orgId, action, target, oldValues = {}, newValues = {}, metadata = {}) {
        await this.activityLogRepo.create({
            userId: actorId,
            organizationId: orgId,
            action,
            target,
            metadata: { ...metadata, oldValues, newValues },
            timestamp: new Date()
        });
    }

    async _getMembership(orgId, userId) {
        return membershipRepository.findOne({ organizationId: orgId, userId });
    }

    async _requireRole(orgId, userId, checkFn) {
        const membership = await this._getMembership(orgId, userId);
        if (!membership) throw new Error('Tenant isolation violation: User is not a member of this organization');
        if (!RBACService[checkFn](membership.role)) {
            throw new Error(`RBAC violation: User lacks required role for ${checkFn}`);
        }
        return membership;
    }

    async createOrganization(userId, data) {
        if (!data || !data.name) {
            const err = new Error('Organization name is required');
            err.status = 400;
            throw err;
        }
        const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        
        const org = await organizationRepository.create({
            name: data.name,
            slug,
            description: data.description,
            ownerId: userId
        });

        const OrganizationSettings = require('../../models/OrganizationSettings');
        await OrganizationSettings.create({
            organizationId: org._id
        });

        await membershipRepository.create({
            organizationId: org._id,
            userId,
            role: 'owner'
        });

        await this._log(userId, org._id, 'CREATE_ORGANIZATION', org._id.toString(), {}, org.toObject());
        return org;
    }

    async getUserOrganizations(userId) {
        const memberships = await membershipRepository.find({ userId });
        const orgIds = memberships.map(m => m.organizationId);
        const orgs = await organizationRepository.find({ _id: { $in: orgIds }, status: 'active' });
        
        return orgs.map(org => {
            const member = memberships.find(m => m.organizationId.toString() === org._id.toString());
            return {
                ...org.toObject(),
                myRole: member.role,
                role: member.role
            };
        });
    }

    async getOrganization(orgId, userId) {
        await this._requireRole(orgId, userId, 'canView');
        const org = await organizationRepository.findById(orgId);
        if (!org || org.status === 'deleted') throw new Error('Organization not found');
        return org;
    }

    async updateOrganization(orgId, userId, data) {
        await this._requireRole(orgId, userId, 'canUpdateSettings'); // owner or admin
        const org = await organizationRepository.findById(orgId);
        if (!org || org.status === 'deleted') throw new Error('Organization not found');

        const updated = await organizationRepository.update(orgId, {
            name: data.name || org.name,
            description: data.description || org.description,
            plan: data.plan || org.plan
        });

        const OrganizationSettings = require('../../models/OrganizationSettings');
        let settings = await OrganizationSettings.findOne({ organizationId: orgId });
        if (!settings) {
            settings = new OrganizationSettings({ organizationId: orgId });
        }
        if (data.defaultRiskThreshold !== undefined) settings.defaultRiskThreshold = data.defaultRiskThreshold;
        if (data.aiModel !== undefined) settings.aiModel = data.aiModel;
        if (data.retentionDays !== undefined) settings.retentionDays = data.retentionDays;
        if (data.timezone !== undefined) settings.timezone = data.timezone;
        await settings.save();

        await this._log(userId, orgId, 'UPDATE_ORGANIZATION', orgId.toString(), org.toObject(), updated.toObject());
        return { org: updated, settings };
    }

    async deleteOrganization(orgId, userId) {
        await this._requireRole(orgId, userId, 'canManageBilling'); // only owner should delete
        const org = await organizationRepository.findById(orgId);
        if (!org || org.status === 'deleted') throw new Error('Organization not found');

        // Soft delete
        const deleted = await organizationRepository.update(orgId, { status: 'deleted' });
        await this._log(userId, orgId, 'DELETE_ORGANIZATION', orgId.toString(), org.toObject(), deleted.toObject());
        return { success: true };
    }

    // Members and Invitations
    async inviteMember(orgId, inviterId, email, role) {
        await this._requireRole(orgId, inviterId, 'canInvite');
        
        // Prevent duplicate invites or members
        const existingMemberQuery = { organizationId: orgId, userId: { $exists: true } }; 
        
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        const invitation = await invitationRepository.create({
            organizationId: orgId,
            email,
            role,
            token,
            expiresAt
        });

        await this._log(inviterId, orgId, 'INVITE_MEMBER', email, {}, { role });
        return invitation;
    }

    async removeMember(orgId, actorId, targetUserId) {
        const actorMembership = await this._requireRole(orgId, actorId, 'canInvite');
        const targetMembership = await this._getMembership(orgId, targetUserId);
        
        if (!targetMembership) throw new Error('Target is not a member');
        
        if (!RBACService.canManageRole(actorMembership.role, targetMembership.role)) {
            throw new Error('You cannot remove a member with equal or higher privileges');
        }

        if (targetMembership.role === 'owner') {
            const ownerCount = await membershipRepository.count({ organizationId: orgId, role: 'owner' });
            if (ownerCount <= 1) throw new Error('Cannot remove the last owner');
        }

        await membershipRepository.delete({ _id: targetMembership._id });
        await this._log(actorId, orgId, 'REMOVE_MEMBER', targetUserId.toString(), targetMembership.toObject(), {});
        return { success: true };
    }

    async updateMemberRole(orgId, actorId, targetUserId, newRole) {
        const actorMembership = await this._requireRole(orgId, actorId, 'canInvite');
        const targetMembership = await this._getMembership(orgId, targetUserId);
        
        if (!targetMembership) throw new Error('Target is not a member');
        
        if (!RBACService.canManageRole(actorMembership.role, targetMembership.role) || 
            !RBACService.canManageRole(actorMembership.role, newRole)) {
            throw new Error('Insufficient privileges to perform this role change');
        }

        if (targetMembership.role === 'owner' && newRole !== 'owner') {
            const ownerCount = await membershipRepository.count({ organizationId: orgId, role: 'owner' });
            if (ownerCount <= 1) throw new Error('Cannot demote the last owner');
        }

        const updated = await membershipRepository.update({ _id: targetMembership._id }, { role: newRole });
        await this._log(actorId, orgId, 'UPDATE_MEMBER_ROLE', targetUserId.toString(), targetMembership.toObject(), updated.toObject());
        return updated;
    }

    // Teams
    async createTeam(orgId, userId, data) {
        await this._requireRole(orgId, userId, 'canManageTeams');
        const team = await teamRepository.create({
            organizationId: orgId,
            name: data.name
        });
        await this._log(userId, orgId, 'CREATE_TEAM', team._id.toString(), {}, team.toObject());
        return team;
    }

    async listTeams(orgId, userId, query = {}) {
        await this._requireRole(orgId, userId, 'canView');
        const limit = parseInt(query.limit) || 10;
        const page = parseInt(query.page) || 1;
        const skip = (page - 1) * limit;

        const filter = { organizationId: orgId, status: 'active' };
        if (query.name) filter.name = new RegExp(query.name, 'i');

        const teams = await teamRepository.find(filter, skip, limit);
        const total = await teamRepository.count(filter);

        return { teams, total, page, limit };
    }

    async updateTeam(orgId, teamId, userId, data) {
        await this._requireRole(orgId, userId, 'canManageTeams');
        const team = await teamRepository.findById(teamId);
        if (!team || team.organizationId.toString() !== orgId || team.status === 'deleted') {
            throw new Error('Team not found');
        }
        
        const updated = await teamRepository.update(teamId, { name: data.name || team.name });
        await this._log(userId, orgId, 'UPDATE_TEAM', teamId.toString(), team.toObject(), updated.toObject());
        return updated;
    }

    async deleteTeam(orgId, teamId, userId) {
        await this._requireRole(orgId, userId, 'canManageTeams');
        const team = await teamRepository.findById(teamId);
        if (!team || team.organizationId.toString() !== orgId || team.status === 'deleted') {
            throw new Error('Team not found');
        }

        const membersInTeam = await membershipRepository.count({ organizationId: orgId, teams: teamId });
        if (membersInTeam > 0) throw new Error('Cannot delete team while active members are assigned');

        const deleted = await teamRepository.update(teamId, { status: 'deleted' });
        await this._log(userId, orgId, 'DELETE_TEAM', teamId.toString(), team.toObject(), deleted.toObject());
        return { success: true };
    }

    // Webhooks
    async createWebhook(orgId, userId, data) {
        await this._requireRole(orgId, userId, 'canManageWebhooks');
        const secret = data.secret || crypto.randomBytes(32).toString('hex');
        const webhook = await webhookRepository.create({
            organizationId: orgId,
            name: data.name,
            url: data.url,
            secret,
            events: data.events,
            type: data.type
        });
        await this._log(userId, orgId, 'CREATE_WEBHOOK', webhook._id.toString(), {}, { name: webhook.name, url: webhook.url });
        const obj = webhook.toObject();
        obj.secret = '********';
        return obj;
    }

    async listWebhooks(orgId, userId, query = {}) {
        await this._requireRole(orgId, userId, 'canManageWebhooks');
        
        const limit = parseInt(query.limit) || 10;
        const page = parseInt(query.page) || 1;
        const skip = (page - 1) * limit;

        const filter = { organizationId: orgId };
        if (query.active !== undefined) filter.active = query.active === 'true';

        const webhooks = await webhookRepository.find(filter, skip, limit);
        const total = await webhookRepository.count(filter);

        const mapped = webhooks.map(w => {
            const obj = w.toObject();
            obj.secret = '********';
            return obj;
        });

        return { webhooks: mapped, total, page, limit };
    }

    async updateWebhook(orgId, webhookId, userId, data) {
        await this._requireRole(orgId, userId, 'canManageWebhooks');
        const webhook = await webhookRepository.findById(webhookId);
        if (!webhook || webhook.organizationId.toString() !== orgId) throw new Error('Webhook not found');

        const updated = await webhookRepository.update(webhookId, {
            name: data.name || webhook.name,
            url: data.url || webhook.url,
            events: data.events || webhook.events,
            active: data.active !== undefined ? data.active : webhook.active,
            type: data.type || webhook.type
        });

        await this._log(userId, orgId, 'UPDATE_WEBHOOK', webhookId.toString(), { name: webhook.name }, { name: updated.name });
        const obj = updated.toObject();
        obj.secret = '********';
        return obj;
    }

    async deleteWebhook(orgId, webhookId, userId) {
        await this._requireRole(orgId, userId, 'canManageWebhooks');
        const webhook = await webhookRepository.findById(webhookId);
        if (!webhook || webhook.organizationId.toString() !== orgId) throw new Error('Webhook not found');

        await webhookRepository.delete(webhookId);
        await this._log(userId, orgId, 'DELETE_WEBHOOK', webhookId.toString(), { name: webhook.name }, {});
        return { success: true };
    }
}

module.exports = new OrganizationService();
