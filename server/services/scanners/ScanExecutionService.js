/**
 * @module ScanExecutionService
 * @description Orchestrates real security scanner executions. Sits above ExecutionOrchestrator,
 * resolving capability IDs to specific ScannerProviders, managing parameters, and updating Job results.
 */
class ScanExecutionService {
    /**
     * @param {Object} deps 
     * @param {import('../chatbot_core/execution/ExecutionOrchestrator')} deps.executionOrchestrator 
     * @param {import('../jobs/JobRepository')} deps.jobRepository
     * @param {import('../intelligence/CorrelationEngine')} deps.correlationEngine
     */
    constructor({ executionOrchestrator, jobRepository, correlationEngine }) {
        this.executionOrchestrator = executionOrchestrator;
        this.jobRepository = jobRepository;
        this.correlationEngine = correlationEngine;
        this.providers = new Map();
        
        // Initialize providers
        this._registerProvider('nmap.scan', require('../../providers/scanners/NmapProvider'));
        this._registerProvider('whatweb.scan', require('../../providers/scanners/WhatWebProvider'));
        this._registerProvider('nikto.scan', require('../../providers/scanners/NiktoProvider'));
        this._registerProvider('trivy.scan', require('../../providers/scanners/TrivyProvider'));
        this._registerProvider('subfinder.scan', require('../../providers/scanners/SubfinderProvider'));
        this._registerProvider('dnsx.scan', require('../../providers/scanners/DnsxProvider'));
    }

    _registerProvider(capabilityId, ProviderClass) {
        this.providers.set(capabilityId, new ProviderClass());
    }

    /**
     * @param {import('../chatbot_core/execution/ExecutionCapability')} capability 
     * @param {Object} parameters 
     * @param {string} ownerId 
     * @returns {Promise<import('../chatbot_core/execution/ExecutionResponse')>}
     */
    async startScan(capability, parameters, ownerId) {
        const provider = this.providers.get(capability.capabilityId);
        if (!provider) {
            // Fallback for non-scanner capabilities (e.g. mock ones during test)
            // Just pass it directly to orchestrator without parsing
            return await this.executionOrchestrator.execute(capability, parameters, ownerId);
        }

        // 1. Validate Input
        const safeParameters = provider.validateInput(parameters);
        
        // 2. Build Execution Plan
        const scanProfile = provider.buildExecutionPlan(safeParameters);

        // 3. Dispatch to Execution Orchestrator
        // We pass the ScanProfileDTO to the orchestrator as the `plan`.
        // The orchestrator creates the Job, executes via dispatcher, and waits for it.
        const response = await this.executionOrchestrator.execute(capability, scanProfile, ownerId);

        // 4. Normalize Output and Persist it back to the terminal job
        // ExecutionOrchestrator creates a Job. We can extract the executionId from response.
        // Wait, does response contain executionId? Yes, ExecutionResponse metadata contains it.
        const executionId = response.metadata ? response.metadata.executionId : null;
        if (executionId) {
            const normalizedResult = provider.normalizeOutput(response);
            await this._overwriteTerminalJobResult(executionId, response, normalizedResult);
            // Replace response data with normalized
            response.data = normalizedResult;
        }

        return response;
    }

    /**
     * @param {string} executionId 
     * @param {import('../chatbot_core/execution/dto/ExecutionResponseDTO')} rawResult 
     * @param {import('./dto/ScanResultDTO')} normalizedResult 
     */
    async _overwriteTerminalJobResult(executionId, rawResult, normalizedResult) {
        // We need to fetch the job by executionId
        const job = await this.jobRepository.findByExecutionId(executionId);
        if (job) {
            // Feature 009: Correlation Engine
            // Provide single normalized result in an array
            const intelligenceReport = this.correlationEngine.correlate([normalizedResult]);

            const updatedJob = job.withStatus(job.status, job.error, null, {
                rawOutput: rawResult,
                normalizedOutput: normalizedResult,
                intelligenceReport: intelligenceReport
            });
            await this.jobRepository.update(updatedJob);
        }
    }
}

module.exports = ScanExecutionService;
