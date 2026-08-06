import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import morgan from 'morgan';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import maintenanceRoutes from './routes/maintenance.js';
import vendorRoutes from './routes/vendor.js';
import adminRoutes from './routes/admin.js';
import paymentRoutes, { handleRazorpayWebhook } from './routes/payment.js';
import rentalsRoutes from './routes/rentals.js';
import verifyRoutes from './routes/verify.js';
import billingRoutes from './routes/billing.js';
import reviewRoutes from './routes/reviews.js';
import couponRoutes from './routes/coupons.js';
import notificationRoutes from './routes/notifications.js';

dotenv.config();

// Startup validation for production
if (process.env.NODE_ENV === 'production') {
  const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
  const missing = requiredEnvVars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    console.warn(`[WARN] Missing recommended production environment variables: ${missing.join(', ')}`);
  }
}

const app = express();

const PORT = process.env.PORT || 5000;

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  'mongodb://127.0.0.1:27017/rentease';

const CLIENT_URL =
  process.env.CLIENT_URL ||
  'http://localhost:5173';

const isProduction = process.env.NODE_ENV === 'production';

const sanitizedMongoUri = MONGODB_URI.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@.*)/, '$1*****$3');

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || '*'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        !isProduction ||
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS'
    ],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Idempotency-Key',
      'X-Razorpay-Signature'
    ]
  })
);

// Helmet Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: {
      policy: 'cross-origin'
    }
  })
);

app.use(cookieParser());

// Razorpay Webhook
app.post(
  '/api/payment/webhook',
  express.raw({ type: 'application/json' }),
  handleRazorpayWebhook
);

let lastMongoError = null;
let lastMongoEvent = null;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

mongoose.connection.on('connecting', () => {
  lastMongoEvent = 'connecting';
  console.log('[MongoDB] event: connecting');
});

mongoose.connection.on('connected', () => {
  lastMongoEvent = 'connected';
  console.log('[MongoDB] event: connected');
});

mongoose.connection.on('disconnected', () => {
  lastMongoEvent = 'disconnected';
  console.log('[MongoDB] event: disconnected');
});

mongoose.connection.on('error', (err) => {
  lastMongoError = err.message || String(err);
  console.error('[MongoDB] event: error', err.message || err);
});

const mongoConnectOptions = {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
};

// Serverless-friendly DB connection re-use
let dbPromise = null;

async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  if (!dbPromise) {
    dbPromise = mongoose.connect(MONGODB_URI, mongoConnectOptions)
      .then(() => {
        console.log('[MongoDB] Connected successfully');
      })
      .catch((err) => {
        dbPromise = null;
        console.error('[MongoDB] Connection error:', err.message || err);
      });
  }
  return dbPromise;
}

// Auto-connect middleware for serverless invocations
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState < 1) {
    await connectToDatabase();
  }
  next();
});

// Trigger initial async connection attempt
connectToDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/rentals', rentalsRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/notifications', notificationRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  const readyState = mongoose.connection.readyState; // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.json({
    status: 'healthy',
    service: 'RentEase MERN API',
    timestamp: new Date().toISOString(),
    dbState: stateMap[readyState] || 'unknown',
    dbReadyState: readyState,
    mongoUriPresent: Boolean(process.env.MONGODB_URI),
    usingMongoUri: sanitizedMongoUri || null,
    lastMongoEvent,
    lastMongoError
  });
});

// Temporary DB check route (uses native driver) — returns immediate error message when connection fails
// (removed temporary /api/dbcheck route)

// 404
app.use((req, res) => {
  res.status(404).json({
    message: `API Endpoint Not Found: ${req.method} ${req.originalUrl}`
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development'
      ? { stack: err.stack }
      : {})
  });
});

/*
|--------------------------------------------------------------------------
| Start server only in Local Development
|--------------------------------------------------------------------------
| Vercel provides its own server, so we must NOT call app.listen()
| in production.
*/
if (
  process.env.NODE_ENV !== 'production' &&
  process.env.NODE_ENV !== 'test'
) {
  app.listen(PORT, () => {
    console.log(
      `🚀 RentEase API running at http://localhost:${PORT}`
    );
  });
}

export default app;
