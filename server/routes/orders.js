import express from 'express';
import Razorpay from 'razorpay';
import mongoose from 'mongoose';
import RentalOrder from '../models/RentalOrder.js';
import Product from '../models/Product.js';
import ServiceArea from '../models/ServiceArea.js';
import Coupon from '../models/Coupon.js';
import AuditLog from '../models/AuditLog.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { calculateOrderPricing } from '../utils/pricing.js';
import { isMockPaymentsEnabled } from '../utils/paymentMode.js';

const router = express.Router();

const VALID_TRANSITIONS = {
  PAYMENT_PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['DELIVERY_SCHEDULED', 'DISPATCHED', 'CANCELLED'],
  DELIVERY_SCHEDULED: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['OUT_FOR_DELIVERY', 'DELIVERED', 'ACTIVE'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'ACTIVE'],
  DELIVERED: ['ACTIVE'],
  ACTIVE: ['RETURN_REQUESTED'],
  RETURN_REQUESTED: ['PICKUP_SCHEDULED', 'RETURNED'],
  PICKUP_SCHEDULED: ['RETURNED'],
  RETURNED: ['INSPECTED', 'REFUNDED'],
  INSPECTED: ['REFUNDED'],
  REFUNDED: [],
  CANCELLED: []
};

// GET /api/orders (List orders isolated by Role)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { role, id } = req.user;
    let query = {};

    if (role === 'CUSTOMER') {
      query = { customer: id };
    } else if (role === 'VENDOR') {
      query = { vendor: id };
    } else if (role === 'ADMIN') {
      query = {};
    }

    const orders = await RentalOrder.find(query).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/:id (Get order details with strict role authorization check)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await RentalOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Rental order not found' });

    // Strict Authorization Rules
    if (req.user.role === 'CUSTOMER' && order.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: Access denied to another customer's order." });
    }
    if (req.user.role === 'VENDOR' && order.vendor.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: Access denied to another vendor's order." });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/orders/quote (SERVER-SIDE PRICING QUOTE BEFORE PAYMENT)
router.post('/quote', authMiddleware, async (req, res) => {
  try {
    const { productId, tenureMonths = 12, city = 'Bengaluru', couponCode = '' } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found.' });

    const serviceArea = await ServiceArea.findOne({ city: new RegExp(`^${city}$`, 'i') });

    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true });
    }

    const pricing = calculateOrderPricing({
      product,
      tenureMonths: Number(tenureMonths),
      serviceArea,
      coupon
    });

    res.json({
      quote: pricing,
      display: {
        monthlyRent: pricing.monthlyRentRupees,
        deposit: pricing.depositRupees,
        deliveryFee: pricing.deliveryFeeRupees,
        taxes: pricing.taxRupees,
        discount: pricing.discountRupees,
        totalPaidToday: pricing.totalUpfrontRupees
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/orders (REAL RAZORPAY ORDER CREATION & INITIALIZATION)
router.post('/', authMiddleware, requireRole('CUSTOMER'), async (req, res) => {
  try {
    const {
      productId,
      tenureMonths = 12,
      deliveryDate,
      deliverySlot = 'Morning (9:00 AM – 12:00 PM)',
      deliveryAddress,
      city = 'Bengaluru',
      pincode = '',
      paymentMethod = 'RAZORPAY',
      couponCode = ''
    } = req.body;

    if (!productId || !deliveryDate || !deliveryAddress) {
      return res.status(400).json({ message: 'Product ID, delivery date, and delivery address are required.' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found.' });

    if (product.availableStock <= 0) {
      return res.status(400).json({ message: 'Product is currently out of stock.' });
    }

    const serviceArea = await ServiceArea.findOne({ city: new RegExp(`^${city}$`, 'i') });

    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true });
    }

    // SERVER-SIDE PRICING COMPUTATION (Integer Paise Precision)
    const pricing = calculateOrderPricing({
      product,
      tenureMonths: Number(tenureMonths),
      serviceArea,
      coupon
    });

    const rentalCode = `RE-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const rzpKeyId = process.env.RAZORPAY_KEY_ID;
    const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET;
    const isProduction = process.env.NODE_ENV === 'production';
    const enableMockPayments = isMockPaymentsEnabled();

    let razorpayOrderId = null;

    const isPlaceholderKey = !rzpKeyId || !rzpKeySecret || rzpKeyId.includes('placeholder') || rzpKeyId.includes('your_razorpay');

    // Real Razorpay Order Creation via SDK
    if (rzpKeyId && rzpKeySecret && !isPlaceholderKey) {
      try {
        const razorpayInstance = new Razorpay({
          key_id: rzpKeyId,
          key_secret: rzpKeySecret
        });

        const rzpOrder = await razorpayInstance.orders.create({
          amount: pricing.totalUpfrontPaise,
          currency: 'INR',
          receipt: rentalCode,
          notes: {
            customerName: req.user.name,
            productTitle: product.title
          }
        });

        razorpayOrderId = rzpOrder.id;
      } catch (rzpErr) {
        console.error('[Razorpay Order Creation Failed]', rzpErr);
        if (isProduction) {
          return res.status(500).json({ message: 'Razorpay order creation failed: ' + rzpErr.message });
        }
      }
    }

    if (!razorpayOrderId) {
      if (!enableMockPayments) {
        return res.status(503).json({
          message: 'Payment service is unavailable. Razorpay is not configured.'
        });
      }
      razorpayOrderId = `order_sim_${Date.now()}`;
    }

    const newOrder = await RentalOrder.create({
      rentalCode,
      customer: req.user.id,
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerPhone: req.user.phone,
      product: product._id,
      productTitle: product.title,
      productCategory: product.category,
      productImage: product.images && product.images.length > 0 ? product.images[0] : '',
      vendor: product.vendor,
      tenureMonths: Number(tenureMonths),
      monthlyRent: pricing.monthlyRentRupees,
      deposit: pricing.depositRupees,
      deliveryFee: pricing.deliveryFeeRupees,
      taxes: pricing.taxRupees,
      totalPaidToday: pricing.totalUpfrontRupees,
      deliveryDate,
      deliverySlot,
      deliveryAddress,
      city,
      pincode,
      status: 'PAYMENT_PENDING',
      isStockDecremented: false,
      paymentMethod,
      razorpayOrderId,
      trackingTimeline: [
        {
          label: 'Order Placed',
          description: 'Payment initialized',
          timestamp: new Date().toISOString(),
          completed: true,
          current: true
        }
      ]
    });

    res.status(201).json({
      order: newOrder,
      razorpayOrderId,
      amountPaise: pricing.totalUpfrontPaise,
      currency: 'INR',
      razorpayKeyId: rzpKeyId || null,
      enableMockPayments
    });
  } catch (err) {
    console.error('[Order Create Error]', err);
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/orders/:id/status (TRANSACTIONAL ORDER STATUS TRANSITIONS WITH SAFE RESTOCKING & AUDIT LOGS)
router.put('/:id/status', authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    let updatedOrder = null;

    await session.withTransaction(async () => {
      const { status, reason } = req.body;
      const order = await RentalOrder.findById(req.params.id).session(session);
      if (!order) {
        throw new Error('Order not found.');
      }

      // Role Permission Checks
      if (req.user.role === 'CUSTOMER') {
        if (status !== 'CANCELLED' && status !== 'RETURN_REQUESTED') {
          throw new Error('Forbidden: Customers can only request cancellation or return.');
        }
      }

      if (req.user.role === 'VENDOR' && order.vendor.toString() !== req.user.id) {
        throw new Error("Forbidden: You can only update your own vendor orders.");
      }

      // State Transition Map Validation
      const allowed = VALID_TRANSITIONS[order.status] || [];
      if (!allowed.includes(status)) {
        throw new Error(`Invalid status transition from ${order.status} to ${status}. Allowed: ${allowed.join(', ') || 'None'}`);
      }

      const previousStatus = order.status;

      // Restock ONLY if stock was previously decremented upon verified payment and isStockDecremented is true
      if ((status === 'CANCELLED' || status === 'RETURNED') && order.isStockDecremented) {
        const restockedOrder = await RentalOrder.findOneAndUpdate(
          { _id: order._id, isStockDecremented: true },
          { $set: { isStockDecremented: false } },
          { session, new: true }
        );

        if (restockedOrder) {
          await Product.findOneAndUpdate(
            { _id: order.product, rentedStock: { $gte: 1 } },
            { $inc: { availableStock: 1, rentedStock: -1 } },
            { session, new: true }
          );
        }
      }

      order.status = status;
      order.trackingTimeline.push({
        label: `Status: ${status}`,
        description: `Transitioned by ${req.user.role}`,
        timestamp: new Date().toISOString(),
        completed: true,
        current: true
      });

      await order.save({ session });

      // Create Audit Log Entry
      await AuditLog.create(
        [{
          action: 'ORDER_STATUS_UPDATE',
          actor: req.user.id,
          actorRole: req.user.role,
          targetModel: 'RentalOrder',
          targetId: order._id.toString(),
          previousState: { status: previousStatus },
          newState: { status },
          reason: reason || `Order status updated to ${status}`
        }],
        { session }
      );

      updatedOrder = order;
    });

    res.json(updatedOrder);
  } catch (err) {
    res.status(400).json({ message: err.message });
  } finally {
    session.endSession();
  }
});

export default router;
