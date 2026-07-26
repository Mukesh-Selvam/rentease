import mongoose from 'mongoose';

const returnPickupSchema = new mongoose.Schema(
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
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    requestedDate: {
      type: String,
      required: true
    },
    timeSlot: {
      type: String,
      default: 'Morning (9:00 AM – 12:00 PM)'
    },
    reason: {
      type: String,
      default: 'Subscription Completion / Relocation'
    },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'PICKED_UP', 'INSPECTED', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
      index: true
    },
    deliveryPartnerName: String,
    deliveryPartnerPhone: String,
    pickedUpAt: Date
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

const ReturnPickup = mongoose.model('ReturnPickup', returnPickupSchema);
export default ReturnPickup;
