import express from 'express';
import Coupon from '../models/Coupon.js';

const router = express.Router();

// GET /api/coupons
router.get('/', async (req, res) => {
  try {
    const coupons = await Coupon.find({ active: true, expiryDate: { $gte: new Date() } });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/coupons/validate
router.post('/validate', async (req, res) => {
  try {
    const { code } = req.body;
    const orderAmount = Number(req.body.orderAmount || req.body.orderTotal || 0);

    if (!code) return res.status(400).json({ message: 'Coupon code is required.' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true });
    if (!coupon) {
      return res.status(404).json({ message: 'Invalid or expired coupon code.' });
    }

    if (new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({ message: 'This coupon code has expired.' });
    }

    if (orderAmount > 0 && orderAmount < coupon.minOrderValue) {
      return res.status(400).json({ message: `Minimum order value of ₹${coupon.minOrderValue} required for this coupon.` });
    }

    let discount = 0;
    if (coupon.discountType === 'FLAT') {
      discount = coupon.discountValue;
    } else {
      discount = Math.min(coupon.maxDiscount, Math.round((orderAmount * coupon.discountValue) / 100));
    }

    res.json({
      valid: true,
      code: coupon.code,
      discount,
      coupon: {
        code: coupon.code,
        discountValue: discount,
        discountType: coupon.discountType
      },
      message: `Coupon ${coupon.code} applied successfully! Discount ₹${discount}`
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
