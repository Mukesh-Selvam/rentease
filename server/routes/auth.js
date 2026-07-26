import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { authMiddleware, getJwtSecret } from '../middleware/auth.js';
import { recordLoginFailure, recordLoginSuccess, checkAccountLockout } from '../middleware/security.js';

const router = express.Router();

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      city: user.city
    },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function setTokenCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

// POST /api/auth/register (PUBLIC REGISTRATION - CUSTOMER ONLY)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, city } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    if (role === 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden: Admin accounts cannot be created via public registration.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email address.' });
    }

    const assignedRole = role === 'VENDOR' ? 'VENDOR' : 'CUSTOMER';
    const isVendorApproved = assignedRole === 'VENDOR' ? false : true;

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: assignedRole,
      phone: phone || '',
      city: city || 'Bengaluru',
      isVendorApproved,
      status: 'ACTIVE'
    });

    const token = generateToken(user);
    setTokenCookie(res, token);

    res.status(201).json({
      message: assignedRole === 'VENDOR' ? 'Vendor application submitted! Pending Admin verification.' : 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        city: user.city,
        addresses: user.addresses,
        kycStatus: user.kycStatus,
        isVendorApproved: user.isVendorApproved
      }
    });
  } catch (err) {
    console.error('[Registration Error]', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login (AUTHENTICATION & SECURE SECRET ADMIN LOGIN)
router.post('/login', checkAccountLockout, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user) {
      recordLoginFailure(cleanEmail);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.status === 'INACTIVE') {
      return res.status(403).json({ message: 'Account is deactivated. Please contact support.' });
    }

    const isMatch = await user.verifyPassword(password);
    if (!isMatch) {
      recordLoginFailure(cleanEmail);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    recordLoginSuccess(cleanEmail);

    const token = generateToken(user);
    setTokenCookie(res, token);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        city: user.city,
        avatar: user.avatar,
        addresses: user.addresses,
        kycStatus: user.kycStatus,
        isVendorApproved: user.isVendorApproved
      }
    });
  } catch (err) {
    console.error('[Login Error]', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/auth/profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, city, avatar, addresses } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (city) user.city = city;
    if (avatar !== undefined) user.avatar = avatar;
    if (addresses) user.addresses = addresses;

    await user.save();
    res.json({ message: 'Profile updated successfully', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/kyc (SUBMIT KYC DOCUMENTATION)
router.post('/kyc', authMiddleware, async (req, res) => {
  try {
    const { documentType, documentUrl } = req.body;
    if (!documentUrl) {
      return res.status(400).json({ message: 'Document image/URL is required.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.kycStatus = 'PENDING';
    user.kycDocumentUrl = documentUrl;
    await user.save();

    res.json({ message: 'KYC document submitted successfully. Under Admin verification.', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/forgot-password (GENERATE 1-HR SINGLE-USE CRYPTO RESET TOKEN)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email address is required.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always respond with success to prevent account enumeration attacks
    if (!user) {
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    res.json({
      message: 'Password reset link sent.',
      resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/reset-password (TOKEN VERIFICATION & PASSWORD RESET)
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Reset token and new password are required.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: 'Password reset successful! You can now log in with your new password.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
