import mongoose from 'mongoose';

const maintenanceSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    rentalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rental',
      default: null
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
      type: String,
      required: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'resolved', 'rejected'],
      default: 'pending'
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    technicianNotes: {
      type: String,
      default: ''
    },
    images: {
      type: [String],
      default: []
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

maintenanceSchema.index({ tenantId: 1 });
maintenanceSchema.index({ landlordId: 1 });
maintenanceSchema.index({ status: 1 });

const Maintenance = mongoose.model('Maintenance', maintenanceSchema);
export default Maintenance;
