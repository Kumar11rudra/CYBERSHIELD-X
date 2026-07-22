const AssetDTO = require('./dto/AssetDTO');

/**
 * @module AssetService
 * @description Domain service for managing assets and risk calculations.
 */
class AssetService {
    constructor(deps) {
        this.assetRepo = deps.assetRepo;
        this.scanRepo = deps.scanRepo;
    }

    async getAssets(query) {
        return await this.assetRepo.findMany(query);
    }

    async createAsset(data) {
        if (!data.hostname || !data.assetType) {
            throw new Error('Hostname and Asset Type are required.');
        }

        const cleanHostname = data.hostname.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];

        const checkQuery = data.organizationId
            ? { organizationId: data.organizationId, hostname: cleanHostname }
            : { userId: data.userId, hostname: cleanHostname, organizationId: { $exists: false } };

        const exists = await this.assetRepo.findOne(checkQuery);
        if (exists) {
            throw new Error('An asset with this hostname already exists.');
        }

        const assetData = {
            ...data,
            hostname: cleanHostname,
            tags: data.tags || [],
            environment: data.environment || 'Production',
            owner: data.owner || 'System',
            criticality: data.criticality || 'Medium',
            status: data.status || 'active'
        };

        const asset = await this.assetRepo.create(assetData);
        
        // Attempt initial risk mapping
        await this.recalculateAssetRisk(data.userId, cleanHostname, data.organizationId);
        
        return await this.assetRepo.findById(asset.id);
    }

    async updateAsset(id, userId, organizationId, updates) {
        const query = organizationId
            ? { _id: id, organizationId }
            : { _id: id, userId, organizationId: { $exists: false } };

        const asset = await this.assetRepo.findOne(query);
        if (!asset) {
            throw new Error('Asset not found or access denied.');
        }

        const updatedData = { ...asset, ...updates, id: asset.id };
        // Clean out read-only fields that shouldn't be overwritten directly via general update
        delete updatedData.lastScanAt;
        delete updatedData.lastRiskScore;

        await this.assetRepo.update(updatedData);
        
        // Recalculate risk on updates
        await this.recalculateAssetRisk(userId, asset.hostname, organizationId);
        
        return await this.assetRepo.findById(id);
    }

    async deleteAsset(id, userId, organizationId) {
        const query = organizationId
            ? { _id: id, organizationId }
            : { _id: id, userId, organizationId: { $exists: false } };

        const asset = await this.assetRepo.findOne(query);
        if (!asset) {
            throw new Error('Asset not found or access denied.');
        }

        await this.assetRepo.delete(asset.id);
        return asset;
    }

    async recalculateAssetRisk(userId, hostname, organizationId) {
        try {
            const regexStr = hostname.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            // Since we can't do direct mongo regex in a generic repository easily, 
            // we will fetch scans matching target string. Wait, if the repo is simple, 
            // we might have to pass raw regex to findMany, assuming MongoStorageProvider handles it.
            const scanQuery = organizationId
                ? { organizationId, target: { $regex: regexStr, $options: 'i' }, status: 'completed' }
                : { userId, organizationId: { $exists: false }, target: { $regex: regexStr, $options: 'i' }, status: 'completed' };

            // In MongoStorageProvider, findMany will just pass this query to Mongoose.
            const scans = await this.scanRepo.findMany(scanQuery);
            if (!scans || scans.length === 0) return;
            
            // Sort to get latest
            scans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const latestScan = scans[0];

            const assetQuery = organizationId
                ? { organizationId, hostname }
                : { userId, hostname, organizationId: { $exists: false } };

            const asset = await this.assetRepo.findOne(assetQuery);
            if (asset) {
                await this.assetRepo.update({
                    id: asset.id,
                    lastRiskScore: latestScan.threatScore,
                    lastScanAt: latestScan.createdAt
                });
            }
        } catch (err) {
            console.error(`[ASSETS] Risk recalculation failed for ${hostname}: ${err.message}`);
        }
    }
}

module.exports = AssetService;
