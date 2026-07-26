import mongoose from 'mongoose';

const rentalSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    tenantName: {
      type: String,
      required: true
    },
    landlordId: {
      type: mongoose.Schema.Types.Mixed, // accepts both String ('system') and ObjectId
      required: true
    },
    tenure: {
      type: Number,
      required: true,
      enum: [3, 6, 12]
    },
    monthlyPrice: {
      type: Number,
      required: true
    },
    deposit: {
      type: Number,
      required: true
    },
    totalPrice: {
      type: Number,
      required: true
    },
    deliveryDate: {
      type: String,
      default: ''
    },
    deliveryAddress: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'declined', 'completed', 'relocated'],
      default: 'pending'
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid'
    },
    paymentId: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      default: ''
    },
    renewalRequested: {
      type: Boolean,
      default: false
    }
  },
  { 
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        return ret;
      }
    },
    toObject: {
      virtuals: true
    }
  }
);

rentalSchema.index({ tenantId: 1 });
rentalSchema.index({ landlordId: 1 });
rentalSchema.index({ status: 1 });

const Rental = mongoose.model('Rental', rentalSchema);
export default Rental;
