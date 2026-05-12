const mongoose = require('mongoose');

/**
 * AuditLog — records admin actions for accountability and traceability.
 * Created automatically via the auditLog() middleware in permissions.middleware.js
 * NOTE : please prefer to read the comment part of code to undertand better the project message to the technical team.
 */
const auditLogSchema = new mongoose.Schema(
  {
    // Who performed the action
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    adminEmail: { type: String },      
    adminLevel:  { type: String },

    // What they did
    action: {
      type: String,
      required: true,
      index: true,
      // e.g. 'create_admin', 'update_athlete_status', 'review_document', 'create_competition'
    },

    // The entity that was acted upon
    targetId:   { type: mongoose.Schema.Types.ObjectId, default: null },
    targetModel:{ type: String, default: null },  // 'User', 'AthleteProfile', etc.

    // HTTP request snapshot
    method:     { type: String },   // GET, POST, PATCH …
    path:       { type: String },   // /api/admin/athletes/:id/status
    ipAddress:  { type: String },
    userAgent:  { type: String },

    // Outcome
    statusCode: { type: Number },
    success:    { type: Boolean, default: true },
    errorMessage:{ type: String, default: null },

    // Arbitrary payload (diff / changes) — kept small
    changes:    { type: mongoose.Schema.Types.Mixed, default: null },

    // Soft-delete / retention support
    expiresAt:  {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90-day retention
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for the most common admin queries
auditLogSchema.index({ admin: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ targetId: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;