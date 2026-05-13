require('dotenv').config();
const mongoose = require('mongoose');

const wipeDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('⚠️  Connected to MongoDB for DATA PURGE');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    for (const collection of collections) {
      await db.collection(collection.name).drop();
      console.log(`🗑️  Dropped: ${collection.name}`);
    }

    console.log(`\n======================================================`);
    console.log(`🌟 FRESH START READY: ALL DATA PURGED`);
    console.log(`🚀 You can now create your first ELITE account.`);
    console.log(`======================================================\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Wipe failed:', error.message);
    process.exit(1);
  }
};

wipeDatabase();
