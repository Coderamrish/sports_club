const express = require('express');
const router = express.Router();
const { protect, restrictTo, requireEmailVerified } = require('../middleware/auth.middleware');

// All athlete routes require authentication + email verification
router.use(protect, requireEmailVerified, restrictTo('athlete'));

// Profile routes (to be expanded in Day 2)
router.get('/profile', (req, res) => {
  res.status(200).json({ success: true, message: 'Athlete profile route — coming in Day 2', user: req.user._id });
});

module.exports = router;
