'use strict';

const { randomUUID } = require('crypto');
const { PipelineContext } = require('./PipelineContext');
const { PipelineEvents } = require('./PipelineEvents');
const { ExecutionResultDTO } = require('./ExecutionResultDTO');
const { PipelineExecutionError, PipelineInitializationError, PipelineDependencyError } = require('../errors/CsiErrors');
const { deepFreeze } = require('./PipelineContext');

class CsiExecutionPipeline {
    constructor(deps) {
        if (!deps) throw new PipelineInitializationError('Dependencies required for CsiExecutionPipeline');
        
        this.engineRunner = deps.engineRunner;
        this.engineRegistry = deps.engineRegistry;
        this.riskEngine = deps.riskEngine;
        this.correlationEngine = deps.correlationEngine;
        this.reasoningEngine = deps.reasoningEngine;
        this.executiveReportEngine = deps.executiveReportEngine;
        this.workerPool = deps.workerPool;
        this.executionValidator = deps.executionValidator;
        this.pipelineHealth = deps.pipelineHealth;
        this.evidenceStorage = deps.evidenceStorage;
        this.targetNormalizer = deps.targetNormalizer;
        this.targetClassifier = deps.targetClassifier;

        this._validateDependencies();
    }

    _validateDependencies() {
        const required = [
            'engineRunner', 'engineRegistry', 'riskEngine', 'correlationEngine',
            'reasoningEngine', 'executiveReportEngine', 'workerPool',
            'executionValidator', 'pipelineHealth', 'evidenceStorage',
            'targetNormalizer', 'targetClassifier'
        ];
        for (const dep of required) {
            if (!this[dep]) throw new PipelineDependencyError(`Missing required dependency: ${dep}`);
        }

        const health = this.pipelineHealth.check(this);
        if (health.status !== 'healthy') {
            throw new PipelineDependencyError(`Pipeline health check failed: ${JSON.stringify(health.checks)}`);
        }
    }

    async execute(rawTarget) {
        const executionId = randomUUID();
        const startedAt = new Date().toISOString();

        // Target Normalization & Classification
        const targetDTO = this.targetClassifier.classify(
            this.targetNormalizer.normalize(rawTarget)
        );

        const ctx = new PipelineContext({
            executionId,
            target: targetDTO,
            startedAt
        });

        // PipelineValidation requires PipelineContext to be frozen
        if (!Object.isFrozen(ctx)) {
            throw new PipelineExecutionError('PipelineContext must be frozen');
        }

        try {
            // Resolve Engines
            const engines = this.engineRegistry.resolve(targetDTO);
            
            const engineVersions = {};
            const tasks = engines.map(engine => {
                const metadata = engine.metadata();
                engineVersions[metadata.id] = metadata.version;
                
                // Pipeline does not run engines directly, it creates a runner for each
                const runner = new this.engineRunner(engine, this.evidenceStorage);
                return () => runner.execute(targetDTO);
            });

            // Execute Engines via WorkerPool (deterministic policy)
            const results = await this.workerPool.executeAll(tasks);

            // Collect Findings (evidence is stored inside EngineRunner)
            const allFindings = [];
            for (const result of results) {
                if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                    allFindings.push(...result.value);
                }
            }

            // EngineRunner ensures Findings are returned. Evidence needs to be aggregated.
            // Since LocalEvidenceStorage doesn't have a getAll() method filtering by executionId,
            // we have to rely on a workaround or just pass what we can. 
            // Wait, the prompt says "Evidence". EvidenceDTOs were returned by evidenceStorage.store?
            // Actually, in EngineRunner:
            // "const evidenceDTOs = []; ... return findings;"
            // EngineRunner returns only findings. Wait, how do we get evidence for the report?
            // "evidence is stored inside EngineRunner". But ThreatCorrelationEngine needs evidence!
            // Let's check ThreatCorrelationEngine.execute(findings, riskResult, evidences, executionId).
            // It expects an array of evidences. How does the pipeline get evidences?
            // The instructions say: "Execute Engines -> Store Evidence -> Generate Findings". 
            // If EngineRunner doesn't return evidence, we must retrieve it.
            // But LocalEvidenceStorage._index is internal. Does it have an API? No.
            // Wait, I can inject a hook into EngineRunner!
            // const runner = new this.engineRunner(engine, this.evidenceStorage, { afterCollect... })
            // Yes! `EngineRunner` constructor takes `hooks`.

            let collectedEvidence = [];
            
            const runnerTasks = engines.map(engine => {
                const runner = new this.engineRunner(engine, this.evidenceStorage, {
                    afterParse: async (networkCtx, findings) => {
                        // After parse, nothing for evidence. 
                        // Wait, beforeParse is given evidenceDTOs.
                    },
                    beforeParse: async (networkCtx, evidenceDTOs) => {
                        collectedEvidence.push(...evidenceDTOs);
                    }
                });
                return () => runner.execute(targetDTO);
            });

            // Run with hook-injected runners
            const execResults = await this.workerPool.executeAll(runnerTasks);
            const finalFindings = [];
            for (const result of execResults) {
                if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                    finalFindings.push(...result.value);
                } else if (result.status === 'rejected') {
                    // Failures are isolated per engine
                }
            }
            
            // Deterministic sort Findings and Evidence
            finalFindings.sort((a, b) => a.deterministicSortKey.localeCompare(b.deterministicSortKey));
            collectedEvidence.sort((a, b) => a.deterministicSortKey.localeCompare(b.deterministicSortKey));

            // Risk Engine
            const riskResult = this.riskEngine.execute(finalFindings, executionId);

            // Threat Correlation Engine
            const correlationResult = this.correlationEngine.execute(finalFindings, riskResult, collectedEvidence, executionId);

            // Reasoning Engine
            const reasoningResult = await this.reasoningEngine.execute(finalFindings, riskResult, correlationResult, executionId);

            // Executive Report Engine
            const reportBundle = this.executiveReportEngine.execute(finalFindings, riskResult, correlationResult, reasoningResult, executionId);

            // Assemble DTO
            const finishedAt = new Date().toISOString();
            const durationMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime();

            const executionResult = new ExecutionResultDTO({
                executionId,
                startedAt,
                finishedAt,
                durationMs,
                target: targetDTO,
                evidence: collectedEvidence,
                findings: finalFindings,
                risk: riskResult,
                correlation: correlationResult,
                reasoning: reasoningResult,
                report: JSON.parse(reportBundle.json), 
                exports: reportBundle,
                engineVersions,
                reasoningVersion: reasoningResult.reasoningVersion,
                reportVersion: '1.0.0', // Standard for V1
                health: this.pipelineHealth.check(this)
            });

            this.executionValidator.validate(executionResult);

            return executionResult;

        } catch (error) {
            throw new PipelineExecutionError(`Pipeline execution failed: ${error.message}`, { cause: error });
        }
    }
}

module.exports = { CsiExecutionPipeline };
