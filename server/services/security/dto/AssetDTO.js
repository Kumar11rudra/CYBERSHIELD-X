/**
 * @module AssetDTO
 * @description Immutable Data Transfer Object for Asset Entity
 */
class AssetDTO {
    constructor(data = {}) {
        this.id = data._id ? data._id.toString() : data.id;
        this.userId = data.userId ? data.userId.toString() : null;
        this.organizationId = data.organizationId ? data.organizationId.toString() : null;
        this.teamId = data.teamId ? data.teamId.toString() : null;
        this.hostname = data.hostname;
        this.ip = data.ip;
        this.tags = data.tags || [];
        this.environment = data.environment || 'Production';
        this.owner = data.owner || 'System';
        this.assetType = data.assetType;
        this.criticality = data.criticality || 'Medium';
        this.lastScanAt = data.lastScanAt;
        this.lastRiskScore = data.lastRiskScore || 0;
        this.status = data.status || 'active';
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;

        Object.freeze(this);
        if (this.tags) Object.freeze(this.tags);
    }
}

module.exports = AssetDTO;
