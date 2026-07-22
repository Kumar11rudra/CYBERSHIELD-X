const mongoose = require('mongoose');
const AssetService = require('../../services/asset/AssetService');
const RBACService = require('../../services/org/RBACService');
const AssetRepository = require('../../repositories/AssetRepository');

// Mock dependencies
jest.mock('../../services/org/RBACService');
jest.mock('../../repositories/AssetRepository');
// Mock the private ActivityLogRepo since it's instantiated inside AssetService
const ActivityLogRepository = require('../../repositories/ActivityLogRepository');
jest.mock('../../repositories/ActivityLogRepository');

describe('AssetService', () => {
    let mockOrgId;
    let mockUserId;

    beforeEach(() => {
        mockOrgId = new mongoose.Types.ObjectId();
        mockUserId = new mongoose.Types.ObjectId();
        jest.clearAllMocks();

        // Assume RBAC always succeeds unless mocked to throw
        RBACService.requirePermission.mockResolvedValue(true);
    });

    describe('CRUD and Isolation', () => {
        it('should create an asset and assign organizationId', async () => {
            AssetRepository.checkDuplicate.mockResolvedValue(false);
            
            const mockAsset = {
                _id: new mongoose.Types.ObjectId(),
                hostname: 'test.com',
                organizationId: mockOrgId,
                status: 'active'
            };
            AssetRepository.create.mockResolvedValue(mockAsset);

            const result = await AssetService.createAsset(mockOrgId, mockUserId, { hostname: 'test.com' });
            
            expect(result.hostname).toBe('test.com');
            expect(result.organizationId).toBe(mockOrgId.toString());
            expect(RBACService.requirePermission).toHaveBeenCalledWith(mockOrgId, mockUserId, 'canEdit');
        });

        it('should block creation if duplicate hostname exists', async () => {
            AssetRepository.checkDuplicate.mockResolvedValue(true);

            await expect(AssetService.createAsset(mockOrgId, mockUserId, { hostname: 'dup.com' }))
                .rejects.toThrow('Asset with this hostname already exists in the organization.');
        });

        it('should soft delete instead of hard delete', async () => {
            const mockAssetId = new mongoose.Types.ObjectId();
            AssetRepository.findByIdAndOrg.mockResolvedValue({ _id: mockAssetId, status: 'active' });
            AssetRepository.update.mockResolvedValue({ _id: mockAssetId, status: 'deleted' });

            const deleted = await AssetService.deleteAsset(mockOrgId, mockUserId, mockAssetId);
            
            expect(deleted.status).toBe('deleted');
            expect(AssetRepository.update).toHaveBeenCalledWith(mockAssetId, mockOrgId, { status: 'deleted', updatedBy: mockUserId });
        });

        it('should restore an asset with canManageTeams permission', async () => {
            const mockAssetId = new mongoose.Types.ObjectId();
            AssetRepository.findByIdAndOrg.mockResolvedValue({ _id: mockAssetId, status: 'deleted' });
            AssetRepository.update.mockResolvedValue({ _id: mockAssetId, status: 'active' });

            const restored = await AssetService.restoreAsset(mockOrgId, mockUserId, mockAssetId);
            
            expect(restored.status).toBe('active');
            expect(RBACService.requirePermission).toHaveBeenCalledWith(mockOrgId, mockUserId, 'canManageTeams');
        });
    });

    describe('Bulk Operations', () => {
        it('should bulk create assets and collect successes and failures', async () => {
            // Mock RBAC
            RBACService.requirePermission.mockResolvedValue(true);

            // Mock createAsset on AssetService (spy on itself)
            const createSpy = jest.spyOn(AssetService, 'createAsset')
                .mockResolvedValueOnce({ hostname: '1.com' })
                .mockResolvedValueOnce({ hostname: '2.com' })
                .mockRejectedValueOnce(new Error('Duplicate'));

            const data = [
                { hostname: '1.com' },
                { hostname: '2.com' },
                { hostname: '1.com' }
            ];

            const result = await AssetService.bulkCreateAssets(mockOrgId, mockUserId, data);
            
            expect(result.success).toBe(2);
            expect(result.failed).toBe(1);
            expect(result.errors[0].index).toBe(2);
            expect(result.errors[0].error).toBe('Duplicate');

            createSpy.mockRestore();
        });
    });
});
