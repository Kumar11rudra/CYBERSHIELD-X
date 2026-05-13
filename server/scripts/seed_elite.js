require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for Seeding');

    const adminData = {
      username: 'cyber_commander',
      email: 'admin@cybershield.x',
      password: 'Password123!', // You can change this
      role: 'admin',
      emailVerified: true,
      subscription: {
        plan: 'elite',
        status: 'active',
        premiumFeatures: ['ai_forensics', 'dark_web_monitor', 'quantum_check']
      }
    };

    // Remove existing admin if any
    await User.findOneAndDelete({ email: adminData.email });

    const admin = await User.create(adminData);
    console.log('\n======================================================');
    console.log('🚀 ELITE COMMANDER ACCOUNT CREATED');
    console.log(`📧 Email: ${admin.email}`);
    console.log('🔑 Password: Password123!');
    console.log('🛡️  Role: ADMIN (Elite Subscription Active)');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedAdmin();
