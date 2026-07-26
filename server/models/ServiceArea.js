import mongoose from 'mongoose';

const serviceAreaSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    pincodes: {
      type: String,
      default: ''
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    },
    deliveryFee: {
      type: Number,
      default: 499
    },
    minLeadTimeDays: {
      type: Number,
      default: 2
    },
    slots: [{
      type: String
    }]
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

const ServiceArea = mongoose.model('ServiceArea', serviceAreaSchema);
export default ServiceArea;
