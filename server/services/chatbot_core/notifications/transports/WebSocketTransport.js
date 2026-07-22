/**
 * @module WebSocketTransport
 * @description Concrete implementation of INotificationTransport wrapping Socket.IO.
 */
const INotificationTransport = require('./INotificationTransport');

class WebSocketTransport extends INotificationTransport {
    /**
     * @param {Object} deps
     * @param {Object} deps.io The Socket.IO server instance
     */
    constructor({ io }) {
        super();
        this.io = io;
    }

    /**
     * Sends the mapped notification payload to all socket connections associated with the ownerId.
     * @param {Object} payload Expects { eventName: string, data: object }
     * @param {string} ownerId 
     * @returns {Promise<void>}
     */
    async send(payload, ownerId) {
        if (!this.io) {
            // For testing/environments without websockets
            return;
        }

        // We assume socket rooms are mapped by ownerId during socket connection.
        // E.g., socket.join(`user_${ownerId}`);
        const room = `user_${ownerId}`;
        const { eventName, data } = payload;
        
        if (!eventName || !data) {
            console.warn('[WebSocketTransport] Payload missing eventName or data. Dropping notification.');
            return;
        }

        this.io.to(room).emit(eventName, data);
    }
}

module.exports = WebSocketTransport;
