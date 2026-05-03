/**
 * Seed Script — Creates the initial Super Admin account
 * Run once: npm run seed
 *
 * Usage:
 *   SUPER_ADMIN_EMAIL=admin@example.com \
 *   SUPER_ADMIN_PASSWORD=SecurePass123 \
 *   SUPER_ADMIN_MOBILE=9876543210 \
 *   npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User.model');

const SUPER_ADMIN = {
  fullName:       process.env.SUPER_ADMIN_NAME     || 'Super Admin',
  email:          process.env.SUPER_ADMIN_EMAIL    || 'superadmin@sportsclub.com',
  mobile:         process.env.SUPER_ADMIN_MOBILE   || '9000000000',
  password:       process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123',
  role:           'admin',
  adminLevel:     'super_admin',
  isEmailVerified: true,
  isActive:       true,
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    const existing = await User.findOne({ email: SUPER_ADMIN.email });
    if (existing) {
      console.log('⚠️  Super Admin already exists:', SUPER_ADMIN.email);
      console.log('   AdminLevel:', existing.adminLevel);
      process.exit(0);
    }

    const admin = await User.create(SUPER_ADMIN);
    console.log('✅ Super Admin created successfully!');
    console.log('   Name:    ', admin.fullName);
    console.log('   Email:   ', admin.email);
    console.log('   Level:   ', admin.adminLevel);
    console.log('   ID:      ', admin._id);
    console.log('\n⚠️  Change the default password immediately after first login!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
