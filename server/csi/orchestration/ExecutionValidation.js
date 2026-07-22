'use strict';

const { ExecutionValidationError } = require('../errors/CsiErrors');

class ExecutionValidation {
    /**
     * @param {import('./ExecutionResultDTO').ExecutionResultDTO} resultDTO 
     */
    static validate(resultDTO) {
        if (!resultDTO.executionId) {
            throw new ExecutionValidationError('Execution ID is required');
        }
        if (!resultDTO.startedAt || !resultDTO.finishedAt || typeof resultDTO.durationMs !== 'number') {
            throw new ExecutionValidationError('Execution timing is invalid');
        }

        // Validate findings immutability & duplicates
        if (!Object.isFrozen(resultDTO.findings)) {
            throw new ExecutionValidationError('Findings array must be frozen');
        }
        const findingIds = new Set();
        for (const finding of resultDTO.findings) {
            if (!Object.isFrozen(finding)) {
                throw new ExecutionValidationError('Individual findings must be frozen');
            }
            if (findingIds.has(finding.findingId)) {
                throw new ExecutionValidationError(`Duplicate finding ID detected: ${finding.findingId}`);
            }
            findingIds.add(finding.findingId);
        }

        // Validate evidence immutability & duplicates
        if (!Object.isFrozen(resultDTO.evidence)) {
            throw new ExecutionValidationError('Evidence array must be frozen');
        }
        const evidenceIds = new Set();
        for (const ev of resultDTO.evidence) {
            if (!Object.isFrozen(ev)) {
                throw new ExecutionValidationError('Individual evidence objects must be frozen');
            }
            if (evidenceIds.has(ev.evidenceId)) {
                throw new ExecutionValidationError(`Duplicate evidence ID detected: ${ev.evidenceId}`);
            }
            evidenceIds.add(ev.evidenceId);
        }

        // Check required fields exist and are frozen
        if (!resultDTO.report) throw new ExecutionValidationError('Missing report in execution result');
        if (!resultDTO.exports) throw new ExecutionValidationError('Missing exports in execution result');
        if (!resultDTO.risk) throw new ExecutionValidationError('Missing risk result');
        if (!resultDTO.correlation) throw new ExecutionValidationError('Missing correlation result');
        if (!resultDTO.reasoning) throw new ExecutionValidationError('Missing reasoning result');

        if (!Object.isFrozen(resultDTO.risk)) throw new ExecutionValidationError('Risk result must be frozen');
        if (!Object.isFrozen(resultDTO.correlation)) throw new ExecutionValidationError('Correlation result must be frozen');
        if (!Object.isFrozen(resultDTO.reasoning)) throw new ExecutionValidationError('Reasoning result must be frozen');
        if (!Object.isFrozen(resultDTO.report)) throw new ExecutionValidationError('Report must be frozen');
        if (!Object.isFrozen(resultDTO.exports)) throw new ExecutionValidationError('Exports must be frozen');

        if (!Object.isFrozen(resultDTO)) {
            throw new ExecutionValidationError('ExecutionResultDTO must be deeply frozen');
        }

        return true;
    }
}

module.exports = { ExecutionValidation };
