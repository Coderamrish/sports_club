const CoachProfile = require('../../models/CoachProfile.model');
const { AppError } = require('../../utils/appError');
const { getFileUrl, deleteFile } = require('../../services/upload.service');
const path = require('path');

// ─── GET /api/coaches/profile ─────────────────────────────────────────────
exports.getProfile = async (req, res, next) => {
   console.log('COACH ROLE:', req.user.role); 
  try {
    const profile = await CoachProfile.findOne({ user: req.user._id })
      .populate('user', 'fullName email mobile profilePhoto isEmailVerified');

    if (!profile) return next(new AppError('Profile not found.', 404));

    res.status(200).json({ success: true, data: { profile } });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/coaches/profile ───────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const {
      dateOfBirth, gender, specialization, experienceYears, bio,
      clubName, stateAssociation,
      street, city, state, pinCode, country,
    } = req.body;

    const profile = await CoachProfile.findOne({ user: req.user._id });
    if (!profile) return next(new AppError('Profile not found.', 404));

    if (dateOfBirth !== undefined) profile.dateOfBirth = dateOfBirth;
    if (gender !== undefined) profile.gender = gender;
    if (specialization !== undefined) profile.specialization = Array.isArray(specialization) ? specialization : [specialization];
    if (experienceYears !== undefined) profile.experienceYears = experienceYears;
    if (bio !== undefined) profile.bio = bio;
    if (clubName !== undefined) profile.clubName = clubName;
    if (stateAssociation !== undefined) profile.stateAssociation = stateAssociation;

    if (street || city || state || pinCode) {
      profile.address = { street, city, state, pinCode, country: country || 'India' };
    }

    // Update status
    const filled = [profile.gender, profile.specialization?.length, profile.experienceYears, profile.clubName];
    profile.profileStatus = filled.filter(Boolean).length >= 3 ? 'Pending Review' : 'Incomplete';

    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: { profile, profileStatus: profile.profileStatus },
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/coaches/profile/documents/:docType ────────────────────────
exports.uploadDocument = async (req, res, next) => {
  try {
    const { docType } = req.params;
    if (!req.file) return next(new AppError('No file uploaded.', 400));

    const profile = await CoachProfile.findOne({ user: req.user._id });
    if (!profile) return next(new AppError('Profile not found.', 404));

    const fileKey = req.file.filename;
    const fileUrl = getFileUrl(`coaches/documents/${fileKey}`);

    const ALLOWED = ['profilePhoto', 'idProof', 'certificationDoc'];
    if (!ALLOWED.includes(docType)) return next(new AppError(`Unknown doc type: ${docType}`, 400));

    profile.documents[docType] = {
      url: fileUrl, key: fileKey,
      ...(docType === 'idProof' ? { status: 'Pending' } : {}),
    };

    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Document uploaded.',
      data: { url: fileUrl, key: fileKey, docType },
    });
  } catch (err) {
    next(err);
  }
};