const mongoose = require('mongoose');

const MODEL_MAP = {
  'ioc_records': require('../../models/IOCRecord'),
  'threat_feed_records': require('../../models/ThreatFeedRecord'),
  'correlation_records': require('../../models/CorrelationRecord'),
  'users': require('../../models/User'),
  'organizations': require('../../models/Organization'),
  'memberships': require('../../models/Membership'),
  'assets': require('../../models/Asset'),
  'scans': require('../../models/Scan')
};

class MongoStorageProvider {
  constructor(uri) { 
    this.uri = uri;
    this.fallbackStore = new Map();
  }

  async connect() { return { success: true }; }

  _getKey(collection, id) {
    return `${collection}:${id}`;
  }

  async save(collection, id, document) {
    const Model = MODEL_MAP[collection];
    if (!Model) {
      const docId = id || document.id || document._id || new mongoose.Types.ObjectId().toString();
      const storedDoc = { ...document, _id: docId, id: docId };
      this.fallbackStore.set(this._getKey(collection, docId), storedDoc);
      return storedDoc;
    }

    if (id) {
      const updated = await Model.findByIdAndUpdate(id, document, { new: true, upsert: true });
      return updated;
    } else {
      const created = await Model.create(document);
      return created;
    }
  }

  async findById(collection, id) {
    const Model = MODEL_MAP[collection];
    if (!Model) {
      return this.fallbackStore.get(this._getKey(collection, id)) || null;
    }
    return await Model.findById(id);
  }

  async findOne(collection, query) {
    const Model = MODEL_MAP[collection];
    if (!Model) {
      const prefix = `${collection}:`;
      for (const [key, doc] of this.fallbackStore.entries()) {
        if (key.startsWith(prefix)) {
          let match = true;
          const { $many, ...realQuery } = query;
          for (const [qKey, qVal] of Object.entries(realQuery)) {
            if (doc[qKey] !== qVal) {
              match = false;
              break;
            }
          }
          if (match) {
            if ($many) {
              const results = [];
              for (const [k, d] of this.fallbackStore.entries()) {
                if (k.startsWith(prefix)) {
                  let m = true;
                  for (const [qk, qv] of Object.entries(realQuery)) {
                    if (d[qk] !== qv) { m = false; break; }
                  }
                  if (m) results.push({ ...d });
                }
              }
              return results;
            }
            return doc;
          }
        }
      }
      return null;
    }
    return await Model.findOne(query);
  }

  async findMany(collection, query = {}) {
    const Model = MODEL_MAP[collection];
    if (!Model) {
      const prefix = `${collection}:`;
      const results = [];
      for (const [key, doc] of this.fallbackStore.entries()) {
        if (key.startsWith(prefix)) {
          let match = true;
          for (const [qKey, qVal] of Object.entries(query)) {
            if (doc[qKey] !== qVal) {
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
    return await Model.find(query);
  }

  async update(collection, id, updates) {
    const Model = MODEL_MAP[collection];
    if (!Model) {
      const key = this._getKey(collection, id);
      const existing = this.fallbackStore.get(key) || {};
      const updated = { ...existing, ...updates };
      this.fallbackStore.set(key, updated);
      return { success: true, id };
    }
    await Model.findByIdAndUpdate(id, updates);
    return { success: true, id };
  }

  async delete(collection, id) {
    const Model = MODEL_MAP[collection];
    if (!Model) {
      const key = this._getKey(collection, id);
      return this.fallbackStore.delete(key);
    }
    await Model.findByIdAndDelete(id);
    return true;
  }
}

module.exports = MongoStorageProvider;
