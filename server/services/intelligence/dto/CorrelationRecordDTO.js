/**
 * @module CorrelationRecordDTO
 * @description Immutable Data Transfer Object for Correlation records.
 */
class CorrelationRecordDTO {
    constructor(data) {
        this.id = data.id || data._id?.toString();
        this.userId = data.userId?.toString();
        this.target = data.target;
        this.riskScore = data.riskScore;
        this.riskLevel = data.riskLevel;
        this.findings = Array.isArray(data.findings) ? [...data.findings] : [];
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;

        Object.freeze(this);
    }
}

module.exports = CorrelationRecordDTO;
