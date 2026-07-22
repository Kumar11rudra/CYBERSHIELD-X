/**
 * @module INotificationTransport
 * @description Abstract interface for all notification transports (WebSocket, SSE, Email, etc.).
 */
class INotificationTransport {
    /**
     * @returns {string} The transport name (e.g. 'WebSocketTransport').
     */
    get name() {
        return this.constructor.name;
    }

    /**
     * Delivers the given normalized notification payload to clients.
     * @param {Object} payload The formatted payload mapped for this specific transport.
     * @param {string} ownerId The recipient owner ID.
     * @returns {Promise<void>}
     */
    async send(payload, ownerId) {
        throw new Error('INotificationTransport must implement send()');
    }
}

module.exports = INotificationTransport;
