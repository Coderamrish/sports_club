const express = require('express');
const router = express.Router();
const { protect, restrictTo, requireEmailVerified } = require('../middleware/auth.middleware');

router.use(protect, requireEmailVerified, restrictTo('coach'));

router.get('/profile', (req, res) => {
  res.status(200).json({ success: true, message: 'Coach profile route — coming in Day 2' });
});

module.exports = router;
