import mongoose from 'mongoose';

const trackingEventSchema = new mongoose.Schema({
  label: String,
  description: String,
  timestamp: String,
  completed: Boolean,
  current: Boolean
}, { _id: false });

const returnRequestSchema = new mongoose.Schema({
  requestedDate: String,
  slot: String,
  reason: String,
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING'
  },
  partnerId: String,
  partnerName: String,
  refundAmount: Number,
  deductionAmount: Number,
  deductionReason: String
}, { _id: false });

const extensionRequestSchema = new mongoose.Schema({
  additionalMonths: Number,
  requestedDate: String,
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  newEndDate: String
}, { _id: false });

const relocationRequestSchema = new mongoose.Schema({
  newAddress: String,
  newCity: String,
  newPincode: String,
  preferredDate: String,
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'],
    default: 'PENDING'
  }
}, { _id: false });

const rentalOrderSchema = new mongoose.Schema(
  {
    rentalCode: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    customerName: String,
    customerEmail: String,
    customerPhone: String,

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    productTitle: String,
    productCategory: String,
    productImage: String,

    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    tenureMonths: {
      type: Number,
      required: true,
      enum: [3, 6, 9, 12, 24]
    },
    monthlyRent: { type: Number, required: true },
    deposit: { type: Number, required: true },
    deliveryFee: { type: Number, default: 499 },
    taxes: { type: Number, default: 0 },
    totalPaidToday: { type: Number, required: true },

    deliveryDate: { type: String, required: true },
    deliveryAddress: { type: String, required: true },
    city: { type: String, required: true, index: true },
    pincode: { type: String, default: '', index: true },
    pickupPreference: { type: String, default: 'Standard Doorstep Delivery' },

    status: {
      type: String,
      enum: [
        'PAYMENT_PENDING',
        'CONFIRMED',
        'DELIVERY_SCHEDULED',
        'DISPATCHED',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'ACTIVE',
        'RETURN_REQUESTED',
        'PICKUP_SCHEDULED',
        'RETURNED',
        'INSPECTED',
        'REFUNDED',
        'CANCELLED'
      ],
      default: 'CONFIRMED',
      index: true
    },

    isStockDecremented: {
      type: Boolean,
      default: false
    },

    startDate: String,
    endDate: String,
    nextPaymentDate: String,

    deliverySlot: String,
    deliveryPartnerId: String,
    deliveryPartnerName: String,
    deliveryPartnerPhone: String,
    deliveryOTP: String,
    
    paymentMethod: {
      type: String,
      enum: ['UPI', 'CARD', 'NETBANKING', 'RAZORPAY', 'COD', 'Card', 'Net Banking', 'MOCK_DEV_PAYMENT', 'RAZORPAY_WEBHOOK'],
      default: 'UPI'
    },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String },

    trackingTimeline: [trackingEventSchema],
    returnRequest: returnRequestSchema,
    extensionRequest: extensionRequestSchema,
    relocationRequest: relocationRequestSchema
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

rentalOrderSchema.index({ createdAt: -1 });

const RentalOrder = mongoose.model('RentalOrder', rentalOrderSchema);
export default RentalOrder;
