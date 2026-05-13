const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../server/.env') });

const clearDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cybershield-x';
    console.log('Connecting to:', uri);
    await mongoose.connect(uri);
    console.log('Connected. Dropping collections...');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const col of collections) {
      console.log(`Dropping ${col.name}...`);
      await mongoose.connection.db.dropCollection(col.name);
    }
    
    console.log('Database cleared successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error clearing database:', err);
    process.exit(1);
  }
};

clearDB();
