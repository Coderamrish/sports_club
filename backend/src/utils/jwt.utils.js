const jwt = require('jsonwebtoken');

const generateAccessToken = (userId, role) =>
  jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });

const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET);

/**
 * Send tokens in response + return refreshToken for DB storage
 * @param {object} extraData - additional fields to merge into data (e.g. admin permissions)
 */
const sendTokenResponse = (user, statusCode, res, message = 'Success', extraData = {}) => {
  const accessToken  = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  const userData = {
    _id:               user._id,
    fullName:          user.fullName,
    email:             user.email,
    mobile:            user.mobile,
    role:              user.role,
    isEmailVerified:   user.isEmailVerified,
    isMobileVerified:  user.isMobileVerified,
    isProfileComplete: user.isProfileComplete,
    profilePhoto:      user.profilePhoto,
    // Admin-specific fields (undefined for non-admins, omitted by JSON)
    ...(user.role === 'admin' && {
      adminLevel:  user.adminLevel,
      permissions: user.permissions || [],
    }),
    ...extraData,
  };

  res.status(statusCode).json({
    success: true,
    message,
    data: { user: userData, accessToken, refreshToken },
  });

  return refreshToken;
};

module.exports = { generateAccessToken, generateRefreshToken, verifyRefreshToken, sendTokenResponse };
