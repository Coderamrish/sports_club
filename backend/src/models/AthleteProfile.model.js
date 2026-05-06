const mongoose = require('mongoose');

const athleteProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    // ─── Step 1: Personal Details ──────────────────────────────────
    dateOfBirth: { type: Date, required: false },
    age: { type: Number }, // Auto-calculated from DOB
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },

    // ─── Step 2: Parent/Guardian ───────────────────────────────────
    fatherName: String,
    motherName: String,
    guardianName: String,
    parentMobile: {
      type: String,
      match: [/^[6-9]\d{9}$/, 'Invalid mobile number'],
    },
    parentEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },

    // ─── Step 3: Address ───────────────────────────────────────────
    address: {
      street: String,
      landmark: String,
      city: String,
      district: String,
      state: String,
      pinCode: String,
      country: { type: String, default: 'India' },
    },

    // ─── Step 4: Club / Representation ────────────────────────────
    clubName: String,
    stateRepresentation: String,
    districtRepresentation: String,
    nocClub: {
      url: String,
      key: String,
      uploadedAt: Date,
      status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    },
    nocStateAssociation: {
      url: String,
      key: String,
      uploadedAt: Date,
      status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    },

    // ─── Step 5: Competition Details ──────────────────────────────
    ageGroup: {
      type: String,
      enum: ['U-10', 'U-12', 'U-14', 'U-16', 'U-18', 'U-21', 'Senior', 'Masters'],
    },
    skillLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
    },

    // ─── Step 6: Documents ─────────────────────────────────────────
    documents: {
      passportPhoto: {
        url: String,
        key: String,
        uploadedAt: Date,
        status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
        adminNote: String,
      },
      aadhaarCard: {
        url: String,
        key: String,
        uploadedAt: Date,
        status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
        adminNote: String,
      },
      birthCertificate: {
        url: String,
        key: String,
        uploadedAt: Date,
        status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
        adminNote: String,
      },
      schoolBonafide: {
        url: String,
        key: String,
        uploadedAt: Date,
        status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
        adminNote: String,
      },
      achievementCertificates: [
        {
          url: String,
          key: String,
          name: String,
          uploadedAt: Date,
        },
      ],
      medicalFitness: {
        url: String,
        key: String,
        uploadedAt: Date,
      },
    },

    // ─── Insurance ─────────────────────────────────────────────────
    insurance: {
      isRequired: { type: Boolean, default: false },
      providerName: String,
      policyNumber: String,
      validTill: Date,
      status: {
        type: String,
        enum: ['Missing', 'Uploaded', 'Expired', 'Verified'],
        default: 'Missing',
      },
      document: {
        url: String,
        key: String,
        uploadedAt: Date,
      },
    },

    // ─── Registration Status ──────────────────────────────────────
    registrationStatus: {
      type: String,
      enum: ['Incomplete', 'Pending Review', 'Approved', 'Rejected'],
      default: 'Incomplete',
    },

    // ─── Profile Fee (one-time registration fee) ───────────────────
    profileFeeStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed'],
      default: 'Pending',
    },
    profileFeePaidAt:        { type: Date, default: null },
    profileFeeTransactionId: { type: String, default: null },

    // ─── Linked Competitions ──────────────────────────────────────
    competitions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CompetitionRegistration',
      },
    ],

    // ─── Admin Verification ────────────────────────────────────────
    adminNotes: String,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,

    // ─── Form Step Progress ───────────────────────────────────────
    // max 9: steps 1-8 + payment complete = 9
    formStep: { type: Number, default: 1, min: 1, max: 9 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: Age Calculation ─────────────────────────────────────────
athleteProfileSchema.virtual('calculatedAge').get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
});

// ─── Virtual: Insurance Expired ──────────────────────────────────────
athleteProfileSchema.virtual('isInsuranceExpired').get(function () {
  if (!this.insurance?.validTill) return null;
  return new Date(this.insurance.validTill) < new Date();
});

// ─── Pre-save: Auto-set age and insurance status ──────────────────────
athleteProfileSchema.pre('save', function (next) {
  // Auto-calculate age from DOB
  if (this.dateOfBirth) {
    const today = new Date();
    const birth = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    this.age = age;
  }

  // Auto-update insurance status
  if (this.insurance?.validTill && this.insurance.document?.url) {
    const isExpired = new Date(this.insurance.validTill) < new Date();
    if (isExpired) this.insurance.status = 'Expired';
    else if (this.insurance.status === 'Missing') this.insurance.status = 'Uploaded';
  }

  next();
});

// ─── Indexes ─────────────────────────────────────────────────────────
athleteProfileSchema.index({ 'address.state': 1 });
athleteProfileSchema.index({ ageGroup: 1, skillLevel: 1 });
athleteProfileSchema.index({ registrationStatus: 1 });
athleteProfileSchema.index({ 'insurance.validTill': 1 });

const AthleteProfile = mongoose.model('AthleteProfile', athleteProfileSchema);
module.exports = AthleteProfile;