import express from 'express';
import RentalOrder from '../models/RentalOrder.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/rentals (Compatibility route for /api/orders)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { role, id } = req.user;
    let query = {};

    if (role === 'CUSTOMER') {
      query = { customer: id };
    } else if (role === 'VENDOR') {
      query = { vendor: id };
    }

    const orders = await RentalOrder.find(query).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/rentals/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await RentalOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Rental not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
