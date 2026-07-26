import express from 'express';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/cart
router.get('/', authMiddleware, async (req, res) => {
  try {
    let cart = await Cart.findOne({ customer: req.user.id }).populate('items.product');
    if (!cart) {
      cart = await Cart.create({ customer: req.user.id, items: [] });
    }
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/cart
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { productId, tenureMonths = 6, deliveryCity = 'Bengaluru', deliveryDate = '' } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.availableStock <= 0) {
      return res.status(400).json({ message: 'Product is currently out of stock.' });
    }

    let cart = await Cart.findOne({ customer: req.user.id });
    if (!cart) {
      cart = new Cart({ customer: req.user.id, items: [] });
    }

    // Determine monthly rent from product tenurePrices map or default monthlyRent
    const tenureKey = String(tenureMonths);
    const tenurePricesMap = product.tenurePrices instanceof Map 
      ? Object.fromEntries(product.tenurePrices) 
      : product.tenurePrices || {};
    
    const calculatedRent = tenurePricesMap[tenureKey] || product.monthlyRent;

    // Check if item already in cart
    const existingIndex = cart.items.findIndex(item => item.product.toString() === productId);

    if (existingIndex > -1) {
      cart.items[existingIndex].tenureMonths = Number(tenureMonths);
      cart.items[existingIndex].monthlyRent = calculatedRent;
      cart.items[existingIndex].deposit = product.deposit;
      cart.items[existingIndex].deliveryCity = deliveryCity;
      cart.items[existingIndex].deliveryDate = deliveryDate;
    } else {
      cart.items.push({
        product: product._id,
        tenureMonths: Number(tenureMonths),
        monthlyRent: calculatedRent,
        deposit: product.deposit,
        deliveryCity,
        deliveryDate
      });
    }

    await cart.save();
    await cart.populate('items.product');

    res.json(cart);
  } catch (err) {
    console.error('[Add Cart Error]', err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/cart/:itemId
router.delete('/:itemId', authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ customer: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(item => item._id.toString() !== req.params.itemId && item.product.toString() !== req.params.itemId);
    await cart.save();
    await cart.populate('items.product');

    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/cart (Clear all)
router.delete('/', authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ customer: req.user.id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ message: 'Cart cleared successfully', items: [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
