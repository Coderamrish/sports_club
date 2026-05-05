// backend/src/models/CompetitionRegistration.model.js
const mongoose = require('mongoose');

const competitionRegistrationSchema = new mongoose.Schema(
  {
    athlete: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    competition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Competition',
      required: true,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    paymentAmount: { type: Number, default: 0 },
    paymentReference: { type: String },
    paymentDate: { type: Date },
    
    // Result tracking (Phase 4 - achievements module)
    attendanceStatus: {
      type: String,
      enum: ['Registered', 'Present', 'Absent'],
      default: 'Registered',
    },
    medalWon: {
      type: String,
      enum: ['Gold', 'Silver', 'Bronze', 'None'],
      default: 'None',
    },
    certificateUrl: { type: String },
    publishedAt: { type: Date },
    
    // Admin notes
    adminNotes: { type: String },
    status: {
      type: String,
      // 'Pending'  → newly registered, awaiting admin approval
      // 'Active'   → approved by admin, athlete is confirmed
      // 'Rejected' → rejected by admin
      // 'Cancelled'→ cancelled by the athlete
      enum: ['Pending', 'Active', 'Cancelled', 'Rejected'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

// Prevent duplicate registrations
competitionRegistrationSchema.index({ athlete: 1, competition: 1 }, { unique: true });

module.exports =
  mongoose.models.CompetitionRegistration ||
  mongoose.model('CompetitionRegistration', competitionRegistrationSchema);