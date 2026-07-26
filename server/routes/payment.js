import express from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import RentalOrder from '../models/RentalOrder.js';
import Payment from '../models/Payment.js';
import RentalBilling from '../models/RentalBilling.js';
import Product from '../models/Product.js';
import WebhookEvent from '../models/WebhookEvent.js';
import { authMiddleware } from '../middleware/auth.js';
import { isMockPaymentsEnabled } from '../utils/paymentMode.js';

const router = express.Router();

// Safe public capability signal for checkout. This intentionally exposes no secrets.
router.get('/config', (_req, res) => {
  const mockPaymentsEnabled = isMockPaymentsEnabled();
  const razorpayConfigured = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  res.json({
    paymentsAvailable: razorpayConfigured || mockPaymentsEnabled,
    mockPaymentsEnabled,
    razorpayKeyId: razorpayConfigured ? process.env.RAZORPAY_KEY_ID : null
  });
});

// Shared Transactional Idempotent Payment & Stock Confirmation Engine
export async function confirmOrderPayment({
  orderId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  paymentMethod = 'RAZORPAY',
  provider = 'RAZORPAY'
}) {
  const session = await mongoose.startSession();
  try {
    let result = null;

    await session.withTransaction(async () => {
      const order = await RentalOrder.findById(orderId).session(session);
      if (!order) throw new Error('Rental order not found.');

      // Idempotent Check: If already confirmed, return existing payment record
      if (order.status !== 'PAYMENT_PENDING' && order.isStockDecremented) {
        const existingPayment = await Payment.findOne({ order: order._id }).session(session);
        if (!existingPayment) {
          throw new Error('Confirmed order is missing its payment record.');
        }
        if (
          provider === 'RAZORPAY' &&
          existingPayment.provider === 'RAZORPAY' &&
          existingPayment.razorpayPaymentId !== razorpayPaymentId
        ) {
          throw new Error('Order has already been confirmed with a different payment.');
        }
        result = { order, payment: existingPayment, alreadyConfirmed: true };
        return;
      }

      // Check if razorpayPaymentId was already recorded
      if (razorpayPaymentId) {
        const existingRzpPayment = await Payment.findOne({ razorpayPaymentId }).session(session);
        if (existingRzpPayment && existingRzpPayment.status === 'SUCCESS') {
          result = { order, payment: existingRzpPayment, alreadyConfirmed: true };
          return;
        }
      }

      // Atomic Stock Decrement with non-negative guard ($gte: 1)
      if (!order.isStockDecremented) {
        const updatedProduct = await Product.findOneAndUpdate(
          { _id: order.product, availableStock: { $gte: 1 } },
          { $inc: { availableStock: -1, rentedStock: 1 } },
          { session, new: true }
        );

        if (!updatedProduct) {
          order.status = 'CANCELLED';
          await order.save({ session });
          throw new Error('Stock unavailable: Product sold out before payment completion.');
        }
        order.isStockDecremented = true;
      }

      // Update Order Status to CONFIRMED
      order.status = 'CONFIRMED';
      order.razorpayOrderId = razorpayOrderId || order.razorpayOrderId;
      order.razorpayPaymentId = razorpayPaymentId || order.razorpayPaymentId;
      order.paymentMethod = paymentMethod;

      if (order.trackingTimeline && order.trackingTimeline.length >= 1) {
        order.trackingTimeline[0].completed = true;
        order.trackingTimeline[0].current = false;
        order.trackingTimeline.push({
          label: 'Payment Verified & Confirmed',
          description: `Payment verified via ${paymentMethod} (${provider}).`,
          timestamp: new Date().toISOString(),
          completed: true,
          current: true
        });
      }

      await order.save({ session });

      // Create Invoice & Payment Record Idempotently
      const invoiceNumber = `INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      let payment = await Payment.findOne({ order: order._id }).session(session);
      if (!payment) {
        payment = (await Payment.create(
          [{
            order: order._id,
            customer: order.customer,
            provider,
            providerOrderId: provider === 'MOCK' ? order.razorpayOrderId : razorpayOrderId,
            providerPaymentId: provider === 'MOCK' ? undefined : razorpayPaymentId,
            razorpayOrderId: provider === 'RAZORPAY' ? razorpayOrderId : undefined,
            razorpayPaymentId: provider === 'RAZORPAY' ? razorpayPaymentId : undefined,
            razorpaySignature: provider === 'MOCK' ? '' : (razorpaySignature || ''),
            amount: order.totalPaidToday,
            currency: 'INR',
            type: 'UPFRONT_TOTAL',
            status: 'SUCCESS',
            invoiceNumber,
            paymentMethod: provider === 'MOCK' ? 'MOCK_DEV_PAYMENT' : paymentMethod
          }],
          { session }
        ))[0];
      }

      // Generate Monthly Billing Schedules Idempotently
      const existingBills = await RentalBilling.countDocuments({ order: order._id }).session(session);
      if (existingBills === 0 && order.tenureMonths > 1) {
        const billingSchedules = [];
        let currentDate = new Date(order.deliveryDate || new Date());

        for (let m = 2; m <= order.tenureMonths; m++) {
          currentDate.setMonth(currentDate.getMonth() + 1);
          const dueDateStr = currentDate.toISOString().split('T')[0];

          billingSchedules.push({
            order: order._id,
            customer: order.customer,
            vendor: order.vendor,
            monthNumber: m,
            dueDate: dueDateStr,
            amount: order.monthlyRent,
            status: 'PENDING'
          });
        }

        if (billingSchedules.length > 0) {
          await RentalBilling.insertMany(billingSchedules, { session });
        }
      }

      result = { order, payment, invoiceNumber, alreadyConfirmed: false };
    });

    return result;
  } finally {
    session.endSession();
  }
}

// POST /api/payment/verify (MANUAL SIGNATURE VERIFICATION & CONFIRMATION)
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required.' });
    }

    const order = await RentalOrder.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Rental order not found.' });

    if (req.user.role === 'CUSTOMER' && order.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: Unauthorized access to order payment.' });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const enableMock = isMockPaymentsEnabled();

    // Strict Mock Payment Rule
    if (!razorpay_signature && !enableMock) {
      return res.status(400).json({
        message: 'Mock payment mode is disabled or running in production. Valid Razorpay signature is required.'
      });
    }

    // Signature Verification
    let isValid = false;
    let provider = 'RAZORPAY';

    if (razorpay_signature) {
      if (!keySecret) {
        return res.status(503).json({ message: 'Payment service is unavailable. Razorpay is not configured.' });
      }
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id || order.razorpayOrderId}|${razorpay_payment_id}`)
        .digest('hex');

      isValid = generatedSignature === razorpay_signature;
      provider = 'RAZORPAY';
    } else if (enableMock) {
      console.log(`[Development Mock Payment Mode] Explicit mock payment confirmed for order ${order.rentalCode}`);
      isValid = true;
      provider = 'MOCK';
    } else {
      return res.status(400).json({
        message: 'Razorpay configuration missing. Configure RAZORPAY_KEY_SECRET in .env or set ENABLE_MOCK_PAYMENTS=true in development.'
      });
    }

    if (!isValid) {
      return res.status(400).json({ message: 'Payment verification failed: Invalid Razorpay signature.' });
    }

    const result = await confirmOrderPayment({
      orderId: order._id,
      razorpayOrderId: provider === 'MOCK' ? undefined : razorpay_order_id,
      razorpayPaymentId: provider === 'MOCK' ? undefined : razorpay_payment_id,
      razorpaySignature: provider === 'MOCK' ? undefined : razorpay_signature,
      paymentMethod: provider === 'MOCK' ? 'MOCK_DEV_PAYMENT' : (order.paymentMethod || 'RAZORPAY'),
      provider
    });

    res.json({
      message: 'Payment verified and order confirmed successfully!',
      ...result
    });
  } catch (err) {
    console.error('[Payment Verification Error]', err);
    res.status(500).json({ message: err.message });
  }
});

// RAW RAZORPAY WEBHOOK HANDLER WITH EVENT IDEMPOTENCY
export async function handleRazorpayWebhook(req, res) {
  let claimedEvent = null;
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (!webhookSecret || !signature) {
      return res.status(400).json({ message: 'Webhook secret or signature missing' });
    }

    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '');
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const payload = JSON.parse(rawBody.toString('utf8'));
    const eventId = payload.event_id || req.headers['x-razorpay-event-id'] || `event_${Date.now()}`;
    const event = payload.event;

    // Atomically claim the event before applying any payment side effects.
    const payloadHash = crypto.createHash('sha256').update(rawBody).digest('hex');
    try {
      claimedEvent = await WebhookEvent.create({
        eventId,
        eventType: event,
        provider: 'RAZORPAY',
        razorpayOrderId: payload.payload?.payment?.entity?.order_id,
        razorpayPaymentId: payload.payload?.payment?.entity?.id,
        payloadHash,
        status: 'PROCESSING'
      });
    } catch (err) {
      if (err?.code === 11000) {
        return res.json({ status: 'ok', message: 'Webhook event already acknowledged.' });
      }
      throw err;
    }

    if (event === 'payment.captured' && payload.payload?.payment?.entity) {
      const entity = payload.payload.payment.entity;
      const rzpOrderId = entity.order_id;
      const rzpPaymentId = entity.id;

      const order = await RentalOrder.findOne({ razorpayOrderId: rzpOrderId });
      if (order && order.status === 'PAYMENT_PENDING') {
        await confirmOrderPayment({
          orderId: order._id,
          razorpayOrderId: rzpOrderId,
          razorpayPaymentId: rzpPaymentId,
          razorpaySignature: signature,
          paymentMethod: 'RAZORPAY_WEBHOOK',
          provider: 'RAZORPAY'
        });
      }
    }

    await WebhookEvent.updateOne(
      { _id: claimedEvent._id },
      { $set: { status: 'PROCESSED', processingResult: 'SUCCESS', processedAt: new Date() } }
    );

    res.json({ status: 'ok' });
  } catch (err) {
    if (claimedEvent) {
      await WebhookEvent.updateOne(
        { _id: claimedEvent._id },
        { $set: { status: 'FAILED', errorMessage: err.message, processedAt: new Date() } }
      ).catch(() => {});
    }
    console.error('[Webhook Processing Error]', err);
    res.status(500).json({ message: err.message });
  }
}

// GET /api/payment/invoices (Customer Invoices)
router.get('/invoices', authMiddleware, async (req, res) => {
  try {
    const { role, id } = req.user;
    let query = {};

    if (role === 'CUSTOMER') {
      query = { customer: id };
    }

    const payments = await Payment.find(query).populate('order').sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
