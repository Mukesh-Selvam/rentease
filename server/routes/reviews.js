import express from 'express';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/reviews/:productId
router.get('/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/reviews
router.post('/', authMiddleware, requireRole('CUSTOMER'), async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    if (!productId || !rating || !comment) {
      return res.status(400).json({ message: 'Product ID, rating (1-5), and comment are required.' });
    }

    const review = await Review.create({
      product: productId,
      customer: req.user.id,
      customerName: req.user.name,
      rating: Number(rating),
      comment
    });

    // Recalculate product rating
    const allReviews = await Review.find({ product: productId });
    const avgRating = Number((allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1));
    
    await Product.findByIdAndUpdate(productId, {
      rating: avgRating,
      reviewCount: allReviews.length
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
