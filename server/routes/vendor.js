import express from 'express';
import Product from '../models/Product.js';
import RentalOrder from '../models/RentalOrder.js';
import MaintenanceTicket from '../models/MaintenanceTicket.js';
import DamageClaim from '../models/DamageClaim.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Middleware: Ensure user is VENDOR or ADMIN
router.use(authMiddleware, requireRole(['VENDOR', 'ADMIN']));

// GET /api/vendor/analytics
router.get('/analytics', async (req, res) => {
  try {
    const vendorId = req.user.id;

    const products = await Product.find({ vendor: vendorId });
    const orders = await RentalOrder.find({ vendor: vendorId });
    const tickets = await MaintenanceTicket.find({ vendor: vendorId, status: { $ne: 'RESOLVED' } });

    const totalStock = products.reduce((acc, p) => acc + (p.totalStock || 0), 0);
    const availableStock = products.reduce((acc, p) => acc + (p.availableStock || 0), 0);
    const rentedStock = products.reduce((acc, p) => acc + (p.rentedStock || 0), 0);

    const activeRentalsCount = orders.filter(o => ['ACTIVE', 'CONFIRMED', 'DELIVERED'].includes(o.status)).length;
    const totalRevenue = orders
      .filter(o => o.status !== 'CANCELLED' && o.status !== 'PAYMENT_PENDING')
      .reduce((acc, o) => acc + (o.totalPaidToday || 0), 0);

    const utilizationRate = totalStock > 0 ? Math.round((rentedStock / totalStock) * 100) : 0;

    res.json({
      kpis: {
        totalProducts: products.length,
        totalStock,
        availableStock,
        rentedStock,
        activeRentalsCount,
        totalRevenue,
        utilizationRate,
        openTicketsCount: tickets.length
      },
      products,
      recentOrders: orders.slice(0, 10),
      openTickets: tickets
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/vendor/products
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find({ vendor: req.user.id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/vendor/orders
router.get('/orders', async (req, res) => {
  try {
    const orders = await RentalOrder.find({ vendor: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/vendor/inspections (Submit damage claim / deposit deduction)
router.post('/inspections', async (req, res) => {
  try {
    const { orderId, damageDescription, deductionAmount, checklist } = req.body;

    const order = await RentalOrder.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.vendor.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const deduction = Number(deductionAmount) || 0;
    const refundAmount = Math.max(0, order.deposit - deduction);

    const claim = await DamageClaim.create({
      order: order._id,
      vendor: req.user.id,
      customer: order.customer,
      customerName: order.customerName,
      productTitle: order.productTitle,
      inspectionDate: new Date().toISOString().split('T')[0],
      checklist: checklist || {},
      damageDescription: damageDescription || 'Return inspection completed.',
      deductionAmount: deduction,
      refundAmount,
      status: 'APPROVED'
    });

    order.status = 'INSPECTED';
    
    // Restock product stock safely if stock was still decremented
    if (order.isStockDecremented) {
      order.isStockDecremented = false;
      await Product.findOneAndUpdate(
        { _id: order.product, rentedStock: { $gte: 1 } },
        { $inc: { availableStock: 1, rentedStock: -1 } }
      );
    }
    await order.save();

    res.status(201).json({ message: 'Return inspection submitted and deposit calculated.', claim });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
