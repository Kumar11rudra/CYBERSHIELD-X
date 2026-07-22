const StorageResult = require('./StorageResult');

/**
 * @module StorageManager
 * @description Orchestrates abstract storage operations post-pipeline execution.
 * Completely isolates the caller (AIOrchestrator) from any persistence exceptions.
 */
class StorageManager {
    /**
     * @param {Object} deps 
     * @param {import('./AuditStorageRepository')} deps.auditRepo
     * @param {import('./SessionStorageRepository')} deps.sessionRepo
     */
    constructor(deps) {
        this.auditRepo = deps.auditRepo;
        this.sessionRepo = deps.sessionRepo;
    }

    /**
     * @param {import('../RuntimeContext')} runtimeContext 
     * @returns {Promise<StorageResult>}
     */
    async persist(runtimeContext) {
        const startTime = Date.now();
        const warnings = [];

        try {
            // Persist Audit logs if present
            if (runtimeContext.auditResult) {
                try {
                    await this.auditRepo.persistAudit(runtimeContext.auditResult);
                } catch (auditError) {
                    warnings.push(`Audit storage failed: ${auditError.message}`);
                }
            }

            // Persist Session Snapshot if applicable
            // (e.g., extracting trace, metrics, and intent from the immutable context)
            const sessionId = runtimeContext.intent?.metadata?.sessionId || 'anonymous-session';
            try {
                const snapshot = {
                    intent: runtimeContext.intent?.action,
                    traceCount: runtimeContext.runtimeTrace?.length || 0,
                    cancelled: runtimeContext.isCancelled,
                    timestamp: Date.now()
                };
                await this.sessionRepo.updateSession(sessionId, snapshot);
            } catch (sessionError) {
                warnings.push(`Session storage failed: ${sessionError.message}`);
            }

            return new StorageResult({
                success: warnings.length === 0,
                status: warnings.length === 0 ? 'PERSISTED' : 'PARTIAL_PERSISTENCE',
                warnings,
                durationMs: Date.now() - startTime
            });
        } catch (fatalError) {
            // Guard: StorageManager failures must NEVER affect chat execution.
            return new StorageResult({
                success: false,
                status: 'STORAGE_FAILURE',
                warnings: [...warnings, `Fatal storage error: ${fatalError.message}`],
                durationMs: Date.now() - startTime
            });
        }
    }
}

module.exports = StorageManager;
