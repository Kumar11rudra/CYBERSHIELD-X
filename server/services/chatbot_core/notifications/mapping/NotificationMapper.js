/**
 * @module NotificationMapper
 * @description Translates immutable NotificationDTOs into transport-specific payloads (e.g., Legacy Socket.IO formats).
 */
class NotificationMapper {
    /**
     * Maps a NotificationDTO to a WebSocket payload compatible with existing frontend logic.
     * @param {import('../dto/NotificationDTO')} notification 
     * @returns {{ eventName: string, data: Object }}
     */
    static toWebSocketPayload(notification) {
        const { type, severity, payload, timestamp } = notification;

        // Default event map
        let eventName = 'notification';
        let data = { ...payload, severity, timestamp };

        // Legacy compatibility mappings
        switch (type) {
            case 'JOB_STARTED':
            case 'JOB_PROGRESS':
                eventName = 'tool_log';
                data = {
                    message: payload.message || `Job ${payload.jobId} is now ${type}`,
                    type: severity === 'ERROR' ? 'error' : 'info',
                    toolId: payload.capabilityId || 'system'
                };
                break;
            case 'JOB_COMPLETED':
                eventName = 'tool_complete';
                data = {
                    toolId: payload.capabilityId || 'system',
                    jobId: payload.jobId,
                    target: payload.target || 'unknown',
                    rawOutput: payload.rawOutput || '',
                    result: payload.result || {}
                };
                break;
            case 'JOB_FAILED':
                eventName = 'tool_error';
                data = {
                    toolId: payload.capabilityId || 'system',
                    jobId: payload.jobId,
                    error: payload.error || 'Unknown error'
                };
                break;
            case 'WORKFLOW_STARTED':
            case 'WORKFLOW_PROGRESS':
                eventName = 'workflow_progress';
                data = {
                    executionId: payload.executionId,
                    progress: payload.progress || 0,
                    message: payload.message || 'Workflow progressing'
                };
                break;
            case 'WORKFLOW_COMPLETED':
            case 'WORKFLOW_FAILED':
                eventName = 'workflow_complete';
                data = {
                    executionId: payload.executionId,
                    status: type === 'WORKFLOW_COMPLETED' ? 'COMPLETED' : 'FAILED',
                    error: payload.error || null,
                    result: payload.result || null
                };
                break;
            case 'SECURITY_ALERT':
                eventName = 'security_alert';
                data = {
                    alertType: payload.alertType,
                    message: payload.message,
                    severity: severity
                };
                break;
            case 'INTELLIGENCE_READY':
                eventName = 'intelligence_ready';
                data = {
                    reportId: payload.reportId,
                    target: payload.target,
                    summary: payload.summary
                };
                break;
            case 'SYSTEM_WARNING':
            case 'SYSTEM_ERROR':
                eventName = 'system_alert';
                data = {
                    message: payload.message,
                    severity: severity
                };
                break;
        }

        return { eventName, data };
    }
}

module.exports = NotificationMapper;
