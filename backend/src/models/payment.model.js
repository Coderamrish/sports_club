const mongoose = require('mongoose');

/**
 * Payment Model
 * Tracks every Razorpay transaction — competition fees, profile registration fees.
 * One Payment doc per transaction attempt. Successful ones link back to the entity
 * they paid for via (entityType + entityId).
 */
const paymentSchema = new mongoose.Schema(
  {
    // ─── Who paid ──────────────────────────────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // ─── What was paid for ──────────────────────────────────────────────────────
    // entityType: 'competition_registration' | 'profile_registration'
    entityType: {
      type: String,
      enum: ['competition_registration', 'profile_registration'],
      required: true,
    },
    // entityId: ObjectId of CompetitionRegistration OR AthleteProfile/CoachProfile
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    // ─── Amount ─────────────────────────────────────────────────────────────────
    amount: { type: Number, required: true },       // in INR (not paise)
    currency: { type: String, default: 'INR' },

    // ─── Razorpay IDs ───────────────────────────────────────────────────────────
    razorpayOrderId:   { type: String, required: true, unique: true, index: true },
    razorpayPaymentId: { type: String, default: null, index: true },
    razorpaySignature: { type: String, default: null },

    // ─── Status ─────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded'],
      default: 'created',
      index: true,
    },

    // ─── Meta ───────────────────────────────────────────────────────────────────
    description: { type: String },          // e.g. "Registration fee - Kankinara T20"
    failureReason: { type: String },
    paidAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;