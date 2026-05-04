const mongoose = require('mongoose');

/**
 * Standalone OTP collection — used for email verification during signup.
 * Separate from user.emailOtp for cleanliness and TTL indexing.
 */
const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  otp: {
    type: String,
    required: true,
    select: false,
  },
  purpose: {
    type: String,
    enum: ['email_verification', 'password_reset', 'mobile_verification'],
    required: true,
  },
  attempts: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  expiresAt: {
    type: Date,
    required: true,
    // MongoDB TTL index: auto-delete document after expiry
    index: { expireAfterSeconds: 0 },
  },
  createdAt: { type: Date, default: Date.now },
});

// Compound index: one active OTP per email per purpose
otpSchema.index({ email: 1, purpose: 1 });

const OTP = mongoose.model('OTP', otpSchema);
module.exports = OTP;
