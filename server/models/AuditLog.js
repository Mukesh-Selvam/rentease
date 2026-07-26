import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    actorRole: {
      type: String,
      enum: ['CUSTOMER', 'VENDOR', 'ADMIN', 'SYSTEM'],
      required: true
    },
    targetModel: {
      type: String,
      required: true
    },
    targetId: {
      type: String,
      required: true,
      index: true
    },
    previousState: {
      type: mongoose.Schema.Types.Mixed
    },
    newState: {
      type: mongoose.Schema.Types.Mixed
    },
    reason: {
      type: String,
      default: ''
    },
    ipAddress: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('AuditLog', auditLogSchema);
