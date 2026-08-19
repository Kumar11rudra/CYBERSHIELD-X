/**
 * 🧪 Test Database Helper — CyberShield X
 * Seamlessly manages In-Memory MongoDB instances via MongoMemoryServer
 * or connects to external test URIs without hanging.
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer = null;

async function connectTestDb() {
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return;
  }

  // If external test URI is provided and reachable, try it first
  if (process.env.MONGODB_TEST_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_TEST_URI, { serverSelectionTimeoutMS: 2000 });
      return;
    } catch {
      // Fallback to in-memory server
    }
  }

  try {
    if (!mongoServer) {
      mongoServer = await MongoMemoryServer.create();
    }
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  } catch (err) {
    console.error('❌ [TestDB] Failed to initialize MongoMemoryServer:', err.message);
    throw err;
  }
}

async function closeTestDb() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
      mongoServer = null;
    }
  } catch (err) {
    console.warn('⚠️ [TestDB] Cleanup notice:', err.message);
  }
}

async function clearTestDb() {
  try {
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      const collections = await mongoose.connection.db.collections();
      for (const collection of collections) {
        await collection.deleteMany({});
      }
    }
  } catch (err) {
    console.warn('⚠️ [TestDB] Collection purge notice:', err.message);
  }
}

module.exports = {
  connectTestDb,
  closeTestDb,
  clearTestDb
};
