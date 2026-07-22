/**
 * @module ExecutionMetadata
 * @description Standardized metadata object tracking timestamps, origin, and capability ID for an execution.
 */
class ExecutionMetadata {
    constructor(capabilityId, origin = 'RuntimePipeline', ownerId = null) {
        this.executionId = `exec-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        this.capabilityId = capabilityId;
        this.origin = origin;
        this.ownerId = ownerId;
        this.timestamp = Date.now();
        this.durationMs = 0;
    }

    markComplete() {
        this.durationMs = Date.now() - this.timestamp;
    }
}

module.exports = ExecutionMetadata;
