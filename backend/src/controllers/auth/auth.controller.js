const User = require('../../models/User.model');
const AthleteProfile = require('../../models/AthleteProfile.model');
const CoachProfile = require('../../models/CoachProfile.model');
const { sendEmailOTP, verifyOTP, checkOTPCooldown } = require('../../services/otp.service');
const { sendWelcomeEmail } = require('../../services/email.service');
const { sendTokenResponse, verifyRefreshToken, generateAccessToken } = require('../../utils/jwt.utils');
const { AppError } = require('../../utils/appError');
const { resetLoginLimit } = require('../../middleware/rateLimiter');
const bcrypt = require('bcryptjs');

/**
 * POST /api/auth/register
 * Step 1 of registration: Create user + send email OTP
 */
exports.register = async (req, res, next) => {
  try {
    const { fullName, email, mobile, password, role } = req.body;

    // Validate role
    const allowedRoles = ['athlete', 'coach'];
    if (!allowedRoles.includes(role)) {
      return next(new AppError('Invalid role. Must be athlete or coach.', 400));
    }

    // Check for existing email or mobile
    const existingEmailUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingEmailUser) {
      if (existingEmailUser.isEmailVerified) {
        return next(new AppError('This email is already registered and verified. Please log in.', 409));
      }
      // Unverified user - allow overwriting/re-registering (fixes timeout issues)
      existingEmailUser.fullName = fullName;
      existingEmailUser.mobile   = mobile;
      existingEmailUser.password = password;
      existingEmailUser.role     = role;
      await existingEmailUser.save();
      
      // Upsert profile shell
      if (role === 'athlete') {
        await AthleteProfile.findOneAndUpdate({ user: existingEmailUser._id }, { user: existingEmailUser._id }, { upsert: true });
      } else if (role === 'coach') {
        await CoachProfile.findOneAndUpdate({ user: existingEmailUser._id }, { user: existingEmailUser._id }, { upsert: true });
      }
      
      var user = existingEmailUser;
    } else {
      // Check if mobile is taken by someone else
      const existingMobile = await User.findOne({ mobile });
      if (existingMobile) {
        return next(new AppError('This mobile number is already registered by another user.', 409));
      }

      // Create new user (unverified)
      user = await User.create({
        fullName,
        email,
        mobile,
        password,
        role,
        isEmailVerified: false,
      });

      // Create associated profile shell
      if (role === 'athlete') {
        await AthleteProfile.create({ user: user._id });
      } else if (role === 'coach') {
        await CoachProfile.create({ user: user._id });
      }
    }

    // Send OTP
    try {
      await sendEmailOTP(email, fullName, 'email_verification');
    } catch (emailError) {
      logger.error(`❌ Registration OTP failed to ${email}: ${emailError.message}`);
      return res.status(201).json({
        success: true,
        message: `Account created! However, we had trouble sending the verification email. Please click 'Resend OTP' in a moment.`,
        data: {
          userId: user._id,
          email: user.email,
          role: user.role,
          isEmailVerified: false,
          emailError: true
        },
      });
    }

    res.status(201).json({
      success: true,
      message: `Account created! We've sent a 6-digit OTP to ${email}. Please verify to continue.`,
      data: {
        userId: user._id,
        email: user.email,
        role: user.role,
        isEmailVerified: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/verify-email
 * Step 2: Verify email OTP
 */
exports.verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    await verifyOTP(email, otp, 'email_verification');

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { isEmailVerified: true },
      { new: true }
    );

    if (!user) return next(new AppError('User not found.', 404));

    // Send welcome email
    await sendWelcomeEmail({ to: user.email, fullName: user.fullName, role: user.role });

    // Issue tokens
    const refreshToken = sendTokenResponse(user, 200, res, 'Email verified successfully! Welcome to Sports Club.');

    // Save hashed refresh token
    const salt = await bcrypt.genSalt(10);
    user.refreshToken = await bcrypt.hash(refreshToken, salt);
    await user.save({ validateBeforeSave: false });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/resend-otp
 * Resend email OTP
 */
exports.resendOTP = async (req, res, next) => {
  try {
    const { email, purpose = 'email_verification' } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return next(new AppError('No account found with this email.', 404));

    if (purpose === 'email_verification' && user.isEmailVerified) {
      return next(new AppError('Email is already verified.', 400));
    }

    await checkOTPCooldown(email, purpose);
    await sendEmailOTP(email, user.fullName, purpose);

    res.status(200).json({
      success: true,
      message: `A new OTP has been sent to ${email}.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Login for athlete, coach, or admin
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    const ip = req.ip || req.connection.remoteAddress;

    // Get user with password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +loginAttempts');

    // Check account locked (sliding window)
    if (user?.isAccountLocked()) {
      const lockedUntil = user.loginAttempts.lockedUntil;
      const secsRemaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      return next(
        new AppError(
          `Account temporarily locked due to too many failed attempts. Try again in ${Math.ceil(secsRemaining / 60)} minute(s).`,
          429
        )
      );
    }

    // Invalid credentials
    if (!user || !(await user.comparePassword(password))) {
      if (user) await user.incrementLoginAttempts();
      return next(new AppError('Invalid email or password.', 401));
    }

    // Role check
    if (role && user.role !== role) {
      return next(new AppError(`No ${role} account found with this email.`, 401));
    }

    // Account not active
    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Contact support.', 403));
    }

    // Email not verified
    if (!user.isEmailVerified) {
      // Resend OTP automatically
      await checkOTPCooldown(email, 'email_verification').catch(() => null);
      await sendEmailOTP(email, user.fullName, 'email_verification').catch(() => null);
      return next(
        new AppError(
          'Please verify your email before logging in. A new OTP has been sent.',
          403
        )
      );
    }

    // Success — reset attempts
    await user.resetLoginAttempts();
    await resetLoginLimit(ip, email);

    // Issue tokens
    const refreshToken = sendTokenResponse(user, 200, res, 'Login successful.');
    const salt = await bcrypt.genSalt(10);
    user.refreshToken = await bcrypt.hash(refreshToken, salt);
    await user.save({ validateBeforeSave: false });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/refresh-token
 * Refresh access token using refresh token
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return next(new AppError('Refresh token required.', 400));

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return next(new AppError('Invalid or expired refresh token.', 401));
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || !user.refreshToken) {
      return next(new AppError('Invalid session. Please log in again.', 401));
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isValid) return next(new AppError('Invalid refresh token.', 401));

    const newAccessToken = generateAccessToken(user._id, user.role);

    res.status(200).json({
      success: true,
      data: { accessToken: newAccessToken },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent user enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset OTP has been sent.',
      });
    }

    await checkOTPCooldown(email, 'password_reset');
    await sendEmailOTP(email, user.fullName, 'password_reset');

    res.status(200).json({
      success: true,
      message: 'Password reset OTP sent to your email address.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    await verifyOTP(email, otp, 'password_reset');

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return next(new AppError('User not found.', 404));

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please log in.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 */
exports.logout = async (req, res, next) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
    }
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
exports.getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: { user: req.user },
    });
  } catch (error) {
    next(error);
  }
};
