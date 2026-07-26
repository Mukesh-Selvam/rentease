import express from 'express';
import Verification from '../models/Verification.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// ─── Validate ID format ───────────────────────────────────────────────────────
function validateIdNumber(type, number) {
  const patterns = {
    aadhaar:         /^\d{12}$/,
    pan:             /^[A-Z]{5}\d{4}[A-Z]$/,
    passport:        /^[A-Z][1-9]\d{7}$/,
    voter_id:        /^[A-Z]{3}\d{7}$/,
    driving_license: /^[A-Z]{2}\d{2}\s?\d{4}\d{7}$/
  };
  const pattern = patterns[type];
  return pattern ? pattern.test(number.trim().toUpperCase()) : false;
}

// ─── Calculate trust score based on completed checks ────────────────────────
function calcTrustScore(checks) {
  const weights = {
    idFormatValid:    25,
    nameMatched:      25,
    addressConfirmed: 20,
    locationPinned:   15,
    selfieUploaded:   15
  };
  let score = 0;
  for (const [key, val] of Object.entries(checks)) {
    if (val) score += weights[key] || 0;
  }
  return score;
}

// ─── POST /api/verify/submit ──────────────────────────────────────────────────
// Submit or update verification
router.post('/submit', auth, async (req, res) => {
  try {
    const {
      idType, idNumber, fullName, dateOfBirth,
      address, city, state, pincode,
      latitude, longitude,
      documentImage, selfieImage
    } = req.body;

    if (!idType || !idNumber || !fullName || !dateOfBirth || !address || !city || !state || !pincode) {
      return res.status(400).json({ message: 'All identity fields are required' });
    }

    // Validate ID format
    const idFormatValid = validateIdNumber(idType, idNumber);
    if (!idFormatValid) {
      return res.status(400).json({
        message: `Invalid ${idType.replace('_', ' ')} number format. Please double-check your ID.`
      });
    }

    // Get the user for name cross-check
    const user = await User.findById(req.user.id);
    const nameMatched = user &&
      fullName.trim().toLowerCase().includes(user.name.split(' ')[0].toLowerCase());

    const addressConfirmed = !!(address && city && state && pincode);
    const locationPinned   = latitude !== undefined && longitude !== undefined && latitude !== null;
    const selfieUploaded   = !!selfieImage;

    const checks = { idFormatValid, nameMatched, addressConfirmed, locationPinned, selfieUploaded };
    const trustScore = calcTrustScore(checks);

    // Determine status
    let status = 'pending';
    if (trustScore >= 85) status = 'under_review';
    if (trustScore === 100) status = 'under_review'; // Admin would verify manually

    const existing = await Verification.findOne({ userId: req.user.id });

    let verification;
    if (existing) {
      // Re-open rejected verifications
      if (existing.status === 'rejected') existing.status = 'pending';
      Object.assign(existing, {
        idType, idNumber, fullName, dateOfBirth,
        address, city, state, pincode,
        latitude: latitude || null,
        longitude: longitude || null,
        documentImage: documentImage || existing.documentImage,
        selfieImage: selfieImage || existing.selfieImage,
        checks, trustScore, status,
        rejectionReason: ''
      });
      verification = await existing.save();
    } else {
      verification = await Verification.create({
        userId: req.user.id,
        idType, idNumber, fullName, dateOfBirth,
        address, city, state, pincode,
        latitude: latitude || null,
        longitude: longitude || null,
        documentImage, selfieImage,
        checks, trustScore, status
      });
    }

    // If fully verified (simulated auto-verify for demo when score = 100)
    if (trustScore === 100) {
      await User.findByIdAndUpdate(req.user.id, { isVerified: true });
    }

    return res.json({
      message: trustScore === 100
        ? 'Verification submitted! Your account is now under review.'
        : `Verification saved. Trust score: ${trustScore}/100. Complete all steps to submit.`,
      trustScore,
      status: verification.status,
      checks
    });
  } catch (err) {
    console.error('Verification submit error:', err.message);
    return res.status(500).json({ message: 'Server error during verification' });
  }
});

// ─── GET /api/verify/status ──────────────────────────────────────────────────
router.get('/status', auth, async (req, res) => {
  try {
    const verification = await Verification.findOne({ userId: req.user.id });
    if (!verification) {
      return res.json({ verified: false, status: 'not_started', trustScore: 0, checks: {} });
    }
    return res.json({
      verified: verification.status === 'verified',
      status: verification.status,
      trustScore: verification.trustScore,
      checks: verification.checks,
      idType: verification.idType,
      fullName: verification.fullName,
      city: verification.city,
      state: verification.state,
      latitude: verification.latitude,
      longitude: verification.longitude,
      rejectionReason: verification.rejectionReason,
      verifiedAt: verification.verifiedAt,
      updatedAt: verification.updatedAt
    });
  } catch (err) {
    console.error('Verification status error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/verify/geocode?address=... (proxy to Nominatim) ────────────────
// Nominatim is a free OpenStreetMap geocoding service - no API key needed
router.get('/geocode', auth, async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) return res.status(400).json({ message: 'Address is required' });

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=in&limit=5`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'RentEase-App/1.0' }
    });
    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error('Geocode error:', err.message);
    return res.status(500).json({ message: 'Geocoding failed' });
  }
});

export default router;
