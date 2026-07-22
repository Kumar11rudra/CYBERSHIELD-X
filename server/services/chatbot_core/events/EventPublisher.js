const EventEnvelope = require('./EventEnvelope');
const EventMetadata = require('./EventMetadata');
const DomainEvent = require('./DomainEvent');
const EventResult = require('./EventResult');

/**
 * @module EventPublisher
 * @description Facade interface for services to publish events. Validates & wraps into envelopes.
 */
class EventPublisher {
    /**
     * @param {Object} deps 
     * @param {import('./EventDispatcher')} deps.eventDispatcher
     */
    constructor(deps) {
        this.eventDispatcher = deps.eventDispatcher;
    }

    /**
     * Validates DomainEvent, wraps in envelope, and forwards to dispatcher.
     * @param {DomainEvent} domainEvent 
     * @param {string} sourceName 
     * @returns {Promise<EventResult>}
     */
    async publish(domainEvent, sourceName = 'System') {
        try {
            if (!(domainEvent instanceof DomainEvent)) {
                return EventResult.fallbackError('EventPublisher requires a valid DomainEvent instance.');
            }

            const metadata = new EventMetadata({
                source: sourceName,
                depth: 1
            });

            const envelope = new EventEnvelope({
                event: domainEvent,
                metadata
            });

            return await this.eventDispatcher.dispatch(envelope);
        } catch (error) {
            return EventResult.fallbackError(`EventPublisher validation failure: ${error.message}`);
        }
    }
}

module.exports = EventPublisher;
