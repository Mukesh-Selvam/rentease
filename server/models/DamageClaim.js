import mongoose from 'mongoose';

const damageClaimSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RentalOrder',
      required: true,
      index: true
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    customerName: String,
    productTitle: String,
    inspectionDate: String,
    checklist: {
      structureIntact: { type: Boolean, default: true },
      electronicsWorking: { type: Boolean, default: true },
      cleanlinessSatisfactory: { type: Boolean, default: true },
      allAccessoriesPresent: { type: Boolean, default: true }
    },
    damageDescription: {
      type: String,
      default: 'No visible damages observed.'
    },
    photos: [{
      type: String
    }],
    deductionAmount: {
      type: Number,
      default: 0
    },
    refundAmount: {
      type: Number,
      default: 0
    },
    disputeReason: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'DISPUTED', 'RESOLVED'],
      default: 'PENDING',
      index: true
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

const DamageClaim = mongoose.model('DamageClaim', damageClaimSchema);
export default DamageClaim;
