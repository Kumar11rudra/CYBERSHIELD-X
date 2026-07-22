/**
 * @module NotificationDTO
 * @description Strictly immutable Data Transfer Object for all outbound notifications.
 */
class NotificationDTO {
    /**
     * @param {Object} params
     * @param {string} params.id Unique identifier for the notification.
     * @param {string} params.type E.g., 'JOB_STARTED', 'SECURITY_ALERT'.
     * @param {string} params.severity E.g., 'INFO', 'WARNING', 'CRITICAL'.
     * @param {Object} params.payload The event data.
     * @param {string} params.ownerId The owner of the event (user, tenant, or system).
     * @param {number} [params.timestamp] Auto-assigned if omitted.
     */
    constructor({ id, type, severity, payload, ownerId, timestamp }) {
        if (!id || !type || !severity || !payload || !ownerId) {
            throw new Error('NotificationDTO requires id, type, severity, payload, and ownerId');
        }

        this.id = id;
        this.type = type;
        this.severity = severity;
        // Deep copy payload to ensure immutability
        this.payload = JSON.parse(JSON.stringify(payload));
        this.ownerId = ownerId;
        this.timestamp = timestamp || Date.now();

        Object.freeze(this.payload);
        Object.freeze(this);
    }
}

module.exports = NotificationDTO;
