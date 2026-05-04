const express = require('express');
const router  = express.Router();

const authController      = require('../controllers/auth/auth.controller');
const adminAuthController = require('../controllers/admin/adminAuth.controller');
const { protect }         = require('../middleware/auth.middleware');
const { slidingWindowLimiter } = require('../middleware/rateLimiter');
const User = require('../models/User.model');
const {
  validateRegister, validateLogin, validateAdminLogin,
  validateOTP, validateResetPassword,
} = require('../validators/auth.validator');

// ─── Public Routes ────────────────────────────────────────────────────────────
router.post('/register',         slidingWindowLimiter('signup'),      validateRegister,   authController.register);
router.post('/verify-email',     validateOTP,                                             authController.verifyEmail);
router.post('/resend-otp',                                                                authController.resendOTP);
router.post('/login',            slidingWindowLimiter('login'),       validateLogin,      authController.login);
router.post('/admin/login',      slidingWindowLimiter('admin_login'), validateAdminLogin, adminAuthController.adminLogin);
router.post('/forgot-password',                                                           authController.forgotPassword);
router.post('/reset-password',   validateResetPassword,                                  authController.resetPassword);
router.post('/refresh-token',                                                             authController.refreshToken);

// ─── Debounce check endpoints (email/mobile availability) ─────────────────────
router.post('/check/email', slidingWindowLimiter('signup'), async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ success: false, available: false, message: 'Email already registered' });
    res.status(200).json({ success: true, available: true });
  } catch (err) { next(err); }
});

router.post('/check/mobile', slidingWindowLimiter('signup'), async (req, res, next) => {
  try {
    const { mobile } = req.body;
    if (!mobile) return res.status(400).json({ success: false, message: 'Mobile required' });
    const exists = await User.findOne({ mobile });
    if (exists) return res.status(409).json({ success: false, available: false, message: 'Mobile number already registered' });
    res.status(200).json({ success: true, available: true });
  } catch (err) { next(err); }
});

// ─── Protected Routes ─────────────────────────────────────────────────────────
router.use(protect);
router.get('/me',      authController.getMe);
router.post('/logout', authController.logout);

module.exports = router;
