import mongoose from 'mongoose';

const deliveryPartnerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    cities: [{
      type: String
    }],
    vehicleType: {
      type: String,
      default: 'Tempo (1.2 Ton)'
    },
    rating: {
      type: Number,
      default: 4.8
    },
    completedDeliveries: {
      type: Number,
      default: 150
    },
    avatar: {
      type: String,
      default: ''
    },
    active: {
      type: Boolean,
      default: true
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

const DeliveryPartner = mongoose.model('DeliveryPartner', deliveryPartnerSchema);
export default DeliveryPartner;
