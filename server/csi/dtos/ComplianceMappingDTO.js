'use strict';

const { deepFreeze } = require('./ExecutiveSectionDTO');

class ComplianceMappingDTO {
    /**
     * @param {Object} params
     * @param {string} params.framework (e.g. NIST, CIS, ISO)
     * @param {string} params.controlId
     * @param {Array<string>} params.findingIds
     */
    constructor(params) {
        if (!params || typeof params !== 'object') {
            throw new TypeError('[ComplianceMappingDTO] Invalid constructor parameters');
        }

        if (!params.framework) throw new TypeError('framework is required');
        if (!params.controlId) throw new TypeError('controlId is required');
        if (!Array.isArray(params.findingIds)) throw new TypeError('findingIds must be an array');

        this.framework = params.framework;
        this.controlId = params.controlId;
        this.findingIds = [...params.findingIds];

        deepFreeze(this);
    }
}

module.exports = { ComplianceMappingDTO };
