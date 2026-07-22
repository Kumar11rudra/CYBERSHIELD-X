'use strict';

const { deepFreeze } = require('./ExecutiveSectionDTO');

class ExecutiveReportDTO {
    /**
     * @param {Object} params
     * @param {Array<import('./ExecutiveSectionDTO').ExecutiveSectionDTO>} params.sections
     * @param {string} params.executionId
     */
    constructor(params) {
        if (!params || typeof params !== 'object') {
            throw new TypeError('[ExecutiveReportDTO] Invalid constructor parameters');
        }

        if (!Array.isArray(params.sections)) {
            throw new TypeError('sections must be an array');
        }

        if (!params.executionId) {
            throw new TypeError('executionId is required');
        }

        this.sections = [...params.sections];
        this.executionId = params.executionId;
        this.timestamp = new Date().toISOString();
        this.version = '1.0.0';

        deepFreeze(this);
    }
}

module.exports = { ExecutiveReportDTO };
