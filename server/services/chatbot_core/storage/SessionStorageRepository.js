/**
 * @module SessionStorageRepository
 * @description Abstract repository responsible for managing conversational state/history.
 */
class SessionStorageRepository {
    /**
     * @param {import('./IStorageProvider')} storageProvider 
     */
    constructor(storageProvider) {
        this.provider = storageProvider;
        this.collection = 'chat_sessions';
    }

    /**
     * @param {string} sessionId 
     * @param {Object} sessionSnapshot 
     * @returns {Promise<Object>}
     */
    async updateSession(sessionId, sessionSnapshot) {
        if (!sessionId) throw new Error('Session ID is required');

        const existing = await this.provider.findById(this.collection, sessionId);
        
        if (!existing) {
            return await this.provider.save(this.collection, sessionId, {
                sessionId,
                history: [sessionSnapshot],
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
        }

        const newHistory = [...existing.history, sessionSnapshot];
        return await this.provider.update(this.collection, sessionId, {
            history: newHistory,
            updatedAt: Date.now()
        });
    }
}

module.exports = SessionStorageRepository;
