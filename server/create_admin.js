require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const email = 'official.cybershieldx@gmail.com';
const password = 'AdminPassword@123!'; // Temporary secure password
const username = 'CyberShieldAdmin';

async function seedAdmin() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not set in .env');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB...');
    
    let user = await User.findOne({ email });
    if (user) {
      console.log('User already exists. Ensuring admin role and resetting password...');
      user.role = 'admin';
      user.password = password; // The pre-save hook in User model will hash this automatically
      user.emailVerified = true;
      await user.save();
      console.log('User updated successfully.');
    } else {
      console.log('Creating new admin user...');
      user = new User({
        username,
        email,
        password, // Will be hashed
        role: 'admin',
        emailVerified: true
      });
      await user.save();
      console.log('New admin user created.');
    }
    
    console.log('\n=======================================');
    console.log('✅ SUPER ADMIN CREDENTIALS GENERATED');
    console.log(`📧 Email:    ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log('=======================================\n');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

seedAdmin();
