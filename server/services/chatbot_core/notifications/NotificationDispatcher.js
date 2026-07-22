/**
 * @module NotificationDispatcher
 * @description Iterates through registered transports and dispatches notifications safely.
 */
const NotificationMapper = require('./mapping/NotificationMapper');

class NotificationDispatcher {
    /**
     * @param {Object} deps
     * @param {Array<import('./transports/INotificationTransport')>} deps.transports 
     */
    constructor({ transports = [] }) {
        this.transports = transports;
    }

    /**
     * @param {import('./dto/NotificationDTO')} notification 
     * @returns {Promise<void>}
     */
    async dispatch(notification) {
        if (!this.transports || this.transports.length === 0) {
            return;
        }

        const websocketPayload = NotificationMapper.toWebSocketPayload(notification);

        const dispatchPromises = this.transports.map(async (transport) => {
            try {
                if (transport.name === 'WebSocketTransport') {
                    await transport.send(websocketPayload, notification.ownerId);
                } else {
                    // Default passthrough for non-websocket transports (SSE, Mocks)
                    await transport.send(notification, notification.ownerId);
                }
            } catch (error) {
                console.error(`[NotificationDispatcher] Transport ${transport.name} failed to send:`, error.message);
            }
        });

        await Promise.allSettled(dispatchPromises);
    }
}

module.exports = NotificationDispatcher;
