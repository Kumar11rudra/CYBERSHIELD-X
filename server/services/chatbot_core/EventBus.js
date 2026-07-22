/**
 * EventBus Service
 * Internal publish/subscribe architecture for the Intelligence Layer.
 * Only facilitates event flow. No listeners perform executions or actions.
 */
class EventBus {
  constructor() {
    this.events = [];
    this.subscribers = new Map();
  }

  /**
   * Subscribes to a specific event category.
   * @param {string} category - The event category to subscribe to.
   * @param {Function} callback - The callback to invoke when an event is published.
   * @returns {Object} Structured response.
   */
  subscribe(category, callback) {
    if (!this.subscribers.has(category)) {
      this.subscribers.set(category, []);
    }
    this.subscribers.get(category).push(callback);

    return {
      success: true,
      status: 'subscribed',
      data: { category },
      error: null,
      metadata: { timestamp: new Date().toISOString() }
    };
  }

  /**
   * Publishes an event to the bus.
   * @param {string} category - The event category.
   * @param {Object} payload - The event payload.
   * @returns {Object} Structured response.
   */
  async publish(category, payload) {
    const eventRecord = {
      category,
      payload,
      timestamp: new Date().toISOString()
    };
    
    // Store in internal memory flow (capped for safety)
    this.events.unshift(eventRecord);
    if (this.events.length > 1000) {
      this.events.pop();
    }

    const callbacks = this.subscribers.get(category) || [];
    
    // Asynchronously notify subscribers without blocking
    Promise.allSettled(callbacks.map(cb => cb(payload))).catch(err => {
      console.error('[EventBus] Subscriber error:', err);
    });

    return {
      success: true,
      status: 'published',
      data: { category },
      error: null,
      metadata: { timestamp: new Date().toISOString() }
    };
  }

  /**
   * Retrieves recent events for the Aggregator.
   * @param {number} limit - Max number of events to return.
   * @returns {Object} Structured response.
   */
  getRecentEvents(limit = 50) {
    return {
      success: true,
      status: 'retrieved',
      data: { events: this.events.slice(0, limit) },
      error: null,
      metadata: { timestamp: new Date().toISOString() }
    };
  }
}

module.exports = EventBus;
