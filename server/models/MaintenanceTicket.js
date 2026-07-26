import mongoose from 'mongoose';

const maintenanceTicketSchema = new mongoose.Schema(
  {
    ticketCode: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
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
    customerName: String,
    customerPhone: String,
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    productTitle: String,
    technicianName: String,
    technicianPhone: String,
    issueType: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
      index: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'PENDING',
      index: true
    },
    photos: [{
      type: String
    }],
    slaHours: {
      type: Number,
      default: 24
    },
    scheduledAppointment: String,
    resolutionNotes: String,
    resolvedAt: Date
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

const MaintenanceTicket = mongoose.model('MaintenanceTicket', maintenanceTicketSchema);
export default MaintenanceTicket;
