import express from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import RentalOrder from '../models/RentalOrder.js';
import ServiceArea from '../models/ServiceArea.js';
import Coupon from '../models/Coupon.js';
import MaintenanceTicket from '../models/MaintenanceTicket.js';
import DamageClaim from '../models/DamageClaim.js';
import Payment from '../models/Payment.js';
import AuditLog from '../models/AuditLog.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Middleware: Ensure user is ADMIN
router.use(authMiddleware, requireRole('ADMIN'));

// CSV Formula Injection Sanitizer
function sanitizeCsvField(val) {
  if (val === null || val === undefined) return '""';
  let str = String(val).replace(/"/g, '""');
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  return `"${str}"`;
}

// GET /api/admin/analytics
router.get('/analytics', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'CUSTOMER' });
    const totalVendors = await User.countDocuments({ role: 'VENDOR' });

    const products = await Product.find();
    const orders = await RentalOrder.find();
    const payments = await Payment.find({ status: 'SUCCESS' });
    const openTickets = await MaintenanceTicket.countDocuments({ status: { $ne: 'RESOLVED' } });
    const pendingClaims = await DamageClaim.countDocuments({ status: 'PENDING' });

    // GMV & MRR calculation
    const gmv = orders
      .filter(o => o.status !== 'CANCELLED' && o.status !== 'PAYMENT_PENDING')
      .reduce((sum, o) => sum + (o.totalPaidToday || 0), 0);

    const activeOrders = orders.filter(o => ['ACTIVE', 'CONFIRMED', 'DISPATCHED'].includes(o.status));
    const mrr = activeOrders.reduce((sum, o) => sum + (o.monthlyRent || 0), 0);

    const totalStock = products.reduce((sum, p) => sum + (p.totalStock || 0), 0);
    const rentedStock = products.reduce((sum, p) => sum + (p.rentedStock || 0), 0);
    const utilizationRate = totalStock > 0 ? Math.round((rentedStock / totalStock) * 100) : 0;

    res.json({
      metrics: {
        totalUsers,
        totalCustomers,
        totalVendors,
        totalProducts: products.length,
        activeRentals: activeOrders.length,
        gmv,
        mrr,
        utilizationRate,
        openTickets,
        pendingClaims
      },
      recentOrders: orders.slice(0, 10),
      recentPayments: payments.slice(0, 10)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { role } = req.query;
    const query = role ? { role: role.toUpperCase() } : {};
    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/admin/users/:id/status
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { role, status, kycStatus, isVendorApproved } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (role && ['CUSTOMER', 'VENDOR', 'ADMIN'].includes(role.toUpperCase())) {
      user.role = role.toUpperCase();
    }
    if (status && ['ACTIVE', 'INACTIVE'].includes(status.toUpperCase())) {
      user.status = status.toUpperCase();
    } else if (!status && !role && !kycStatus) {
      user.status = user.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
    }
    if (kycStatus) user.kycStatus = kycStatus;
    if (isVendorApproved !== undefined) user.isVendorApproved = Boolean(isVendorApproved);

    await user.save();

    await AuditLog.create({
      action: 'UPDATE_USER_STATUS',
      performedBy: req.user.id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      targetResource: `User:${user._id}`,
      details: { role: user.role, status: user.status, kycStatus: user.kycStatus }
    });

    res.json({ message: 'User updated successfully', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/pending-listings (Vendor Listings awaiting moderation)
router.get('/pending-listings', async (req, res) => {
  try {
    const listings = await Product.find({ adminStatus: 'PENDING' }).sort({ createdAt: -1 });
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/admin/listings/:id/approve
router.patch('/listings/:id/approve', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { adminStatus: 'APPROVED' },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: 'Listing not found' });
    res.json({ message: 'Listing approved & published!', product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/admin/listings/:id/reject
router.patch('/listings/:id/reject', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { adminStatus: 'REJECTED' },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: 'Listing not found' });
    res.json({ message: 'Listing rejected', product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/claims
router.get('/claims', async (req, res) => {
  try {
    const claims = await DamageClaim.find().sort({ createdAt: -1 });
    res.json(claims);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/admin/claims/:id
router.patch('/claims/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const claim = await DamageClaim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: 'Claim not found' });

    if (status) claim.status = status;
    await claim.save();

    res.json({ message: `Damage claim updated to ${claim.status}`, claim });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/service-areas
router.get('/service-areas', async (req, res) => {
  try {
    const areas = await ServiceArea.find().sort({ city: 1 });
    res.json(areas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/service-areas
router.post('/service-areas', async (req, res) => {
  try {
    const { city, state, pincodes, deliveryFee, minLeadTimeDays, slots } = req.body;
    if (!city || !state) return res.status(400).json({ message: 'City and state are required.' });

    const area = await ServiceArea.create({
      city,
      state,
      pincodes: pincodes || '',
      deliveryFee: Number(deliveryFee) || 499,
      minLeadTimeDays: Number(minLeadTimeDays) || 2,
      slots: slots || ['Morning', 'Afternoon', 'Evening'],
      active: true
    });

    res.status(201).json(area);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/service-areas/:id
router.put('/service-areas/:id', async (req, res) => {
  try {
    const area = await ServiceArea.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(area);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/coupons
router.get('/coupons', async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/coupons
router.post('/coupons', async (req, res) => {
  try {
    const { code, description, discountType, discountValue, minOrderValue, maxDiscount, expiryDate } = req.body;
    if (!code || !discountValue) return res.status(400).json({ message: 'Code and discount value required.' });

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      description,
      discountType: discountType || 'PERCENTAGE',
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue) || 0,
      maxDiscount: Number(maxDiscount) || 1000,
      expiryDate: expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    res.status(201).json(coupon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/export/:type (Safe CSV Data Export preventing Formula Injection)
router.get('/export/:type', async (req, res) => {
  try {
    const { type } = req.params;
    let data = '';
    let filename = `rentease_${type}_export.csv`;
    let headers = '';

    if (type === 'orders') {
      const orders = await RentalOrder.find();
      headers = 'RentalCode,CustomerName,ProductTitle,MonthlyRent,Deposit,Status,City,CreatedAt\n';
      data = orders.map(o => [
        sanitizeCsvField(o.rentalCode),
        sanitizeCsvField(o.customerName),
        sanitizeCsvField(o.productTitle),
        o.monthlyRent || 0,
        o.deposit || 0,
        sanitizeCsvField(o.status),
        sanitizeCsvField(o.city),
        sanitizeCsvField(o.createdAt)
      ].join(',')).join('\n');
    } else if (type === 'users') {
      const users = await User.find().select('-password');
      headers = 'ID,Name,Email,Role,City,Status,CreatedAt\n';
      data = users.map(u => [
        sanitizeCsvField(u._id),
        sanitizeCsvField(u.name),
        sanitizeCsvField(u.email),
        sanitizeCsvField(u.role),
        sanitizeCsvField(u.city),
        sanitizeCsvField(u.status),
        sanitizeCsvField(u.createdAt)
      ].join(',')).join('\n');
    } else {
      const products = await Product.find();
      headers = 'ID,Title,Category,MonthlyRent,TotalStock,AvailableStock,City\n';
      data = products.map(p => [
        sanitizeCsvField(p._id),
        sanitizeCsvField(p.title),
        sanitizeCsvField(p.category),
        p.monthlyRent || 0,
        p.totalStock || 0,
        p.availableStock || 0,
        sanitizeCsvField(p.city)
      ].join(',')).join('\n');
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(headers + data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
