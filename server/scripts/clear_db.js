const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('../utils/database');

dotenv.config({ path: path.join(__dirname, '../.env') });

const clearDB = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Connected. Dropping collections...');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    if (collections.length === 0) {
      console.log('No collections found. Database is already clean.');
    } else {
      for (const col of collections) {
        console.log(`Dropping ${col.name}...`);
        await mongoose.connection.db.dropCollection(col.name);
      }
      console.log('Database cleared successfully.');
    }
    process.exit(0);
  } catch (err) {
    console.error('Error clearing database:', err);
    process.exit(1);
  }
};

clearDB();
