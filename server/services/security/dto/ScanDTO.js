/**
 * @module ScanDTO
 * @description Immutable Data Transfer Object for Scan Entity
 */
class ScanDTO {
    constructor(data = {}) {
        this.id = data._id ? data._id.toString() : data.id;
        this.userId = data.userId ? data.userId.toString() : null;
        this.organizationId = data.organizationId ? data.organizationId.toString() : null;
        this.teamId = data.teamId ? data.teamId.toString() : null;
        this.target = data.target;
        this.targetType = data.targetType;
        this.threatScore = data.threatScore || 0;
        this.riskLevel = data.riskLevel || 'safe';
        this.status = data.status || 'completed';
        this.scanType = data.scanType || 'general';
        this.options = data.options;
        this.incidentTier = data.incidentTier;
        this.sourceScores = data.sourceScores || {};
        this.breakdown = data.breakdown || {};
        this.alertSent = !!data.alertSent;
        this.isPublic = !!data.isPublic;
        this.location = data.location || {};
        this.tags = data.tags || [];
        this.notes = data.notes;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;

        Object.freeze(this);
        if (this.tags) Object.freeze(this.tags);
        if (this.sourceScores) Object.freeze(this.sourceScores);
        if (this.breakdown) Object.freeze(this.breakdown);
        if (this.location) Object.freeze(this.location);
    }
}

module.exports = ScanDTO;
