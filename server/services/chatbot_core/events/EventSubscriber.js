/**
 * @module EventSubscriber
 * @description Abstract contract for any class listening to DomainEvents.
 */
class EventSubscriber {
    /**
     * Returns the unique name of this subscriber for tracing.
     * @returns {string}
     */
    get name() {
        return this.constructor.name;
    }

    /**
     * Core handler logic. Must be overridden.
     * @param {import('./EventEnvelope')} envelope 
     * @returns {Promise<void>}
     */
    async handle(envelope) {
        throw new Error('Subscriber must implement handle()');
    }
}

module.exports = EventSubscriber;
