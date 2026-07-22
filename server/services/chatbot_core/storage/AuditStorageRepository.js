/**
 * @module AuditStorageRepository
 * @description Abstract repository responsible for storing AuditResults.
 */
class AuditStorageRepository {
    /**
     * @param {import('./IStorageProvider')} storageProvider 
     */
    constructor(storageProvider) {
        this.provider = storageProvider;
        this.collection = 'audit_events';
    }

    /**
     * @param {import('../audit/AuditResult')} auditResult 
     * @returns {Promise<Object>}
     */
    async persistAudit(auditResult) {
        if (!auditResult || auditResult.events.length === 0) return { success: true, reason: 'No events' };
        
        const batchId = `audit-batch-${Date.now()}`;
        return await this.provider.save(this.collection, batchId, {
            events: auditResult.events,
            severity: auditResult.severity,
            warnings: auditResult.warnings,
            metadata: auditResult.metadata,
            storedAt: Date.now()
        });
    }
}

module.exports = AuditStorageRepository;
