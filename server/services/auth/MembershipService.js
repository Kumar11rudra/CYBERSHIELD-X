const crypto = require('crypto');

/**
 * @module MembershipService
 * @description Domain service for managing Memberships in Organizations.
 */
class MembershipService {
    /**
     * @param {Object} deps
     * @param {import('./MembershipRepository')} deps.membershipRepo
     * @param {import('./UserRepository')} deps.userRepo
     * @param {import('../chatbot_core/events/EventPublisher')} deps.eventPublisher
     */
    constructor(deps) {
        this.membershipRepo = deps.membershipRepo;
        this.userRepo = deps.userRepo;
        this.eventPublisher = deps.eventPublisher;
    }

    async addMember(organizationId, email, role, teamIds = []) {
        if (!email || !role) throw new Error('Email and role are required.');

        const emailHash = crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
        const user = await this.userRepo.findOne({ emailHash });

        if (!user) {
            throw new Error('User with this email not registered on CyberShield X.');
        }

        const exists = await this.membershipRepo.findOne({ organizationId, userId: user.id });
        if (exists) {
            throw new Error('User is already a member of this organization.');
        }

        const membership = await this.membershipRepo.create({
            organizationId,
            userId: user.id,
            role,
            teams: teamIds
        });

        await this.eventPublisher.publish({
            type: 'MembershipAdded',
            source: 'MembershipService',
            payload: { organizationId, userId: user.id, role }
        });

        return { membership, user };
    }

    async addMemberByUserId(organizationId, userId, role, teamIds = []) {
        if (!userId || !role) throw new Error('User ID and role are required.');

        const exists = await this.membershipRepo.findOne({ organizationId, userId });
        if (exists) {
            throw new Error('User is already a member of this organization.');
        }

        const membership = await this.membershipRepo.create({
            organizationId,
            userId,
            role,
            teams: teamIds
        });

        await this.eventPublisher.publish({
            type: 'MembershipAdded',
            source: 'MembershipService',
            payload: { organizationId, userId, role }
        });

        return membership;
    }

    async updateMemberRole(organizationId, userId, role, teamIds) {
        const membership = await this.membershipRepo.findOne({ organizationId, userId });
        if (!membership) {
            throw new Error('Membership record not found.');
        }

        if (membership.role === 'owner' && role !== 'owner') {
            throw new Error('Owner role cannot be modified. Transfer ownership first.');
        }

        const updates = { id: membership.id };
        if (role) updates.role = role;
        if (teamIds) updates.teams = teamIds;

        const updatedMembership = await this.membershipRepo.update(updates);

        await this.eventPublisher.publish({
            type: 'MembershipUpdated',
            source: 'MembershipService',
            payload: { organizationId, userId, role, teamIds }
        });

        return updatedMembership;
    }

    async removeMember(organizationId, userId) {
        const membership = await this.membershipRepo.findOne({ organizationId, userId });
        if (!membership) {
            throw new Error('Membership record not found.');
        }

        if (membership.role === 'owner') {
            throw new Error('Cannot remove organization owner.');
        }

        await this.membershipRepo.delete(membership.id);

        await this.eventPublisher.publish({
            type: 'MembershipRemoved',
            source: 'MembershipService',
            payload: { organizationId, userId }
        });

        return true;
    }

    async getUserMemberships(userId) {
        return await this.membershipRepo.findMany({ userId });
    }

    async getMembersByOrgId(organizationId) {
        const memberships = await this.membershipRepo.findMany({ organizationId });
        const membersWithUsers = [];
        for (const membership of memberships) {
            const user = await this.userRepo.findById(membership.userId);
            membersWithUsers.push({
                ...membership,
                userId: user ? {
                    _id: user.id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role
                } : null
            });
        }
        return membersWithUsers;
    }

    async removeTeamFromMemberships(teamId) {
        // Find all memberships with this teamId
        const memberships = await this.membershipRepo.findMany({ teams: teamId });
        for (const membership of memberships) {
            const newTeams = membership.teams.filter(t => t !== teamId);
            await this.membershipRepo.update({ id: membership.id, teams: newTeams });
        }
    }
}

module.exports = MembershipService;
