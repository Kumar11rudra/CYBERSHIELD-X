'use strict';

const { deepFreeze } = require('./PipelineContext');

class ExecutionResultDTO {
    constructor(params) {
        this.executionId = params.executionId;
        this.pipelineVersion = params.pipelineVersion || '1.0.0';
        this.engineVersions = params.engineVersions || {};
        this.reasoningVersion = params.reasoningVersion || 'unknown';
        this.reportVersion = params.reportVersion || 'unknown';
        this.startedAt = params.startedAt;
        this.finishedAt = params.finishedAt;
        this.durationMs = params.durationMs;
        
        this.target = params.target || null;
        this.evidence = params.evidence || [];
        this.findings = params.findings || [];
        this.risk = params.risk || null;
        this.correlation = params.correlation || null;
        this.reasoning = params.reasoning || null;
        this.report = params.report || null;
        this.exports = params.exports || null;
        this.statistics = params.statistics || {};
        this.health = params.health || null;
        this.validation = params.validation || { valid: true };

        deepFreeze(this);
    }
}

module.exports = { ExecutionResultDTO };
