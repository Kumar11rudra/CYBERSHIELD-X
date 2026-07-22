'use strict';

const { randomUUID } = require('crypto');
const { NetworkExecutionContext } = require('../network/NetworkExecutionContext');
const { engineMetrics } = require('../metrics/EngineMetrics');

/**
 * EngineRunner
 *
 * The ONLY execution gateway for engines.
 * Orchestrates collecting raw evidence and parsing it into findings.
 * Enforces timeout, retries, metrics recording, and panic recovery.
 */
class EngineRunner {
    /**
     * @param {import('../interfaces/IIntelligenceEngine')} engine 
     * @param {import('../interfaces/IEvidenceStorage')} evidenceStorage 
     * @param {object} [hooks]
     */
    constructor(engine, evidenceStorage, hooks = {}) {
        this.engine = engine;
        this.evidenceStorage = evidenceStorage;
        this.hooks = {
            beforeCollect: hooks.beforeCollect || (async () => {}),
            afterCollect: hooks.afterCollect || (async () => {}),
            beforeParse: hooks.beforeParse || (async () => {}),
            afterParse: hooks.afterParse || (async () => {}),
            onFailure: hooks.onFailure || (async () => {})
        };
    }

    /**
     * Execute the engine against the target.
     * @param {import('../dtos/TargetDTO')} targetDTO 
     * @returns {Promise<import('../dtos/FindingDTO')[]>}
     */
    async execute(targetDTO) {
        const metadata = this.engine.metadata();
        const engineId = metadata.id;
        
        const executionId = randomUUID();
        const ctx = new NetworkExecutionContext({
            executionId,
            targetId: targetDTO.value,
            timeout: metadata.defaultTimeout || 5000,
            retryPolicy: metadata.retryPolicy || { maxRetries: 0, backoffMs: 0 },
            telemetry: { engineId, version: metadata.version }
        });

        const startTime = Date.now();
        let bytesCollected = 0;
        let findings = [];

        try {
            // Phase 1: Collect (with retries and timeout)
            await this.hooks.beforeCollect(ctx, targetDTO);
            const rawEvidenceDataList = await this._executeWithRetryAndTimeout(
                () => this.engine.collect(targetDTO, ctx),
                ctx.timeout,
                ctx.retryPolicy
            );
            await this.hooks.afterCollect(ctx, targetDTO, rawEvidenceDataList);

            // Phase 2: Store Evidence
            const evidenceDTOs = [];
            for (const item of rawEvidenceDataList) {
                if (item.data && Buffer.isBuffer(item.data)) {
                    const dto = await this.evidenceStorage.store(item.data, {
                        contentType: item.contentType || 'text',
                        engineSource: engineId,
                        engineVersion: metadata.version,
                        executionId: executionId
                    });
                    evidenceDTOs.push(dto);
                    bytesCollected += item.data.length;
                }
            }

            // Phase 3: Parse
            if (evidenceDTOs.length > 0) {
                await this.hooks.beforeParse(ctx, evidenceDTOs);
                // We wrap parse in a timeout as well, just to be safe, though it's CPU-bound
                findings = await this._executeWithTimeout(
                    () => this.engine.parse(evidenceDTOs, ctx),
                    ctx.timeout // Parsing shouldn't take longer than network
                );
                await this.hooks.afterParse(ctx, findings);
            }

            // Phase 4: Validate
            await this.engine.validate(findings);

            const latency = Date.now() - startTime;
            engineMetrics.recordExecution(engineId, latency);
            engineMetrics.recordBytes(engineId, bytesCollected);
            return findings;

        } catch (error) {
            const latency = Date.now() - startTime;
            engineMetrics.recordFailure(engineId, latency);
            
            await this.hooks.onFailure(ctx, error);
            
            // Panic recovery: Log and return empty findings array
            // Engine runner safely handles errors internally
            return [];
        }
    }

    async _executeWithRetryAndTimeout(fn, timeoutMs, retryPolicy) {
        let attempts = 0;
        const maxAttempts = (retryPolicy.maxRetries || 0) + 1;
        const backoffMs = retryPolicy.backoffMs || 0;

        while (attempts < maxAttempts) {
            try {
                return await this._executeWithTimeout(fn, timeoutMs);
            } catch (err) {
                attempts++;
                if (attempts >= maxAttempts) throw err;
                await new Promise(resolve => setTimeout(resolve, backoffMs));
            }
        }
    }

    async _executeWithTimeout(fn, timeoutMs) {
        let timer;
        const timeoutPromise = new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error('Execution Timeout')), timeoutMs);
        });

        try {
            return await Promise.race([fn(), timeoutPromise]);
        } finally {
            clearTimeout(timer);
        }
    }
}

module.exports = { EngineRunner };
