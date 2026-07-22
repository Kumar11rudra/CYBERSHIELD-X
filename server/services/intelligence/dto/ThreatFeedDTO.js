/**
 * @module ThreatFeedDTO
 * @description Immutable Data Transfer Object for ThreatFeed records.
 */
class ThreatFeedDTO {
    constructor(data) {
        this.id = data.id || data._id?.toString();
        this.source = data.source;
        this.indicator = data.indicator;
        this.indicatorType = data.indicatorType;
        this.confidence = data.confidence;
        this.severity = data.severity;
        this.active = data.active;
        this.rawData = data.rawData;
        this.firstSeen = data.firstSeen;
        this.lastSeen = data.lastSeen;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;

        Object.freeze(this);
    }
}

module.exports = ThreatFeedDTO;
