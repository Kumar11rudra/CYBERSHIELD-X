'use strict';

const { deepFreeze } = require('./ExecutiveSectionDTO');

class ExportBundleDTO {
    /**
     * @param {Object} params
     * @param {string} params.markdown
     * @param {string} params.html
     * @param {string} params.json
     * @param {string} params.sarif
     * @param {string} params.stix
     * @param {string} params.executionId
     */
    constructor(params) {
        if (!params || typeof params !== 'object') {
            throw new TypeError('[ExportBundleDTO] Invalid constructor parameters');
        }

        const required = ['markdown', 'html', 'json', 'sarif', 'stix', 'executionId'];
        for (const req of required) {
            if (typeof params[req] !== 'string') {
                throw new TypeError(`[ExportBundleDTO] Missing or invalid field: ${req}`);
            }
        }

        this.markdown = params.markdown;
        this.html = params.html;
        this.json = params.json;
        this.sarif = params.sarif;
        this.stix = params.stix;
        this.executionId = params.executionId;
        this.timestamp = new Date().toISOString();

        deepFreeze(this);
    }
}

module.exports = { ExportBundleDTO };
