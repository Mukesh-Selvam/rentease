import express from 'express';
import RentalBilling from '../models/RentalBilling.js';
import RentalOrder from '../models/RentalOrder.js';
import Payment from '../models/Payment.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/billing (Get user's monthly schedules)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { role, id } = req.user;
    let query = {};

    if (role === 'CUSTOMER') {
      query = { customer: id };
    } else if (role === 'VENDOR') {
      query = { vendor: id };
    }

    const bills = await RentalBilling.find(query).populate('order').sort({ dueDate: 1 });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/billing/:id/pay (Pay monthly rent)
router.post('/:id/pay', authMiddleware, async (req, res) => {
  try {
    const bill = await RentalBilling.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Billing record not found.' });

    if (req.user.role === 'CUSTOMER' && bill.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    bill.status = 'PAID';
    bill.paidAt = new Date();
    bill.razorpayPaymentId = `pay_rent_${Date.now()}`;
    await bill.save();

    // Create payment receipt
    await Payment.create({
      order: bill.order,
      customer: bill.customer,
      razorpayOrderId: `order_rent_${Date.now()}`,
      razorpayPaymentId: bill.razorpayPaymentId,
      amount: bill.amount + bill.lateFee,
      type: 'MONTHLY_RENT',
      status: 'SUCCESS',
      invoiceNumber: `INV-RENT-${Date.now()}`
    });

    // Update next payment date on order
    const nextBill = await RentalBilling.findOne({ order: bill.order, status: 'PENDING' }).sort({ dueDate: 1 });
    if (nextBill) {
      await RentalOrder.findByIdAndUpdate(bill.order, { nextPaymentDate: nextBill.dueDate });
    }

    res.json({ message: 'Monthly rent paid successfully!', bill });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
