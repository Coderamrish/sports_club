const express = require('express');
const router = express.Router();
const { protect, restrictTo, requireEmailVerified } = require('../middleware/auth.middleware');
const { coachDocUpload, profilePhotoUpload, handleMulterError } = require('../services/upload.service');
const coachProfileController = require('../controllers/coach/coachProfile.controller');

router.use(protect, requireEmailVerified, restrictTo('coach'));

// ── Profile ──────────────────────────────────────────────────────────────────
router.get('/profile',  coachProfileController.getProfile);
router.patch('/profile', coachProfileController.updateProfile);

// ── Document uploads ─────────────────────────────────────────────────────────
router.post(
  '/profile/documents/:docType',
  coachDocUpload.single('file'),
  handleMulterError,
  coachProfileController.uploadDocument
);

module.exports = router;