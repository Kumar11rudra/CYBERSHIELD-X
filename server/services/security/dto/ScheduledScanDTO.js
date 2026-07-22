/**
 * @module ScheduledScanDTO
 * @description Immutable Data Transfer Object for ScheduledScan Entity
 */
class ScheduledScanDTO {
    constructor(data = {}) {
        this.id = data._id ? data._id.toString() : data.id;
        this.userId = data.userId ? data.userId.toString() : null;
        this.organizationId = data.organizationId ? data.organizationId.toString() : null;
        this.teamId = data.teamId ? data.teamId.toString() : null;
        this.target = data.target;
        this.targetType = data.targetType;
        this.frequency = data.frequency;
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.lastRun = data.lastRun;
        this.nextRun = data.nextRun;
        this.tools = data.tools || ['nmap', 'ssl'];
        this.scanMode = data.scanMode || 'quick';
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;

        Object.freeze(this);
        if (this.tools) Object.freeze(this.tools);
    }
}

module.exports = ScheduledScanDTO;
