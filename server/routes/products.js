import express from 'express';
import Product from '../models/Product.js';
import ServiceArea from '../models/ServiceArea.js';
import Review from '../models/Review.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/products/service-areas
router.get('/service-areas', async (req, res) => {
  try {
    const areas = await ServiceArea.find({ active: true });
    res.json(areas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const {
      category,
      type,
      search,
      minPrice,
      maxPrice,
      city,
      featured,
      sort = 'recommended',
      page = 1,
      limit = 50
    } = req.query;

    const query = { adminStatus: 'APPROVED' };

    // Category Filter Mapping (handles 'all', 'furniture', 'appliances', 'packages', or specific categories)
    if (category && category.toLowerCase() !== 'all') {
      const catLower = category.toLowerCase();
      if (catLower === 'furniture') {
        query.$or = [
          { category: { $regex: /furniture|beds|sofas|tables|chairs|desks|mattress/i } },
          { type: { $regex: /furniture|bed|sofa|table/i } }
        ];
      } else if (catLower === 'appliances') {
        query.$or = [
          { category: { $regex: /appliances|refrigerators|washing machines|tvs|fridge|ac|microwave/i } },
          { type: { $regex: /appliance|fridge|washing|tv/i } }
        ];
      } else if (catLower === 'packages') {
        query.$or = [
          { category: { $regex: /package|room/i } },
          { type: { $regex: /package/i } }
        ];
      } else {
        query.category = { $regex: new RegExp(`^${category}$`, 'i') };
      }
    }

    if (type) {
      query.type = { $regex: new RegExp(type, 'i') };
    }

    if (city && city.toLowerCase() !== 'all') {
      // Return products matching city OR default Bengaluru products
      const cityRegex = new RegExp(city, 'i');
      if (query.$or) {
        // Wrap existing $or and city filter together
        const existingOr = query.$or;
        delete query.$or;
        query.$and = [
          { $or: existingOr },
          { $or: [{ city: cityRegex }, { city: { $exists: false } }, { city: '' }] }
        ];
      } else {
        query.$or = [
          { city: cityRegex },
          { city: { $exists: false } },
          { city: '' }
        ];
      }
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    if (minPrice || maxPrice) {
      query.monthlyRent = {};
      if (minPrice) query.monthlyRent.$gte = Number(minPrice);
      if (maxPrice) query.monthlyRent.$lte = Number(maxPrice);
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      const searchOr = [
        { title: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { type: searchRegex }
      ];

      if (query.$and) {
        query.$and.push({ $or: searchOr });
      } else if (query.$or) {
        const existingOr = query.$or;
        delete query.$or;
        query.$and = [{ $or: existingOr }, { $or: searchOr }];
      } else {
        query.$or = searchOr;
      }
    }

    // Sort order
    let sortOption = {};
    if (sort === 'price_asc') sortOption = { monthlyRent: 1 };
    else if (sort === 'price_desc') sortOption = { monthlyRent: -1 };
    else if (sort === 'rating') sortOption = { rating: -1 };
    else if (sort === 'newest') sortOption = { createdAt: -1 };
    else sortOption = { isFeatured: -1, createdAt: -1 };

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    res.json({
      products,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (err) {
    console.error('[Get Products Error]', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const reviews = await Review.find({ product: product._id }).sort({ createdAt: -1 });

    res.json({
      ...product.toObject(),
      reviews
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/products (VENDOR or ADMIN)
router.post('/', authMiddleware, requireRole(['VENDOR', 'ADMIN']), async (req, res) => {
  try {
    const {
      title,
      category,
      type,
      description,
      monthlyRent,
      deposit,
      tenurePrices,
      images,
      totalStock,
      city,
      specifications,
      dimensions,
      condition,
      sku
    } = req.body;

    if (!title || !category || !monthlyRent || deposit === undefined) {
      return res.status(400).json({ message: 'Title, category, monthlyRent, and deposit are required.' });
    }

    const newProduct = await Product.create({
      vendor: req.user.id,
      vendorName: req.user.name,
      sku: sku || `SKU-${Date.now()}`,
      title,
      category,
      type: type || 'General',
      description: description || '',
      monthlyRent: Number(monthlyRent),
      deposit: Number(deposit),
      tenurePrices: tenurePrices || { '3': Math.round(monthlyRent * 1.2), '6': Math.round(monthlyRent * 1.1), '9': Math.round(monthlyRent * 1.05), '12': monthlyRent },
      images: images || ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop&q=80'],
      totalStock: Number(totalStock) || 5,
      availableStock: Number(totalStock) || 5,
      city: city || req.user.city || 'Bengaluru',
      specifications: specifications || {},
      dimensions: dimensions || 'Standard',
      condition: condition || 'LIKE_NEW',
      adminStatus: 'APPROVED'
    });

    res.status(201).json(newProduct);
  } catch (err) {
    console.error('[Create Product Error]', err);
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/products/:id (VENDOR or ADMIN)
router.put('/:id', authMiddleware, requireRole(['VENDOR', 'ADMIN']), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (req.user.role === 'VENDOR' && product.vendor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You can only edit your own products.' });
    }

    Object.assign(product, req.body);
    await product.save();

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/products/:id (VENDOR or ADMIN)
router.delete('/:id', authMiddleware, requireRole(['VENDOR', 'ADMIN']), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (req.user.role === 'VENDOR' && product.vendor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You can only delete your own products.' });
    }

    await product.deleteOne();
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
