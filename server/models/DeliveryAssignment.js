import mongoose from 'mongoose';

const deliveryAssignmentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RentalOrder',
      required: true,
      index: true
    },
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryPartner',
      index: true
    },
    deliveryPartnerName: String,
    deliveryPartnerPhone: String,
    type: {
      type: String,
      enum: ['DELIVERY', 'PICKUP'],
      default: 'DELIVERY'
    },
    scheduledDate: {
      type: String,
      required: true
    },
    timeSlot: {
      type: String,
      default: 'Morning (9:00 AM – 12:00 PM)'
    },
    proofOfDeliveryOtp: {
      type: String
    },
    status: {
      type: String,
      enum: ['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'FAILED'],
      default: 'PENDING',
      index: true
    },
    deliveredAt: Date
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

const DeliveryAssignment = mongoose.model('DeliveryAssignment', deliveryAssignmentSchema);
export default DeliveryAssignment;
