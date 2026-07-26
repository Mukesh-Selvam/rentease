import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RentalOrder',
      required: true,
      index: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    provider: {
      type: String,
      enum: ['RAZORPAY', 'MOCK'],
      required: true,
      index: true
    },
    providerOrderId: {
      type: String,
      required: true,
      index: true
    },
    providerPaymentId: {
      type: String,
      sparse: true,
      index: true
    },
    razorpayOrderId: {
      type: String,
      index: true
    },
    razorpayPaymentId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    razorpaySignature: {
      type: String
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    type: {
      type: String,
      enum: ['DEPOSIT', 'MONTHLY_RENT', 'REFUND', 'UPFRONT_TOTAL'],
      default: 'UPFRONT_TOTAL'
    },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
      index: true
    },
    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    paymentMethod: {
      type: String,
      default: 'RAZORPAY'
    },
    failureReason: {
      type: String,
      default: ''
    }
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

paymentSchema.index({ order: 1, status: 1 });
paymentSchema.index({ order: 1, type: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'SUCCESS', type: 'UPFRONT_TOTAL' } });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
