/**
 * @module EventRegistry
 * @description Responsible ONLY for registration and lookup of subscribers.
 */
class EventRegistry {
    constructor() {
        /** @type {Map<string, Array<import('./EventSubscriber')>>} */
        this.topicMap = new Map();
    }

    /**
     * @param {string} eventType 
     * @param {import('./EventSubscriber')} subscriber 
     */
    register(eventType, subscriber) {
        if (!this.topicMap.has(eventType)) {
            this.topicMap.set(eventType, []);
        }
        this.topicMap.get(eventType).push(subscriber);
    }

    /**
     * @param {string} eventType 
     * @returns {Array<import('./EventSubscriber')>}
     */
    resolve(eventType) {
        return this.topicMap.get(eventType) || [];
    }
}

module.exports = EventRegistry;
