/**
 * @module IOCRecordDTO
 * @description Immutable Data Transfer Object for IOCRecords.
 */
class IOCRecordDTO {
    constructor(data) {
        this.id = data.id || data._id?.toString();
        this.type = data.type;
        this.value = data.value;
        this.reputation = data.reputation;
        this.confidence = data.confidence;
        this.source = data.source;
        this.sourceType = data.sourceType;
        this.tags = Array.isArray(data.tags) ? [...data.tags] : [];
        this.firstSeen = data.firstSeen;
        this.lastSeen = data.lastSeen;
        this.enrichmentStatus = data.enrichmentStatus;
        this.metadata = data.metadata;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;

        Object.freeze(this);
    }
}

module.exports = IOCRecordDTO;
