const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const Admin = require('../models/Admin.model');
const AuditLog = require('../models/AuditLog.model');
const OTP = require('../models/OTP.model');
const emailService = require('../services/email.service');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Rate limit: 5 login attempts per 15 seconds per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 1000, // 15 seconds
  max: 5,
  message: { error: 'Too many login attempts. Please wait 15 seconds and try again.' },
  standardHeaders: true,
  legacyHeaders: false
});

// POST /auth/login
router.post('/login', loginLimiter, async (req, res) => {
  const logger = res.locals.logger;
  const correlationId = res.locals.correlationId;

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');

    if (!admin) {
      await AuditLog.create({
        actionType: 'LOGIN_FAILED',
        entity: 'Admin',
        ip: req.ip,
        userAgent: req.get('user-agent'),
        success: false,
        metadata: { reason: 'User not found', email }
      });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check account lock
    if (admin.lockUntil && admin.lockUntil > Date.now()) {
      return res.status(423).json({
        error: 'Account locked due to too many failed attempts. Try again later.'
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      admin.loginAttempts = (admin.loginAttempts || 0) + 1;

      // Lock account on 5th failed attempt (30 min lockout)
      if (admin.loginAttempts >= 5) {
        admin.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
      }
      await admin.save();

      await AuditLog.create({
        adminId: admin._id,
        actionType: 'LOGIN_FAILED',
        entity: 'Admin',
        entityId: admin._id,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        success: false,
        metadata: { attempts: admin.loginAttempts }
      });

      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Reset login attempts on success
    admin.loginAttempts = 0;
    admin.lockUntil = undefined;
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '24h' }
    );

    // Set httpOnly cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    await AuditLog.create({
      adminId: admin._id,
      actionType: 'LOGIN',
      entity: 'Admin',
      entityId: admin._id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      success: true
    });

    logger.info('Admin login successful', { correlationId, adminId: admin._id.toString() });

    res.status(200).json({
      message: 'Login successful',
      admin: admin.toJSON(),
      token
    });
  } catch (error) {
    logger.error('Login error', { correlationId, error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'strict'
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

// GET /auth/me - Verify current session
router.get('/me', require('../middleware/auth.middleware'), async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    res.json({ admin: admin.toJSON() });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/profile/change-email - Change admin email (requires current password)
router.post('/profile/change-email', authMiddleware, async (req, res) => {
  try {
    const { newEmail, currentPassword } = req.body;

    if (!newEmail || !currentPassword) {
      return res.status(400).json({ error: 'New email and current password are required' });
    }

    const admin = await Admin.findById(req.admin.id).select('+password');
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Check if new email already exists
    const existing = await Admin.findOne({ email: newEmail.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const oldEmail = admin.email;
    admin.email = newEmail.toLowerCase();
    await admin.save();

    await AuditLog.create({
      adminId: admin._id,
      actionType: 'UPDATE',
      entity: 'Admin',
      entityId: admin._id,
      oldValues: { email: oldEmail },
      newValues: { email: admin.email },
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ message: 'Email updated successfully', admin: admin.toJSON() });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/profile/request-password-otp - Request OTP for password change
router.post('/profile/request-password-otp', authMiddleware, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Delete any existing unverified OTPs for this admin
    await OTP.deleteMany({ email: admin.email, purpose: 'password_change', verified: false });

    // Generate 6-digit OTP
    const otp = emailService.generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await OTP.create({
      email: admin.email,
      otp,
      purpose: 'password_change',
      expiresAt
    });

    // Send OTP via email
    await emailService.sendOTP(admin.email, otp, 'password_change');

    res.json({ message: 'OTP sent to your email', expiresIn: 600 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send OTP'  });
  }
});

// POST /auth/profile/change-password - Verify OTP and change password
router.post('/profile/change-password', authMiddleware, async (req, res) => {
  try {
    const { otp, newPassword } = req.body;

    if (!otp || !newPassword) {
      return res.status(400).json({ error: 'OTP and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const admin = await Admin.findById(req.admin.id).select('+password');
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Find valid OTP
    const otpRecord = await OTP.findOne({
      email: admin.email,
      otp,
      purpose: 'password_change',
      verified: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    // Update password
    admin.password = await bcrypt.hash(newPassword, 12);
    await admin.save();

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    await AuditLog.create({
      adminId: admin._id,
      actionType: 'UPDATE',
      entity: 'Admin',
      entityId: admin._id,
      metadata: { action: 'password_changed' },
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// POST /auth/forgot-password - Request forgot password OTP (public route)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    
    // For security, always return success even if email doesn't exist
    if (!admin) {
      return res.json({ message: 'If the email exists, an OTP has been sent' });
    }

    // Delete any existing unverified OTPs
    await OTP.deleteMany({ email: admin.email, purpose: 'forgot_password', verified: false });

    // Generate OTP
    const otp = emailService.generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OTP.create({
      email: admin.email,
      otp,
      purpose: 'forgot_password',
      expiresAt
    });

    await emailService.sendOTP(admin.email, otp, 'forgot_password');

    res.json({ message: 'If the email exists, an OTP has been sent', expiresIn: 600 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// POST /auth/reset-password - Verify OTP and reset password (public route)
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Find valid OTP
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      otp,
      purpose: 'forgot_password',
      verified: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Update password
    admin.password = await bcrypt.hash(newPassword, 12);
    admin.loginAttempts = 0;
    admin.lockUntil = undefined;
    await admin.save();

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    await AuditLog.create({
      adminId: admin._id,
      actionType: 'UPDATE',
      entity: 'Admin',
      entityId: admin._id,
      metadata: { action: 'password_reset_via_otp' },
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ message: 'Password reset successfully. You can now login.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
