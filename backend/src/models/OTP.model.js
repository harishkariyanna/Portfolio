const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    required: true,
    enum: ['password_change', 'forgot_password', 'email_change']
  },
  verified: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // TTL index - MongoDB will auto-delete after expiresAt
  }
}, {
  timestamps: true
});

// Index for faster lookups
otpSchema.index({ email: 1, purpose: 1, verified: 1 });

module.exports = mongoose.model('OTP', otpSchema);
