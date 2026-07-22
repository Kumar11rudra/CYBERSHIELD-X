/**
 * @module TeamService
 * @description Domain service for managing Teams.
 */
class TeamService {
    /**
     * @param {Object} deps
     * @param {import('./TeamRepository')} deps.teamRepo
     * @param {import('./MembershipRepository')} deps.membershipRepo
     * @param {import('../chatbot_core/events/EventPublisher')} deps.eventPublisher
     */
    constructor(deps) {
        this.teamRepo = deps.teamRepo;
        this.membershipRepo = deps.membershipRepo;
        this.eventPublisher = deps.eventPublisher;
    }

    async createTeam(organizationId, name) {
        if (!name) throw new Error('Team name is required.');

        const team = await this.teamRepo.create({
            organizationId,
            name
        });

        await this.eventPublisher.publish({
            type: 'TeamCreated',
            source: 'TeamService',
            payload: { teamId: team.id, organizationId, name }
        });

        return team;
    }

    async getTeamsByOrgId(organizationId) {
        return await this.teamRepo.findMany({ organizationId });
    }

    async updateTeam(teamId, name) {
        const team = await this.teamRepo.update({ id: teamId, name });
        if (!team) throw new Error('Team not found.');

        await this.eventPublisher.publish({
            type: 'TeamUpdated',
            source: 'TeamService',
            payload: { teamId, name }
        });

        return team;
    }

    async deleteTeam(teamId) {
        const team = await this.teamRepo.findById(teamId);
        if (!team) throw new Error('Team not found.');

        await this.teamRepo.delete(teamId);
        
        // Remove from memberships
        // (Assuming MembershipRepository exposes a method or we rely on DB level cleanup/bulk update)
        // For now, in a fully decoupled layer, we might emit an event and a Membership Event Handler cleans it up.
        await this.eventPublisher.publish({
            type: 'TeamDeleted',
            source: 'TeamService',
            payload: { teamId, organizationId: team.organizationId }
        });

        return true;
    }
}

module.exports = TeamService;
