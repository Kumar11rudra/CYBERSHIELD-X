const EventResult = require('./EventResult');

/**
 * @module EventDispatcher
 * @description Resolves subscribers and executes them concurrently with Promise.allSettled.
 */
class EventDispatcher {
    /**
     * @param {Object} deps 
     * @param {import('./EventRegistry')} deps.eventRegistry
     */
    constructor(deps) {
        this.eventRegistry = deps.eventRegistry;
    }

    /**
     * Dispatches an envelope to all registered subscribers concurrently.
     * @param {import('./EventEnvelope')} envelope 
     * @returns {Promise<EventResult>}
     */
    async dispatch(envelope) {
        try {
            const eventType = envelope.event.eventType;
            const subscribers = this.eventRegistry.resolve(eventType);
            
            if (subscribers.length === 0) {
                return new EventResult({
                    success: true,
                    status: 'NO_SUBSCRIBERS',
                    metadata: { eventId: envelope.event.eventId }
                });
            }

            const promises = subscribers.map(sub => 
                sub.handle(envelope).then(() => sub.name)
            );

            const results = await Promise.allSettled(promises);

            const completed = [];
            const failed = [];
            const warnings = [];

            results.forEach((res, index) => {
                const subName = subscribers[index].name;
                if (res.status === 'fulfilled') {
                    completed.push(subName);
                } else {
                    failed.push(subName);
                    warnings.push(`Subscriber ${subName} failed: ${res.reason.message}`);
                }
            });

            return new EventResult({
                success: failed.length === 0,
                status: failed.length === 0 ? 'DISPATCHED' : 'PARTIAL_DISPATCH',
                completedSubscribers: completed,
                failedSubscribers: failed,
                warnings,
                metadata: { eventId: envelope.event.eventId }
            });

        } catch (error) {
            // Failsafe in case registry throws
            return EventResult.fallbackError(`Dispatcher internal failure: ${error.message}`);
        }
    }
}

module.exports = EventDispatcher;
