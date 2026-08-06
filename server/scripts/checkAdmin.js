import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rentease';

async function run() {
  try {
    await mongoose.connect(MONGODB_URI, {});
    const admin = await User.findOne({ email: 'admin@rentease.com' }).lean();
    if (!admin) {
      console.log('ADMIN_NOT_FOUND');
      process.exit(0);
    }

    const out = {
      id: admin._id?.toString(),
      name: admin.name,
      email: admin.email,
      role: admin.role,
      isEmailVerified: admin.isEmailVerified,
      status: admin.status,
      isVendorApproved: admin.isVendorApproved || false,
      kycStatus: admin.kycStatus || null
    };

    console.log(JSON.stringify(out, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err.message || err);
    process.exit(1);
  }
}

run();
