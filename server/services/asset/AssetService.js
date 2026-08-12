const AssetRepository = require('../../repositories/AssetRepository');
const ActivityLogRepository = require('../../repositories/ActivityLogRepository');
const RBACService = require('../org/RBACService');
const QueryBuilder = require('../../utils/QueryBuilder');
const AssetDTO = require('../../models/dto/AssetDTO');
const Asset = require('../../models/Asset'); // For aggregation

const activityRepo = new ActivityLogRepository();

class AssetService {
    async _logActivity(orgId, userId, action, assetId, oldValues, newValues) {
        try {
            await activityRepo.create({
                userId,
                action,
                metadata: {
                    organizationId: orgId,
                    assetId,
                    oldValues,
                    newValues
                }
            });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }

    async createAsset(orgId, userId, data) {
        await RBACService.requirePermission(orgId, userId, 'canEdit');
        
        const exists = await AssetRepository.checkDuplicate(orgId, data.hostname);
        if (exists) throw new Error('Asset with this hostname already exists in the organization.');

        const assetData = {
            ...data,
            organizationId: orgId,
            createdBy: userId,
            status: 'active'
        };

        const asset = await AssetRepository.create(assetData);
        await this._logActivity(orgId, userId, 'ASSET_CREATED', asset._id, null, asset);

        return new AssetDTO(asset);
    }

    async getAssetById(orgId, userId, assetId) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        const asset = await AssetRepository.findByIdAndOrg(assetId, orgId);
        if (!asset) throw new Error('Asset not found');
        return new AssetDTO(asset);
    }

    async getAssets(orgId, userId, query) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        
        const qb = new QueryBuilder(Asset, query);
        if (orgId) {
            qb.tenant(orgId);
        } else {
            qb.mongoQuery.$or = [{ userId }, { createdBy: userId }];
        }
        qb.search()
            .filter(['status', 'assetType', 'criticality', 'ownerId', 'teamId'])
            .paginate()
            .sortBy(['createdAt', 'updatedAt', 'hostname', 'lastRiskScore']);

        const result = await qb.execute();
        return {
            data: AssetDTO.fromList(result.data),
            pagination: result.pagination
        };
    }

    async searchAssets(orgId, userId, query) {
        // Alias for getAssets
        return await this.getAssets(orgId, userId, query);
    }

    async filterAssets(orgId, userId, query) {
        return await this.getAssets(orgId, userId, query);
    }

    async updateAsset(orgId, userId, assetId, data) {
        await RBACService.requirePermission(orgId, userId, 'canEdit');
        
        const oldAsset = await AssetRepository.findByIdAndOrg(assetId, orgId);
        if (!oldAsset) throw new Error('Asset not found');

        // Prevent moving across tenants
        delete data.organizationId;
        data.updatedBy = userId;

        const updated = await AssetRepository.update(assetId, orgId, data);
        await this._logActivity(orgId, userId, 'ASSET_UPDATED', assetId, oldAsset, updated);
        
        return new AssetDTO(updated);
    }

    async deleteAsset(orgId, userId, assetId) {
        await RBACService.requirePermission(orgId, userId, 'canEdit');
        
        const oldAsset = await AssetRepository.findByIdAndOrg(assetId, orgId);
        if (!oldAsset) throw new Error('Asset not found');

        const updated = await AssetRepository.update(assetId, orgId, { status: 'deleted', updatedBy: userId });
        await this._logActivity(orgId, userId, 'ASSET_DELETED', assetId, { status: oldAsset.status }, { status: 'deleted' });

        return new AssetDTO(updated);
    }

    async archiveAsset(orgId, userId, assetId) {
        await RBACService.requirePermission(orgId, userId, 'canEdit');
        
        const oldAsset = await AssetRepository.findByIdAndOrg(assetId, orgId);
        if (!oldAsset) throw new Error('Asset not found');

        const updated = await AssetRepository.update(assetId, orgId, { status: 'archived', updatedBy: userId });
        await this._logActivity(orgId, userId, 'ASSET_ARCHIVED', assetId, { status: oldAsset.status }, { status: 'archived' });

        return new AssetDTO(updated);
    }

    async restoreAsset(orgId, userId, assetId) {
        await RBACService.requirePermission(orgId, userId, 'canManageTeams'); // Assume admin level required for restore
        
        const oldAsset = await AssetRepository.findByIdAndOrg(assetId, orgId);
        if (!oldAsset) throw new Error('Asset not found');

        const updated = await AssetRepository.update(assetId, orgId, { status: 'active', updatedBy: userId });
        await this._logActivity(orgId, userId, 'ASSET_RESTORED', assetId, { status: oldAsset.status }, { status: 'active' });

        return new AssetDTO(updated);
    }

    async assignOwner(orgId, userId, assetId, ownerId) {
        return await this.updateAsset(orgId, userId, assetId, { ownerId });
    }

    async removeOwner(orgId, userId, assetId) {
        return await this.updateAsset(orgId, userId, assetId, { ownerId: null });
    }

    async assignTeam(orgId, userId, assetId, teamId) {
        return await this.updateAsset(orgId, userId, assetId, { teamId });
    }

    async removeTeam(orgId, userId, assetId) {
        return await this.updateAsset(orgId, userId, assetId, { teamId: null });
    }

    async getAssetHistory(orgId, userId, assetId) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        // Fetch activity logs where metadata.assetId == assetId
        const ActivityLog = require('../../models/ActivityLog');
        const logs = await ActivityLog.find({ 'metadata.assetId': assetId }).sort({ timestamp: -1 });
        return logs;
    }

    async getAssetStatistics(orgId, userId) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        const stats = await Asset.aggregate([
            { $match: { organizationId: orgId, status: { $ne: 'deleted' } } },
            { $group: {
                _id: null,
                total: { $sum: 1 },
                active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
                archived: { $sum: { $cond: [{ $eq: ['$status', 'archived'] }, 1, 0] } },
                critical: { $sum: { $cond: [{ $eq: ['$criticality', 'Critical'] }, 1, 0] } },
                high: { $sum: { $cond: [{ $eq: ['$criticality', 'High'] }, 1, 0] } }
            }}
        ]);
        return stats[0] || { total: 0, active: 0, archived: 0, critical: 0, high: 0 };
    }

    async bulkCreateAssets(orgId, userId, dataArray) {
        await RBACService.requirePermission(orgId, userId, 'canEdit');
        const results = await Promise.allSettled(
            dataArray.map(data => this.createAsset(orgId, userId, data))
        );
        return this._summarizeBulk(results);
    }

    async bulkDeleteAssets(orgId, userId, assetIds) {
        await RBACService.requirePermission(orgId, userId, 'canEdit');
        const results = await Promise.allSettled(
            assetIds.map(id => this.deleteAsset(orgId, userId, id))
        );
        return this._summarizeBulk(results);
    }

    async bulkArchiveAssets(orgId, userId, assetIds) {
        await RBACService.requirePermission(orgId, userId, 'canEdit');
        const results = await Promise.allSettled(
            assetIds.map(id => this.archiveAsset(orgId, userId, id))
        );
        return this._summarizeBulk(results);
    }

    _summarizeBulk(results) {
        const summary = { success: 0, failed: 0, errors: [], items: [] };
        results.forEach((res, index) => {
            if (res.status === 'fulfilled') {
                summary.success++;
                summary.items.push(res.value);
            } else {
                summary.failed++;
                summary.errors.push({ index, error: res.reason.message });
            }
        });
        return summary;
    }
}

module.exports = new AssetService();
