const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { AppError } = require('../utils/appError');

/**
 * Protect routes — verify JWT and attach user to request
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(new AppError('Not authenticated. Please log in.', 401));
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Your session has expired. Please log in again.', 401));
      }
      return next(new AppError('Invalid token. Please log in again.', 401));
    }

    // Check user still exists and is active
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || !user.isActive) {
      return next(new AppError('User no longer exists or has been deactivated.', 401));
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based access control
 * Usage: restrictTo('admin'), restrictTo('athlete', 'coach')
 */
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(
      new AppError(`Access denied. This route is restricted to: ${roles.join(', ')}.`, 403)
    );
  }
  next();
};

/**
 * Require email to be verified before accessing a route
 */
const requireEmailVerified = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return next(
      new AppError('Please verify your email address to access this feature.', 403)
    );
  }
  next();
};

module.exports = { protect, restrictTo, requireEmailVerified };
