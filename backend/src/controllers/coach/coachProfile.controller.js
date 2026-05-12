const CoachProfile = require('../../models/CoachProfile.model');
const { AppError } = require('../../utils/appError');
const { getFileUrl, deleteFile } = require('../../services/upload.service');
const path = require('path');

//  GET /api/coaches/profile 
exports.getProfile = async (req, res, next) => {
  try {
    const profile = await CoachProfile.findOne({ user: req.user._id })
      .populate('user', 'fullName email mobile profilePhoto isEmailVerified');

    if (!profile) return next(new AppError('Profile not found.', 404));

    res.status(200).json({ success: true, data: { profile } });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/coaches/profile
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

// PATCH /api/coaches/profile/step/:step 
exports.updateProfileStep = async (req, res, next) => {
  try {
    const stepNum = parseInt(req.params.step, 10);
    if (isNaN(stepNum) || stepNum < 1 || stepNum > 5) {
      return next(new AppError('Invalid step number. Must be 1–5.', 400));
    }

    const profile = await CoachProfile.findOne({ user: req.user._id });
    if (!profile) return next(new AppError('Profile not found.', 404));

    if (stepNum > profile.formStep + 1) {
      return next(new AppError(`Please complete step ${profile.formStep} before skipping to step ${stepNum}.`, 400));
    }

    const body = req.body;
    switch (stepNum) {
      case 1:
        if (body.dateOfBirth !== undefined) profile.dateOfBirth = body.dateOfBirth;
        if (body.gender !== undefined) profile.gender = body.gender;
        if (body.specialization !== undefined) profile.specialization = Array.isArray(body.specialization) ? body.specialization : [body.specialization];
        if (body.experienceYears !== undefined) profile.experienceYears = body.experienceYears;
        if (body.bio !== undefined) profile.bio = body.bio;
        break;
      case 2:
        if (body.street || body.city || body.state || body.pinCode) {
          profile.address = {
            street: body.street || profile.address?.street,
            city: body.city || profile.address?.city,
            state: body.state || profile.address?.state,
            pinCode: body.pinCode || profile.address?.pinCode,
            country: body.country || 'India',
          };
        }
        break;
      case 3:
        if (body.clubName !== undefined) profile.clubName = body.clubName;
        if (body.stateAssociation !== undefined) profile.stateAssociation = body.stateAssociation;
        break;
      case 4:
        // Document upload handled separately
        break;
      case 5:
        // Declaration / Done
        break;
    }

    if (stepNum >= profile.formStep && stepNum < 5) {
      profile.formStep = stepNum + 1;
    }

    if (profile.formStep >= 4) {
      profile.profileStatus = 'Pending Review';
    } else {
      profile.profileStatus = 'Incomplete';
    }

    await profile.save();

    res.status(200).json({
      success: true,
      message: `Step ${stepNum} saved successfully.`,
      data: {
        profile,
        nextStep: Math.min(stepNum + 1, 5),
        formStep: profile.formStep,
        profileStatus: profile.profileStatus,
      },
    });
  } catch (err) {
    next(err);
  }
};

//  POST /api/coaches/profile/documents/:docType
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

//  DELETE /api/coaches/profile/documents/:docType 
exports.deleteDocument = async (req, res, next) => {
  try {
    const { docType } = req.params;
    const profile = await CoachProfile.findOne({ user: req.user._id });
    if (!profile) return next(new AppError('Profile not found.', 404));

    const ALLOWED = ['profilePhoto', 'idProof', 'certificationDoc'];
    if (ALLOWED.includes(docType) && profile.documents[docType]?.key) {
      deleteFile(path.join(__dirname, '../../../uploads/coaches/documents', profile.documents[docType].key));
      profile.documents[docType] = undefined;
      await profile.save();
    } else {
      return next(new AppError(`Cannot delete document of type: ${docType}`, 400));
    }

    res.status(200).json({ success: true, message: 'Document deleted.' });
  } catch (err) {
    next(err);
  }
};