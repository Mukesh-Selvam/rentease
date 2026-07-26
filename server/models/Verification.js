import mongoose from 'mongoose';

const verificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    // Government ID fields
    idType: {
      type: String,
      enum: ['aadhaar', 'pan', 'passport', 'voter_id', 'driving_license'],
      required: true
    },
    idNumber: {
      type: String,
      required: true,
      trim: true
    },
    // Personal details for cross-verification
    fullName: { type: String, required: true, trim: true },
    dateOfBirth: { type: String, required: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    // Location coordinates from live map
    latitude:  { type: Number, default: null },
    longitude: { type: Number, default: null },
    // Document image (base64 or URL)
    documentImage: { type: String, default: '' },
    selfieImage:   { type: String, default: '' },
    // Verification status
    status: {
      type: String,
      enum: ['pending', 'under_review', 'verified', 'rejected'],
      default: 'pending'
    },
    rejectionReason: { type: String, default: '' },
    verifiedAt: { type: Date, default: null },
    // Trust score 0–100
    trustScore: { type: Number, default: 0, min: 0, max: 100 },
    // Checklist flags
    checks: {
      idFormatValid:    { type: Boolean, default: false },
      nameMatched:      { type: Boolean, default: false },
      addressConfirmed: { type: Boolean, default: false },
      locationPinned:   { type: Boolean, default: false },
      selfieUploaded:   { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

const Verification = mongoose.model('Verification', verificationSchema);
export default Verification;
