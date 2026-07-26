import mongoose from 'mongoose';

const webhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    eventType: {
      type: String,
      required: true,
      index: true
    },
    provider: {
      type: String,
      enum: ['RAZORPAY'],
      default: 'RAZORPAY',
      required: true
    },
    razorpayOrderId: {
      type: String,
      index: true
    },
    razorpayPaymentId: {
      type: String,
      index: true
    },
    status: {
      type: String,
      enum: ['PROCESSING', 'PROCESSED', 'FAILED'],
      default: 'PROCESSING',
      index: true
    },
    payloadHash: {
      type: String
    },
    processingResult: {
      type: String
    },
    errorMessage: {
      type: String,
      default: ''
    },
    processedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('WebhookEvent', webhookEventSchema);
