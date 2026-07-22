/**
 * @module NotificationSubscriptionService
 * @description Listens to the EventRegistry and forwards DomainEvents to the NotificationDispatcher.
 */
const EventSubscriber = require('../events/EventSubscriber');
const crypto = require('crypto');
const NotificationDTO = require('./dto/NotificationDTO');

class NotificationSubscriptionService extends EventSubscriber {
    /**
     * @param {Object} deps 
     * @param {import('../events/EventRegistry')} deps.eventRegistry 
     * @param {import('./NotificationDispatcher')} deps.notificationDispatcher 
     */
    constructor({ eventRegistry, notificationDispatcher }) {
        super();
        this.eventRegistry = eventRegistry;
        this.notificationDispatcher = notificationDispatcher;

        this._registerTopics();
    }

    _registerTopics() {
        const topics = [
            'JOB_STARTED',
            'JOB_PROGRESS',
            'JOB_COMPLETED',
            'JOB_FAILED',
            'WORKFLOW_STARTED',
            'WORKFLOW_PROGRESS',
            'WORKFLOW_COMPLETED',
            'WORKFLOW_FAILED',
            'SECURITY_ALERT',
            'INTELLIGENCE_READY',
            'SYSTEM_WARNING',
            'SYSTEM_ERROR'
        ];

        topics.forEach(topic => {
            this.eventRegistry.register(topic, this);
        });
    }

    /**
     * Core handler logic receiving EventEnvelope.
     * @param {import('../events/EventEnvelope')} envelope 
     * @returns {Promise<void>}
     */
    async handle(envelope) {
        try {
            const { event } = envelope;

            // Normalize DomainEvent -> NotificationDTO
            const notification = new NotificationDTO({
                id: crypto.randomUUID(),
                type: event.eventType,
                severity: this._mapSeverity(event.eventType),
                payload: event.payload,
                ownerId: event.payload.ownerId || 'system', // Default to system if ownerId is missing
                timestamp: Date.now()
            });

            await this.notificationDispatcher.dispatch(notification);
        } catch (error) {
            console.error(`[NotificationSubscriptionService] Failed to handle event ${envelope.event?.eventType}:`, error.message);
        }
    }

    _mapSeverity(eventType) {
        if (eventType.includes('FAILED') || eventType.includes('ERROR')) return 'ERROR';
        if (eventType.includes('WARNING') || eventType.includes('ALERT')) return 'WARNING';
        if (eventType.includes('COMPLETED') || eventType.includes('READY')) return 'SUCCESS';
        return 'INFO';
    }
}

module.exports = NotificationSubscriptionService;
