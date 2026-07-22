/**
 * MemoryManager Service
 * Interfaces and abstractions for short-term and long-term conversation history.
 * Does NOT contain database implementation (MongoDB/Redis) in Phase 1.
 */
class MemoryManager {
  /**
   * Retrieves conversation history for a given session or user.
   * @param {string} sessionId - The unique identifier for the chat session.
   * @returns {Object} Structured response containing an array of message objects.
   */
  async getHistory(sessionId) {
    // Phase 1: Abstraction only.
    // Future Phase: Connect to MongoDB/Redis.
    
    return {
      success: true,
      status: 'retrieved',
      data: {
        messages: [] // Empty mock history
      },
      error: null,
      metadata: {
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Saves a new message to the conversation history.
   * @param {string} sessionId - The unique identifier for the chat session.
   * @param {Object} message - The message object to save { role, content }.
   * @returns {Object} Structured response confirming save status.
   */
  async saveMessage(sessionId, message) {
    // Phase 1: Abstraction only.
    
    return {
      success: true,
      status: 'saved',
      data: {
        savedMessageId: 'mock-msg-id-123'
      },
      error: null,
      metadata: {
        timestamp: new Date().toISOString()
      }
    };
  }
}

module.exports = MemoryManager;
