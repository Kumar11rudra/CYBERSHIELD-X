'use strict';

const { deepFreeze } = require('./RiskFactorDTO'); // Using existing deeply freeze utility
const { CorrelationNodeDTO } = require('./CorrelationNodeDTO');
const { CorrelationEdgeDTO } = require('./CorrelationEdgeDTO');

class CorrelationResultDTO {
    /**
     * @param {object} params
     * @param {number} params.overallCorrelationScore
     * @param {object[]} params.chains - Array of matched chain objects (e.g. { ruleId: 'R1', score: 20 })
     * @param {object} params.categories - Record of category scores (e.g. { TLS_CHAIN: 20 })
     * @param {CorrelationNodeDTO[]} params.nodes
     * @param {CorrelationEdgeDTO[]} params.edges
     * @param {object[]} params.trace - Array of machine-readable trace steps
     * @param {string} params.executionId - UUID
     * @param {string} params.version - engine version e.g. '1.0.0'
     * @param {string} params.timestamp - ISO timestamp
     */
    constructor({ overallCorrelationScore, chains, categories, nodes, edges, trace, executionId, version, timestamp }) {
        if (typeof overallCorrelationScore !== 'number') {
            throw new TypeError('[CorrelationResultDTO] overallCorrelationScore must be a number');
        }
        if (!Array.isArray(chains)) {
            throw new TypeError('[CorrelationResultDTO] chains must be an array');
        }
        if (!categories || typeof categories !== 'object') {
            throw new TypeError('[CorrelationResultDTO] categories must be an object');
        }
        if (!Array.isArray(nodes)) {
            throw new TypeError('[CorrelationResultDTO] nodes must be an array');
        }
        if (!Array.isArray(edges)) {
            throw new TypeError('[CorrelationResultDTO] edges must be an array');
        }
        if (!Array.isArray(trace)) {
            throw new TypeError('[CorrelationResultDTO] trace must be an array');
        }
        if (!executionId || typeof executionId !== 'string') {
            throw new TypeError('[CorrelationResultDTO] executionId is required');
        }
        if (!version || typeof version !== 'string') {
            throw new TypeError('[CorrelationResultDTO] version is required');
        }
        if (!timestamp || typeof timestamp !== 'string') {
            throw new TypeError('[CorrelationResultDTO] timestamp is required');
        }

        this.overallCorrelationScore = overallCorrelationScore;
        this.chains = [...chains];
        this.categories = { ...categories };
        this.nodes = [...nodes];
        this.edges = [...edges];
        this.trace = [...trace];
        this.executionId = executionId;
        this.version = version;
        this.timestamp = timestamp;

        deepFreeze(this);
    }
}

module.exports = { CorrelationResultDTO };
