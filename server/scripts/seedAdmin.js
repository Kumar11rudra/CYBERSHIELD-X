/**
 * CyberShield X — One-Time Idempotent Admin Setup Bootstrap Script
 * Executed via: npm run seed:admin
 */

const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

async function seedAdmin(options = {}) {
  // Production Safety Gate: MONGODB_URI is mandatory in production
  if (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI) {
    console.error('❌ FATAL: MONGODB_URI environment variable is required in production.');
    throw new Error('MONGODB_URI environment variable is required in production.');
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cybershield';
  const shouldManageConnection = mongoose.connection.readyState === 0;

  if (shouldManageConnection) {
    console.log('[SEED] Connecting to database...');
    await mongoose.connect(mongoUri);
  }

  try {
    const existingAdmin = await User.findOne({ role: 'admin' });

    if (existingAdmin) {
      console.log(`[SEED] Admin account already exists (${existingAdmin.email}). Skipping bootstrap.`);
      return existingAdmin;
    }

    const adminEmail = (process.env.ADMIN_EMAIL || 'official.cybershieldx@gmail.com').toLowerCase().trim();
    const adminUsername = (process.env.ADMIN_USERNAME || 'founder_admin').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'CyberShieldAdmin2026!Root';

    console.log(`[SEED] Initializing Founder Admin account for ${adminEmail}...`);

    const createdAdmin = await User.create({
      username: adminUsername,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      fullName: 'Anil Kumar',
      status: 'active',
      emailVerified: true
    });

    console.log('[SEED] Administrator account successfully initialized.');
    return createdAdmin;
  } catch (err) {
    console.error('[SEED_ERROR] Failed to seed administrator account:', err.message);
    throw err;
  } finally {
    if (shouldManageConnection && options.autoClose !== false) {
      await mongoose.disconnect();
    }
  }
}

if (require.main === module) {
  seedAdmin().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = seedAdmin;
