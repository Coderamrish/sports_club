const express = require('express');
const router = express.Router();
const { protect, restrictTo, requireEmailVerified } = require('../middleware/auth.middleware');
const { athleteDocUpload, profilePhotoUpload, handleMulterError } = require('../services/upload.service');
const athleteProfileController = require('../controllers/athlete/athleteProfile.controller');

// All athlete routes: must be logged in, email verified, role=athlete
router.use(protect, requireEmailVerified, restrictTo('athlete'));

// ── Profile ──────────────────────────────────────────────────────────────────
router.get('/profile',             athleteProfileController.getProfile);
router.patch('/profile/step/:step', athleteProfileController.updateProfileStep);

// ── Document uploads ─────────────────────────────────────────────────────────
// Single document types
router.post(
  '/profile/documents/:docType',
  athleteDocUpload.single('file'),
  handleMulterError,
  athleteProfileController.uploadDocument
);

// Delete a document
router.delete(
  '/profile/documents/:docType',
  athleteProfileController.deleteDocument
);

module.exports = router;