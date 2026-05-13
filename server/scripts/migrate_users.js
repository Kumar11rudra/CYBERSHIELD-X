require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const migrateUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for Migration');

    const result = await User.updateMany(
      { subscription: { $exists: false } },
      { 
        $set: { 
          subscription: { 
            plan: 'free', 
            status: 'active',
            premiumFeatures: [] 
          } 
        } 
      }
    );

    console.log(`\n======================================================`);
    console.log(`🛠️  MIGRATION COMPLETE`);
    console.log(`📦 Users Updated: ${result.modifiedCount}`);
    console.log(`======================================================\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
};

migrateUsers();
