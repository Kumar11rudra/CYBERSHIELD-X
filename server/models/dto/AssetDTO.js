class AssetDTO {
    constructor(asset) {
        if (!asset) return null;
        
        // Strip out Mongo specific internals and hidden metadata
        this.id = asset._id.toString();
        this.organizationId = asset.organizationId ? asset.organizationId.toString() : null;
        this.teamId = asset.teamId ? asset.teamId.toString() : null;
        this.ownerId = asset.ownerId ? asset.ownerId.toString() : null;
        
        // Legacy support
        if (asset.userId) this.userId = asset.userId.toString();
        
        this.hostname = asset.hostname;
        this.ip = asset.ip;
        this.domain = asset.domain;
        this.url = asset.url;
        this.environment = asset.environment;
        this.assetType = asset.assetType;
        this.criticality = asset.criticality;
        this.status = asset.status;
        
        this.tags = asset.tags || [];
        this.labels = asset.labels || {};
        
        this.lastScanAt = asset.lastScanAt;
        this.lastRiskScore = asset.lastRiskScore;
        
        this.createdAt = asset.createdAt;
        this.updatedAt = asset.updatedAt;
    }

    static fromList(assets) {
        if (!Array.isArray(assets)) return [];
        return assets.map(asset => new AssetDTO(asset));
    }
}

module.exports = AssetDTO;
