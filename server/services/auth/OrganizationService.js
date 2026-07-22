/**
 * @module OrganizationService
 * @description Domain service for managing Organizations and their settings.
 */
class OrganizationService {
    /**
     * @param {Object} deps
     * @param {import('./OrganizationRepository')} deps.orgRepo
     * @param {import('../chatbot_core/events/EventPublisher')} deps.eventPublisher
     */
    constructor(deps) {
        this.orgRepo = deps.orgRepo;
        this.eventPublisher = deps.eventPublisher;
    }

    async createOrganization(name, description, ownerId) {
        if (!name) {
            throw new Error('Organization name is required.');
        }

        const org = await this.orgRepo.create({
            name,
            ownerId,
            description
        });

        await this.eventPublisher.publish({
            type: 'OrganizationCreated',
            source: 'OrganizationService',
            payload: { orgId: org.id, ownerId, name }
        });

        return org;
    }

    async getOrganizationDetails(orgId) {
        const org = await this.orgRepo.findById(orgId);
        if (!org) {
            throw new Error('Organization not found.');
        }
        return org;
    }
}

module.exports = OrganizationService;
