const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Admin Permission Levels (RBAC):
 *   super_admin  → full access: create/delete other admins, all settings
 *   admin        → manage athletes, coaches, competitions, payments
 *   moderator    → view data, approve/reject documents, no financial access
 */
const ADMIN_PERMISSIONS = {
  super_admin: [
    'manage_admins', 'manage_athletes', 'manage_coaches',
    'manage_competitions', 'manage_payments', 'view_analytics',
    'export_data', 'system_settings', 'view_all_profiles',
    'approve_documents', 'manage_certificates',
  ],
  admin: [
    'manage_athletes', 'manage_coaches', 'manage_competitions',
    'manage_payments', 'view_analytics', 'export_data',
    'view_all_profiles', 'approve_documents', 'manage_certificates',
  ],
  moderator: [
    'view_all_profiles', 'approve_documents', 'view_analytics',
  ],
};

const userSchema = new mongoose.Schema(
  {
    // ─── Core identity ─────────────────────────────────────────────
    role: {
      type: String,
      enum: ['athlete', 'coach', 'admin'],
      required: true,
      index: true,
    },

    // ─── Admin sub-role & permissions ──────────────────────────────
    adminLevel: {
      type: String,
      enum: ['super_admin', 'admin', 'moderator'],
      default: null,  // only set when role === 'admin'
    },
    // Computed from adminLevel on save — stored for fast $in queries
    permissions: {
      type: [String],
      default: [],
      select: false,
    },
    // Which admin created this admin account (audit trail)
    createdByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ─── Auth ───────────────────────────────────────────────────────
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
      index: true,
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Valid 10-digit Indian mobile number required'],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },

    // ─── Profile ────────────────────────────────────────────────────
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    profilePhoto: { url: String, key: String },

    // ─── Verification ────────────────────────────────────────────────
    isEmailVerified:    { type: Boolean, default: false },
    isMobileVerified:   { type: Boolean, default: false },
    isProfileComplete:  { type: Boolean, default: false },
    isActive:           { type: Boolean, default: true, index: true },

    // ─── OTP (transient — also lives in OTP collection) ────────────
    emailOtp: {
      code:      { type: String,  select: false },
      expiresAt: { type: Date,    select: false },
      attempts:  { type: Number,  default: 0,   select: false },
    },

    // ─── Tokens ─────────────────────────────────────────────────────
    refreshToken:         { type: String, select: false },
    passwordResetToken:   { type: String, select: false },
    passwordResetExpires: { type: Date,   select: false },

    // ─── Sliding-window attempt tracking (DB layer) ─────────────────
    // Note: primary rate limiting is in middleware; this is the DB-side
    // fallback that survives server restarts.
    loginAttempts: {
      count:       { type: Number, default: 0 },
      windowStart: { type: Date,   default: Date.now },
      lockedUntil: { type: Date,   default: null },
    },

    // ─── Audit ──────────────────────────────────────────────────────
    lastLoginAt: Date,
    lastLoginIp: String,
    deletedAt:   Date,
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ────────────────────────────────────────────────────────────────
userSchema.index({ email: 1, role: 1 });
userSchema.index({ mobile: 1, role: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });

// ─── Pre-save: hash password + sync permissions ──────────────────────────────
userSchema.pre('save', async function (next) {
  // 1. Hash password only when modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // 2. Sync admin permissions array from adminLevel
  if (this.role === 'admin' && this.isModified('adminLevel')) {
    this.permissions = ADMIN_PERMISSIONS[this.adminLevel] || [];
  }

  // 3. Clear adminLevel if not admin
  if (this.role !== 'admin') {
    this.adminLevel  = null;
    this.permissions = [];
  }

  next();
});

// ─── Methods ─────────────────────────────────────────────────────────────────

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isAccountLocked = function () {
  if (!this.loginAttempts.lockedUntil) return false;
  return this.loginAttempts.lockedUntil > new Date();
};

/** Sliding window DB-layer attempt tracking (5 attempts / 5 min) */
userSchema.methods.incrementLoginAttempts = async function () {
  const WINDOW_MS  = 5 * 60 * 1000;
  const MAX        = this.role === 'admin' ? 3 : 5;
  const now        = new Date();

  const elapsed = now - (this.loginAttempts.windowStart || now);
  if (elapsed > WINDOW_MS) {
    this.loginAttempts = { count: 1, windowStart: now, lockedUntil: null };
  } else {
    this.loginAttempts.count += 1;
    if (this.loginAttempts.count >= MAX) {
      const windowEnd = new Date((this.loginAttempts.windowStart?.getTime() || now.getTime()) + WINDOW_MS);
      this.loginAttempts.lockedUntil = windowEnd;
    }
  }
  return this.save({ validateBeforeSave: false });
};

userSchema.methods.resetLoginAttempts = async function () {
  this.loginAttempts = { count: 0, windowStart: new Date(), lockedUntil: null };
  this.lastLoginAt   = new Date();
  return this.save({ validateBeforeSave: false });
};

/** Check if admin has a specific permission */
userSchema.methods.hasPermission = function (permission) {
  if (this.role !== 'admin') return false;
  return this.permissions.includes(permission);
};

/** Check if admin can manage another admin (only super_admin can) */
userSchema.methods.canManageAdmins = function () {
  return this.role === 'admin' && this.adminLevel === 'super_admin';
};

// ─── Virtuals ────────────────────────────────────────────────────────────────

userSchema.virtual('isFullyVerified').get(function () {
  return this.isEmailVerified && this.isMobileVerified;
});

userSchema.virtual('adminLevelLabel').get(function () {
  const labels = { super_admin: 'Super Admin', admin: 'Admin', moderator: 'Moderator' };
  return labels[this.adminLevel] || null;
});

// ─── Statics ─────────────────────────────────────────────────────────────────

/** Get all permissions for a given adminLevel */
userSchema.statics.getPermissionsForLevel = function (level) {
  return ADMIN_PERMISSIONS[level] || [];
};

const User = mongoose.model('User', userSchema);
module.exports = User;
