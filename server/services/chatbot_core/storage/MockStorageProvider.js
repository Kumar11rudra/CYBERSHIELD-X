const IStorageProvider = require('./IStorageProvider');

/**
 * @module MockStorageProvider
 * @description In-memory mock implementation of IStorageProvider for Phase 10 design validation.
 */
class MockStorageProvider extends IStorageProvider {
    constructor() {
        super();
        this.store = new Map();
    }

    _getKey(collection, id) {
        return `${collection}:${id}`;
    }

    async save(collection, id, document) {
        this.store.set(this._getKey(collection, id), { ...document });
        return { success: true, id };
    }

    async findById(collection, id) {
        return this.store.get(this._getKey(collection, id)) || null;
    }

    async findOne(collection, query) {
        const results = await this.findMany(collection, query);
        return results.length > 0 ? results[0] : null;
    }

    async findMany(collection, query = {}) {
        const prefix = `${collection}:`;
        const results = [];
        for (const [key, doc] of this.store.entries()) {
            if (key.startsWith(prefix)) {
                let match = true;
                for (const [qKey, qVal] of Object.entries(query)) {
                    if (qVal instanceof RegExp) {
                        if (!qVal.test(String(doc[qKey] || ''))) {
                            match = false;
                            break;
                        }
                    } else if (doc[qKey] !== qVal) {
                        match = false;
                        break;
                    }
                }
                if (match) {
                    results.push({ ...doc });
                }
            }
        }
        return results;
    }

    async update(collection, id, updates) {
        const key = this._getKey(collection, id);
        if (!this.store.has(key)) throw new Error('Document not found');
        const existing = this.store.get(key);
        this.store.set(key, { ...existing, ...updates });
        return { success: true, id };
    }

    async delete(collection, id) {
        const key = this._getKey(collection, id);
        return this.store.delete(key);
    }
}

module.exports = MockStorageProvider;
