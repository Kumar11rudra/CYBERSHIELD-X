const AuditEvent = require('./AuditEvent');
const AuditContext = require('./AuditContext');
const AuditMetadata = require('./AuditMetadata');
const AuditSeverity = require('./AuditSeverity');

/**
 * @module AuditCollector
 * @description Pure reader. Never modifies RuntimeContext. Creates immutable provider-independent AuditEvents.
 */
class AuditCollector {
    /**
     * @param {Object} runtimeContext - The immutable RuntimeContext
     * @returns {Array<AuditEvent>}
     */
    collect(runtimeContext) {
        const events = [];
        
        // 1. Snapshot the context
        const auditContext = new AuditContext({
            userId: runtimeContext.intent?.metadata?.userId,
            sessionId: runtimeContext.intent?.metadata?.sessionId,
            metrics: runtimeContext.runtimeMetrics,
            trace: runtimeContext.runtimeTrace
        });
        
        const capabilityId = runtimeContext.capability?.capabilityId || 'unknown';
        
        // 2. Generate the execution event
        const executionMetadata = new AuditMetadata({
            capabilityId,
            timestamp: Date.now()
        });
        
        // Check if execution was cancelled (denied, errored, etc)
        if (runtimeContext.isCancelled) {
            events.push(new AuditEvent({
                eventType: 'EXECUTION_CANCELLED',
                severity: AuditSeverity.WARNING,
                details: {
                    reason: runtimeContext.cancellationReason,
                    intent: runtimeContext.intent?.action
                },
                metadata: executionMetadata,
                context: auditContext
            }));
        } else if (runtimeContext.executionContract) {
            events.push(new AuditEvent({
                eventType: 'EXECUTION_COMPLETED',
                severity: AuditSeverity.INFO,
                details: {
                    status: runtimeContext.executionResponse?.status || 'COMPLETED'
                },
                metadata: executionMetadata,
                context: auditContext
            }));
        } else {
            // General conversation/audit event (e.g., capability disabled or not resolved yet)
            events.push(new AuditEvent({
                eventType: 'PIPELINE_EVALUATION',
                severity: AuditSeverity.DEBUG,
                details: { state: 'evaluated' },
                metadata: executionMetadata,
                context: auditContext
            }));
        }
        
        return events;
    }
}

module.exports = AuditCollector;
