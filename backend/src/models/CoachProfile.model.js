const mongoose = require('mongoose');

const coachProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    // ─── Professional Details ──────────────────────────────────────
    dateOfBirth: Date,
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    specialization: [String], // e.g., ["Swimming", "Athletics"]
    experienceYears: { type: Number, min: 0 },
    bio: { type: String, maxlength: 1000 },

    // ─── Certifications ────────────────────────────────────────────
    certifications: [
      {
        name: String,
        issuedBy: String,
        issuedDate: Date,
        expiryDate: Date,
        documentUrl: String,
        documentKey: String,
      },
    ],

    // ─── Address ───────────────────────────────────────────────────
    address: {
      street: String,
      city: String,
      state: String,
      pinCode: String,
      country: { type: String, default: 'India' },
    },

    // ─── Club Association ──────────────────────────────────────────
    clubName: String,
    stateAssociation: String,

    // ─── Documents ─────────────────────────────────────────────────
    documents: {
      profilePhoto: { url: String, key: String },
      idProof: {
        url: String,
        key: String,
        status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
      },
      certificationDoc: { url: String, key: String },
    },

    // ─── Status ────────────────────────────────────────────────────
    profileStatus: {
      type: String,
      enum: ['Incomplete', 'Pending Review', 'Approved', 'Rejected'],
      default: 'Incomplete',
      index: true,
    },
    // max 6: steps 1-5 + payment complete = 6
    formStep: { type: Number, default: 1 },

    // ─── Profile Fee (one-time registration fee) ───────────────────
    profileFeeStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed'],
      default: 'Pending',
    },
    profileFeePaidAt:        { type: Date, default: null },
    profileFeeTransactionId: { type: String, default: null },

    // ─── Assigned Athletes (future feature) ───────────────────────
    assignedAthletes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

const CoachProfile = mongoose.model('CoachProfile', coachProfileSchema);
module.exports = CoachProfile;