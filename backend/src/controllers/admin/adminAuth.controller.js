const User = require('../../models/User.model');
const { sendEmailOTP, verifyOTP, checkOTPCooldown } = require('../../services/otp.service');
const { sendWelcomeEmail, sendEmail } = require('../../services/email.service');
const { sendTokenResponse, verifyRefreshToken, generateAccessToken } = require('../../utils/jwt.utils');
const { AppError } = require('../../utils/appError');
const { resetLoginLimit } = require('../../middleware/rateLimiter');
const bcrypt = require('bcryptjs');
const logger = require('../../utils/logger');

// ─────────────────────────────────────────────────────────────────────────────
//  ADMIN LOGIN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/admin/login
 * Tighter: admin_login limiter (3/5min), extra audit log, permission snapshot
 */
exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.socket?.remoteAddress;

    const user = await User.findOne({ email: email.toLowerCase(), role: 'admin' })
      .select('+password +loginAttempts +permissions +refreshToken');

    // DB-layer lock check (survives restarts)
    if (user?.isAccountLocked()) {
      const secsRemaining = Math.ceil((user.loginAttempts.lockedUntil - Date.now()) / 1000);
      return next(new AppError(
        `Admin account locked due to too many failed attempts. Try again in ${Math.ceil(secsRemaining / 60)} minute(s).`,
        429
      ));
    }

    if (!user || !(await user.comparePassword(password))) {
      if (user) await user.incrementLoginAttempts();
      logger.warn('Failed admin login attempt', { email, ip });
      return next(new AppError('Invalid admin credentials.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Admin account is deactivated. Contact super admin.', 403));
    }

    // Admins don't need email OTP verification on login (they're invited)
    // but we do require email to be verified on their account
    if (!user.isEmailVerified) {
      return next(new AppError('Admin email is not verified. Contact super admin.', 403));
    }

    // Success
    await user.resetLoginAttempts();
    await resetLoginLimit(ip, email);
    user.lastLoginIp = ip;
    await user.save({ validateBeforeSave: false });

    logger.info('Admin login success', { adminId: user._id, adminLevel: user.adminLevel, ip });

    // Build token response with extra admin metadata
    const refreshToken = sendTokenResponse(user, 200, res, 'Admin login successful.', {
      adminLevel: user.adminLevel,
      permissions: user.permissions,
    });

    const salt = await bcrypt.genSalt(10);
    user.refreshToken = await bcrypt.hash(refreshToken, salt);
    await user.save({ validateBeforeSave: false });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  CREATE ADMIN  (super_admin only)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/admin/admins
 * Only super_admin can create new admin accounts
 */
exports.createAdmin = async (req, res, next) => {
  try {
    const { fullName, email, mobile, password, adminLevel } = req.body;
    const creator = req.user;

    if (!creator.canManageAdmins()) {
      return next(new AppError('Only Super Admins can create new admin accounts.', 403));
    }

    const validLevels = ['admin', 'moderator'];  // super_admin can't be created via API for safety
    if (!validLevels.includes(adminLevel)) {
      return next(new AppError('Admin level must be "admin" or "moderator".', 400));
    }

    // Duplicate checks
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return next(new AppError('This email is already registered.', 409));
    }
    const existingMobile = await User.findOne({ mobile });
    if (existingMobile) {
      return next(new AppError('This mobile number is already registered.', 409));
    }

    const newAdmin = await User.create({
      fullName,
      email,
      mobile,
      password,
      role: 'admin',
      adminLevel,
      isEmailVerified: true,  // Admin accounts are pre-verified by super admin
      isActive: true,
      createdByAdmin: creator._id,
    });

    // Send invite/welcome email
    await sendAdminWelcomeEmail({ to: email, fullName, adminLevel, creatorName: creator.fullName, password });

    logger.info('New admin created', {
      newAdminId: newAdmin._id, adminLevel, createdBy: creator._id
    });

    res.status(201).json({
      success: true,
      message: `${adminLevel} account created successfully. Welcome email sent.`,
      data: {
        _id: newAdmin._id,
        fullName: newAdmin.fullName,
        email: newAdmin.email,
        mobile: newAdmin.mobile,
        adminLevel: newAdmin.adminLevel,
        permissions: User.getPermissionsForLevel(adminLevel),
        createdAt: newAdmin.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  LIST ADMINS  (super_admin only)
// ─────────────────────────────────────────────────────────────────────────────

exports.listAdmins = async (req, res, next) => {
  try {
    if (!req.user.canManageAdmins()) {
      return next(new AppError('Only Super Admins can view admin accounts.', 403));
    }

    const { page = 1, limit = 20, adminLevel, isActive } = req.query;
    const filter = { role: 'admin' };
    if (adminLevel) filter.adminLevel = adminLevel;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [admins, total] = await Promise.all([
      User.find(filter)
        .select('-password -refreshToken -passwordResetToken')
        .populate('createdByAdmin', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        admins,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  UPDATE ADMIN  (super_admin only)
// ─────────────────────────────────────────────────────────────────────────────

exports.updateAdmin = async (req, res, next) => {
  try {
    if (!req.user.canManageAdmins()) {
      return next(new AppError('Only Super Admins can modify admin accounts.', 403));
    }

    const { id } = req.params;
    const { adminLevel, isActive } = req.body;

    const admin = await User.findOne({ _id: id, role: 'admin' }).select('+permissions');
    if (!admin) return next(new AppError('Admin not found.', 404));

    // Prevent modifying another super_admin
    if (admin.adminLevel === 'super_admin') {
      return next(new AppError('Super Admin accounts cannot be modified via API.', 403));
    }

    if (adminLevel) admin.adminLevel = adminLevel;
    if (isActive !== undefined) admin.isActive = isActive;

    await admin.save();

    logger.info('Admin updated', { targetId: id, changes: { adminLevel, isActive }, updatedBy: req.user._id });

    res.status(200).json({
      success: true,
      message: 'Admin account updated.',
      data: { _id: admin._id, adminLevel: admin.adminLevel, isActive: admin.isActive, permissions: admin.permissions },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  DEACTIVATE ADMIN  (super_admin only)
// ─────────────────────────────────────────────────────────────────────────────

exports.deactivateAdmin = async (req, res, next) => {
  try {
    if (!req.user.canManageAdmins()) {
      return next(new AppError('Only Super Admins can deactivate admin accounts.', 403));
    }

    const { id } = req.params;

    // Can't deactivate yourself
    if (id === req.user._id.toString()) {
      return next(new AppError('You cannot deactivate your own account.', 400));
    }

    const admin = await User.findOne({ _id: id, role: 'admin' });
    if (!admin) return next(new AppError('Admin not found.', 404));
    if (admin.adminLevel === 'super_admin') {
      return next(new AppError('Super Admin accounts cannot be deactivated via API.', 403));
    }

    admin.isActive = false;
    admin.refreshToken = undefined;
    await admin.save({ validateBeforeSave: false });

    logger.info('Admin deactivated', { targetId: id, deactivatedBy: req.user._id });

    res.status(200).json({ success: true, message: 'Admin account deactivated.' });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  GET ADMIN PROFILE  (self)
// ─────────────────────────────────────────────────────────────────────────────

exports.getAdminProfile = async (req, res, next) => {
  try {
    const admin = await User.findById(req.user._id).select('+permissions');
    res.status(200).json({
      success: true,
      data: {
        _id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        mobile: admin.mobile,
        adminLevel: admin.adminLevel,
        permissions: admin.permissions,
        lastLoginAt: admin.lastLoginAt,
        lastLoginIp: admin.lastLoginIp,
        createdAt: admin.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  EMAIL HELPER
// ─────────────────────────────────────────────────────────────────────────────

async function sendAdminWelcomeEmail({ to, fullName, adminLevel, creatorName, password }) {
  const levelLabels = { admin: 'Admin', moderator: 'Moderator' };
  const label = levelLabels[adminLevel] || adminLevel;

  const html = `
    <!DOCTYPE html><html><head><style>
      body{font-family:Arial,sans-serif;background:#f5f5f5;margin:0}
      .container{max-width:540px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1)}
      .header{background:linear-gradient(135deg,#1A237E,#283593);padding:32px;text-align:center;color:white}
      .body{padding:36px 32px;color:#333}
      .badge{display:inline-block;background:#1A237E;color:white;padding:6px 18px;border-radius:20px;font-weight:bold;font-size:14px}
      .cred-box{background:#F3F6FF;border:1px solid #C5CAE9;border-radius:8px;padding:18px;margin:20px 0}
      .cred-row{display:flex;gap:12px;margin-bottom:8px;font-size:14px}
      .cred-label{color:#666;width:80px;flex-shrink:0}
      .cred-value{font-weight:700;color:#1A237E;word-break:break-all}
      .warning{background:#FFF8E1;border-left:4px solid #FFA000;padding:14px;border-radius:6px;font-size:13px;margin-top:16px}
      .footer{background:#F8F9FA;padding:20px;text-align:center;font-size:12px;color:#999;border-top:1px solid #EEE}
    </style></head>
    <body><div class="container">
      <div class="header">
        <h1>🛡️ Sports Club Admin</h1>
        <p>You've been added as an administrator</p>
      </div>
      <div class="body">
        <p>Hello <strong>${fullName}</strong>,</p>
        <p><strong>${creatorName}</strong> has granted you <span class="badge">${label}</span> access to the Sports Club Management System.</p>
        <div class="cred-box">
          <p style="margin:0 0 12px;font-weight:700;color:#1A237E">Your Login Credentials</p>
          <div class="cred-row"><span class="cred-label">Email:</span><span class="cred-value">${to}</span></div>
          <div class="cred-row"><span class="cred-label">Password:</span><span class="cred-value">${password}</span></div>
          <div class="cred-row"><span class="cred-label">Role:</span><span class="cred-value">${label}</span></div>
        </div>
        <div class="warning">⚠️ <strong>Security:</strong> Change your password immediately after first login. Never share these credentials.</div>
      </div>
      <div class="footer">© ${new Date().getFullYear()} Sports Club Management System</div>
    </div></body></html>
  `;
  await sendEmail({ to, subject: `You're now a Sports Club ${label}`, html });
}
