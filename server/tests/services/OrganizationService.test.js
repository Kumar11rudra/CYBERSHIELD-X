const mongoose = require('mongoose');
const orgService = require('../../services/org/OrganizationService');
const RBACService = require('../../services/org/RBACService');
const {
    organizationRepository,
    membershipRepository,
    teamRepository,
    webhookRepository,
    invitationRepository
} = require('../../repositories/OrgRepositories');

describe('OrganizationService', () => {
    let mockUserId;
    let mockOrgId;

    beforeEach(() => {
        mockUserId = new mongoose.Types.ObjectId();
        mockOrgId = new mongoose.Types.ObjectId();

        jest.spyOn(organizationRepository, 'create').mockResolvedValue({ _id: mockOrgId, name: 'Test Org', toObject: () => ({ _id: mockOrgId, name: 'Test Org' }) });
        jest.spyOn(membershipRepository, 'create').mockResolvedValue({});
        jest.spyOn(orgService.activityLogRepo, 'create').mockResolvedValue({});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Tenant Isolation', () => {
        it('should block getOrganization if user is not a member', async () => {
            jest.spyOn(membershipRepository, 'findOne').mockResolvedValue(null); // not a member

            await expect(orgService.getOrganization(mockOrgId, mockUserId))
                .rejects.toThrow('Tenant isolation violation: User is not a member of this organization');
        });

        it('should allow getOrganization if user is a member', async () => {
            jest.spyOn(membershipRepository, 'findOne').mockResolvedValue({ role: 'viewer' });
            jest.spyOn(organizationRepository, 'findById').mockResolvedValue({ _id: mockOrgId, status: 'active' });

            const org = await orgService.getOrganization(mockOrgId, mockUserId);
            expect(org._id).toEqual(mockOrgId);
        });
    });

    describe('Owner Protection', () => {
        it('should prevent deleting the last owner', async () => {
            jest.spyOn(membershipRepository, 'findOne')
                .mockResolvedValueOnce({ _id: 'actorMemId', role: 'owner' })
                .mockResolvedValueOnce({ _id: 'targetMemId', role: 'owner' });

            jest.spyOn(membershipRepository, 'count').mockResolvedValue(1); // Only 1 owner left

            await expect(orgService.removeMember(mockOrgId, mockUserId, new mongoose.Types.ObjectId()))
                .rejects.toThrow('Cannot remove the last owner');
        });

        it('should prevent demoting the last owner', async () => {
            jest.spyOn(membershipRepository, 'findOne')
                .mockResolvedValueOnce({ _id: 'actorMemId', role: 'owner' })
                .mockResolvedValueOnce({ _id: 'targetMemId', role: 'owner', toObject: () => ({}) });

            jest.spyOn(membershipRepository, 'count').mockResolvedValue(1);

            await expect(orgService.updateMemberRole(mockOrgId, mockUserId, new mongoose.Types.ObjectId(), 'admin'))
                .rejects.toThrow('Cannot demote the last owner');
        });
    });

    describe('Role Escalation Prevention', () => {
        it('should prevent admin from promoting someone to owner', async () => {
            jest.spyOn(membershipRepository, 'findOne')
                .mockResolvedValueOnce({ _id: 'actorMemId', role: 'admin' })
                .mockResolvedValueOnce({ _id: 'targetMemId', role: 'viewer' });

            await expect(orgService.updateMemberRole(mockOrgId, mockUserId, new mongoose.Types.ObjectId(), 'owner'))
                .rejects.toThrow('Insufficient privileges to perform this role change');
        });
    });

    describe('Webhook Secret Redaction', () => {
        it('should redact secret in listWebhooks', async () => {
            jest.spyOn(membershipRepository, 'findOne').mockResolvedValue({ role: 'admin' });
            jest.spyOn(webhookRepository, 'find').mockResolvedValue([{
                _id: 'wh1',
                secret: 'SUPER_SECRET',
                toObject: () => ({ _id: 'wh1', secret: 'SUPER_SECRET' })
            }]);
            jest.spyOn(webhookRepository, 'count').mockResolvedValue(1);

            const result = await orgService.listWebhooks(mockOrgId, mockUserId);
            expect(result.webhooks[0].secret).toEqual('********');
        });
    });

    describe('Soft Delete', () => {
        it('should soft delete an organization', async () => {
            jest.spyOn(membershipRepository, 'findOne').mockResolvedValue({ role: 'owner' });
            jest.spyOn(organizationRepository, 'findById').mockResolvedValue({ _id: mockOrgId, status: 'active', toObject: () => ({}) });
            
            const updateSpy = jest.spyOn(organizationRepository, 'update').mockResolvedValue({ _id: mockOrgId, status: 'deleted', toObject: () => ({ status: 'deleted' }) });

            await orgService.deleteOrganization(mockOrgId, mockUserId);
            expect(updateSpy).toHaveBeenCalledWith(mockOrgId, { status: 'deleted' });
        });
    });
});
