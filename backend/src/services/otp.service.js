const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const OTP = require('../models/OTP.model');
const emailService = require('./email.service');
const { AppError } = require('../utils/appError');

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRES_MINUTES) || 10;
const MAX_OTP_ATTEMPTS = 5;

/**
 * Generate a secure 6-digit OTP
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Create and store an OTP for given email + purpose
 * Replaces any existing OTP for the same email+purpose
 */
const createOTP = async (email, purpose) => {
  const otp = generateOTP();

  // Remove any existing OTPs for this email+purpose
  await OTP.deleteMany({ email: email.toLowerCase(), purpose });

  // Hash OTP before storing
  const salt = await bcrypt.genSalt(10);
  const hashedOtp = await bcrypt.hash(otp, salt);

  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await OTP.create({
    email: email.toLowerCase(),
    otp: hashedOtp,
    purpose,
    expiresAt,
  });

  return otp; // Return plain OTP to send via email
};

/**
 * Verify an OTP
 */
const verifyOTP = async (email, otp, purpose) => {
  const otpRecord = await OTP.findOne({
    email: email.toLowerCase(),
    purpose,
    verified: false,
  }).select('+otp');

  if (!otpRecord) {
    throw new AppError('OTP not found or already used. Please request a new one.', 400);
  }

  if (new Date() > otpRecord.expiresAt) {
    await OTP.deleteOne({ _id: otpRecord._id });
    throw new AppError(`OTP has expired. Please request a new one.`, 400);
  }

  if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
    await OTP.deleteOne({ _id: otpRecord._id });
    throw new AppError('Too many incorrect attempts. Please request a new OTP.', 400);
  }

  const isMatch = await bcrypt.compare(otp, otpRecord.otp);

  if (!isMatch) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    const remaining = MAX_OTP_ATTEMPTS - otpRecord.attempts;
    throw new AppError(
      `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
      400
    );
  }

  // Mark as verified and delete
  await OTP.deleteOne({ _id: otpRecord._id });
  return true;
};

/**
 * Send email OTP for verification
 */
const sendEmailOTP = async (email, fullName, purpose = 'email_verification') => {
  const otp = await createOTP(email, purpose);

  const subjects = {
    email_verification: 'Verify Your Email — Sports Club',
    password_reset: 'Reset Your Password — Sports Club',
    mobile_verification: 'Mobile Verification — Sports Club',
  };

  const messages = {
    email_verification: `Welcome to Sports Club! Your email verification OTP is:`,
    password_reset: `You requested a password reset. Your OTP is:`,
    mobile_verification: `Your mobile verification OTP is:`,
  };

  await emailService.sendOTPEmail({
    to: email,
    fullName,
    subject: subjects[purpose],
    message: messages[purpose],
    otp,
    expiryMinutes: OTP_EXPIRY_MINUTES,
  });

  return { message: `OTP sent to ${email}` };
};

/**
 * Check if OTP was recently sent (prevent spam — 60s cooldown)
 */
const checkOTPCooldown = async (email, purpose) => {
  const recent = await OTP.findOne({
    email: email.toLowerCase(),
    purpose,
    createdAt: { $gt: new Date(Date.now() - 60 * 1000) },
  });

  if (recent) {
    const waitSecs = Math.ceil((recent.createdAt.getTime() + 60000 - Date.now()) / 1000);
    throw new AppError(
      `Please wait ${waitSecs} second${waitSecs !== 1 ? 's' : ''} before requesting a new OTP.`,
      429
    );
  }
};

module.exports = { createOTP, verifyOTP, sendEmailOTP, checkOTPCooldown };
