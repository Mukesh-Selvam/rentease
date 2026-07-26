import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    vendorName: {
      type: String,
      default: 'Urban Decor Logistics'
    },
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      index: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Beds', 'Sofas', 'Tables', 'Refrigerators', 'Washing Machines', 'TVs', 'Appliances', 'Furniture', 'Packages', 'furniture', 'appliances', 'packages'],
      index: true
    },
    type: {
      type: String,
      default: 'General'
    },
    description: {
      type: String,
      default: ''
    },
    specifications: {
      type: Map,
      of: String,
      default: {}
    },
    dimensions: {
      type: String,
      default: 'Standard'
    },
    condition: {
      type: String,
      enum: ['NEW', 'LIKE_NEW', 'GOOD', 'REFURBISHED'],
      default: 'LIKE_NEW'
    },
    monthlyRent: {
      type: Number,
      required: [true, 'Monthly rent is required'],
      min: 0,
      index: true
    },
    deposit: {
      type: Number,
      required: [true, 'Security deposit is required'],
      min: 0
    },
    tenurePrices: {
      type: Map,
      of: Number,
      default: { '3': 0, '6': 0, '12': 0 }
    },
    images: {
      type: [String],
      default: []
    },
    totalStock: {
      type: Number,
      required: true,
      min: 0,
      default: 1
    },
    availableStock: {
      type: Number,
      required: true,
      min: 0,
      default: 1
    },
    rentedStock: {
      type: Number,
      default: 0,
      min: 0
    },
    maintenanceStock: {
      type: Number,
      default: 0,
      min: 0
    },
    city: {
      type: String,
      default: 'Bengaluru',
      index: true
    },
    serviceablePincodes: {
      type: [String],
      default: []
    },
    rating: {
      type: Number,
      default: 4.8,
      min: 0,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 12
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    },
    adminStatus: {
      type: String,
      enum: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ARCHIVED'],
      default: 'APPROVED',
      index: true
    }
  },
  {
    timestamps: true
  }
);

productSchema.index({ category: 1, adminStatus: 1, city: 1 });
productSchema.index({ title: 'text', description: 'text', category: 'text' });

export default mongoose.model('Product', productSchema);
