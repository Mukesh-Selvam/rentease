import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const uri = process.env.MONGODB_URI;
console.log('URI present:', Boolean(uri));
if (!uri) {
  console.error('No MONGODB_URI found in environment.');
  process.exit(1);
}
console.log('URI masked:', uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@.*)/, '$1*****$3'));

const opts = { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000, family: 4 };

try {
  await mongoose.connect(uri, opts);
  console.log('LOCAL CONNECTED');
  process.exit(0);
} catch (err) {
  console.error('LOCAL ERROR', err.message || err);
  process.exit(1);
}