const AthleteProfile = require('../../models/AthleteProfile.model');
const User = require('../../models/User.model');
const { AppError } = require('../../utils/appError');
const { getFileUrl, deleteFile } = require('../../services/upload.service');
const path = require('path');


//  GET /api/athletes/profile

exports.getProfile = async (req, res, next) => {
  try {
    const profile = await AthleteProfile.findOne({ user: req.user._id })
      .populate('user', 'fullName email mobile profilePhoto isEmailVerified');

    if (!profile) {
      return next(new AppError('Profile not found.', 404));
    }

    res.status(200).json({
      success: true,
      data: { profile },
    });
  } catch (err) {
    next(err);
  }
};

//  PATCH /api/athletes/profile/step/:step
//  Step 1 – Personal Details
//  Step 2 – Parent / Guardian
//  Step 3 – Address
//  Step 4 – Club / Representation
//  Step 5 – Competition Details
//  Step 6 – Document Upload (handled separately via upload routes)
//  Step 7 – Declaration (boolean flag)
//  Step 8 – Payment (stub — returns payment intent)

exports.updateProfileStep = async (req, res, next) => {
  try {
    const stepNum = parseInt(req.params.step, 10);
    if (isNaN(stepNum) || stepNum < 1 || stepNum > 8) {
      return next(new AppError('Invalid step number. Must be 1–8.', 400));
    }

    const profile = await AthleteProfile.findOne({ user: req.user._id });
    if (!profile) return next(new AppError('Profile not found.', 404));

    // Only allow updating the current or previous steps (prevent skipping)
    if (stepNum > profile.formStep + 1) {
      return next(new AppError(`Please complete step ${profile.formStep} before skipping to step ${stepNum}.`, 400));
    }

    const stepUpdates = buildStepUpdate(stepNum, req.body);
    Object.assign(profile, stepUpdates);

    // Advance formStep if moving forward
    if (stepNum >= profile.formStep && stepNum < 8) {
      profile.formStep = stepNum + 1;
    }

    // Update registration status based on progress
    profile.registrationStatus = deriveStatus(profile);

    await profile.save();

    res.status(200).json({
      success: true,
      message: `Step ${stepNum} saved successfully.`,
      data: {
        profile,
        nextStep: Math.min(stepNum + 1, 8),
        formStep: profile.formStep,
        registrationStatus: profile.registrationStatus,
      },
    });
  } catch (err) {
    next(err);
  }
};
/*
 POST /api/athletes/profile/documents/:docType
  docType: passportPhoto | aadhaarCard | birthCertificate | schoolBonafide |
          medicalFitness | nocClub | nocStateAssociation | achievementCert
*/
exports.uploadDocument = async (req, res, next) => {
  try {
    const { docType } = req.params;

    if (!req.file) {
      return next(new AppError('No file uploaded.', 400));
    }

    const profile = await AthleteProfile.findOne({ user: req.user._id });
    if (!profile) return next(new AppError('Profile not found.', 404));

    const fileKey = req.file.filename;
    const fileUrl = getFileUrl(`athletes/documents/${fileKey}`);
    const uploadedAt = new Date();

    const SINGLE_DOCS = [
      'passportPhoto', 'aadhaarCard', 'birthCertificate',
      'schoolBonafide', 'medicalFitness',
    ];
    const NOC_DOCS = ['nocClub', 'nocStateAssociation'];

    if (SINGLE_DOCS.includes(docType)) {
      // Delete old file from disk if it exists
      if (profile.documents[docType]?.key) {
        deleteFile(path.join(__dirname, '../../../uploads/athletes/documents', profile.documents[docType].key));
      }
      profile.documents[docType] = { url: fileUrl, key: fileKey, uploadedAt, status: 'Pending' };

    } else if (NOC_DOCS.includes(docType)) {
      if (profile[docType]?.key) {
        deleteFile(path.join(__dirname, '../../../uploads/athletes/documents', profile[docType].key));
      }
      profile[docType] = { url: fileUrl, key: fileKey, uploadedAt, status: 'Pending' };

    } else if (docType === 'achievementCert') {
      profile.documents.achievementCertificates.push({
        url: fileUrl, key: fileKey,
        name: req.body.name || 'Certificate',
        uploadedAt,
      });
    } else {
      return next(new AppError(`Unknown document type: ${docType}`, 400));
    }

    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully.',
      data: { url: fileUrl, key: fileKey, docType },
    });
  } catch (err) {
    next(err);
  }
};
//  DELETE /api/athletes/profile/documents/:docType

exports.deleteDocument = async (req, res, next) => {
  try {
    const { docType } = req.params;
    const profile = await AthleteProfile.findOne({ user: req.user._id });
    if (!profile) return next(new AppError('Profile not found.', 404));

    const SINGLE_DOCS = ['passportPhoto', 'aadhaarCard', 'birthCertificate', 'schoolBonafide', 'medicalFitness'];

    if (SINGLE_DOCS.includes(docType) && profile.documents[docType]?.key) {
      deleteFile(path.join(__dirname, '../../../uploads/athletes/documents', profile.documents[docType].key));
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

//  Helpers

function buildStepUpdate(step, body) {
  switch (step) {
    case 1:
      return {
        dateOfBirth: body.dateOfBirth,
        gender: body.gender,
        bloodGroup: body.bloodGroup,
      };
    case 2:
      return {
        fatherName: body.fatherName,
        motherName: body.motherName,
        guardianName: body.guardianName,
        parentMobile: body.parentMobile,
        parentEmail: body.parentEmail,
      };
    case 3:
      return {
        address: {
          street: body.street,
          landmark: body.landmark,
          city: body.city,
          district: body.district,
          state: body.state,
          pinCode: body.pinCode,
          country: body.country || 'India',
        },
      };
    case 4:
      return {
        clubName: body.clubName,
        stateRepresentation: body.stateRepresentation,
        districtRepresentation: body.districtRepresentation,
      };
    case 5:
      return {
        ageGroup: body.ageGroup,
        skillLevel: body.skillLevel,
      };
    case 6:
      // Documents handled via separate upload endpoints
      return {};
    case 7:
      // Declaration — just advance the step
      return {};
    case 8:
      // Payment stub
      return {};
    default:
      return {};
  }
}

function deriveStatus(profile) {
  if (profile.formStep <= 2) return 'Incomplete';
  if (profile.formStep >= 6) return 'Pending Review';
  return 'Incomplete';
}