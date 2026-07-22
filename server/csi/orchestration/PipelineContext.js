'use strict';

/**
 * Helper to deeply freeze objects recursively.
 */
function deepFreeze(object) {
    if (object === null || typeof object !== 'object') {
        return object;
    }
    const propNames = Object.keys(object);
    for (const name of propNames) {
        const value = object[name];
        if (value && typeof value === 'object') {
            deepFreeze(value);
        }
    }
    return Object.freeze(object);
}

class PipelineContext {
    constructor(params) {
        if (!params.executionId || !params.target) {
            throw new TypeError('[PipelineContext] executionId and target are required');
        }

        this.executionId = params.executionId;
        this.target = params.target;
        this.configuration = params.configuration || {};
        this.pipelineVersion = params.pipelineVersion || '1.0.0';
        this.startedAt = params.startedAt || new Date().toISOString();
        this.finishedAt = params.finishedAt || null;
        this.executionDeadline = params.executionDeadline || null;
        this.executionEnvironment = params.executionEnvironment || 'production';

        deepFreeze(this);
    }
}

module.exports = { PipelineContext, deepFreeze };
