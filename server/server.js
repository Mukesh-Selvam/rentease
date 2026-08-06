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
  const requiredEnvVars = [
    'JWT_SECRET',
    'MONGODB_URI',
    'CLIENT_URL'
  ];

  const missing = requiredEnvVars.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    console.error(`[FATAL] Missing required production environment variables: ${missing.join(', ')}`);
    process.exit(1);
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

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS || CLIENT_URL
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!isProduction) {
  allowedOrigins.push(
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  );
}

// Security
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://checkout.razorpay.com'],
        frameSrc: [
          "'self'",
          'https://api.razorpay.com',
          'https://checkout.razorpay.com'
        ],
        connectSrc: [
          "'self'",
          'https://api.razorpay.com'
        ],
        imgSrc: ["'self'", 'data:', 'https:'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
        fontSrc: ["'self'", 'https:', 'data:']
      }
    },
    crossOriginResourcePolicy: {
      policy: 'cross-origin'
    }
  })
);

// CORS
app.use(
  cors({
    origin: allowedOrigins,
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

app.use(cookieParser());

// Razorpay Webhook
app.post(
  '/api/payment/webhook',
  express.raw({ type: 'application/json' }),
  handleRazorpayWebhook
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// MongoDB — connect with retries/backoff to handle transient network issues
async function connectWithRetries(uri, attempts = 5, delayMs = 2000) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await mongoose.connect(uri);
      console.log('[MongoDB] Connected successfully');
      return;
    } catch (err) {
      console.warn(`[MongoDB] Connection attempt ${i} failed: ${err.message}`);

      if (i === attempts) {
        console.error('[MongoDB] All connection attempts failed.');
        if (process.env.NODE_ENV === 'production') {
          console.error('[MongoDB] Exiting process due to failed DB connection in production.');
          process.exit(1);
        }
      } else {
        await new Promise((res) => setTimeout(res, delayMs));
      }
    }
  }
}

connectWithRetries(MONGODB_URI).catch((err) => {
  console.error('[MongoDB] Fatal connection error:', err);
});

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
    dbReadyState: readyState
  });
});

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
