require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cybershield-x';

const defaults = {
  username: process.env.SEED_ADMIN_USERNAME || 'cyberadmin',
  email: process.env.SEED_ADMIN_EMAIL || 'admin@cybershieldx.local',
  password: process.env.SEED_ADMIN_PASSWORD || 'CyberShield123',
};

async function seedAdmin() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });

  const existing = await User.findOne({
    $or: [{ email: defaults.email }, { username: defaults.username }],
  }).select('+password');

  if (existing) {
    existing.role = 'admin';
    existing.emailAlerts = true;
    existing.alertThreshold = 65;
    existing.emailVerified = true;
    existing.emailVerifiedAt = existing.emailVerifiedAt || new Date();

    if (!(await existing.comparePassword(defaults.password))) {
      existing.password = defaults.password;
    }

    await existing.save();

    console.log('Admin account updated');
    console.log(`email=${defaults.email}`);
    console.log(`password=${defaults.password}`);
    return;
  }

  await User.create({
    username: defaults.username,
    email: defaults.email,
    password: defaults.password,
    role: 'admin',
    emailAlerts: true,
    alertThreshold: 65,
    emailVerified: true,
    emailVerifiedAt: new Date(),
  });

  console.log('Admin account created');
  console.log(`email=${defaults.email}`);
  console.log(`password=${defaults.password}`);
}

seedAdmin()
  .catch((error) => {
    console.error('Failed to seed admin:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
