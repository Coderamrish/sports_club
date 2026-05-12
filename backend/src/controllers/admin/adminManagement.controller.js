const User            = require('../../models/User.model');
const AthleteProfile  = require('../../models/AthleteProfile.model');
const CoachProfile    = require('../../models/CoachProfile.model');
const AuditLog        = require('../../models/AuditLog.model');
const Competition     = require('../../models/Competition.model');
const CompetitionRegistration = require('../../models/CompetitionRegistration.model');
const { AppError }    = require('../../utils/appError');
const { sendProfileStatusEmail, sendRegistrationApprovalEmail } = require('../../services/email.service');

//  GET /api/admin/dashboard

exports.getDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalAthletes,
      totalCoaches,
      pendingDocuments,
      approvedToday,
      rejectedDocs,
      pendingReview,
      approvedProfiles,
      incompleteProfiles,
      recentRegistrations,
    ] = await Promise.all([
      User.countDocuments({ role: 'athlete', isActive: true }),
      User.countDocuments({ role: 'coach',   isActive: true }),

      // Athletes with at least one doc in Pending status
      AthleteProfile.countDocuments({
        $or: [
          { 'documents.passportPhoto.status':    'Pending' },
          { 'documents.aadhaarCard.status':      'Pending' },
          { 'documents.birthCertificate.status': 'Pending' },
          { 'documents.schoolBonafide.status':   'Pending' },
          { 'nocClub.status':                    'Pending' },
          { 'nocStateAssociation.status':        'Pending' },
        ],
      }),

      // Approved today (verifiedAt today)
      AthleteProfile.countDocuments({
        registrationStatus: 'Approved',
        verifiedAt: { $gte: today },
      }),

      // Profiles with Rejected status
      AthleteProfile.countDocuments({ registrationStatus: 'Rejected' }),

      // Pending review
      AthleteProfile.countDocuments({ registrationStatus: 'Pending Review' }),

      // Approved total
      AthleteProfile.countDocuments({ registrationStatus: 'Approved' }),

      // Incomplete
      AthleteProfile.countDocuments({ registrationStatus: 'Incomplete' }),

      // Last 5 registrations
      User.find({ role: { $in: ['athlete', 'coach'] }, isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('fullName email role createdAt'),
    ]);

    // Insurance expiry tracking
    const expiredInsurance = await AthleteProfile.countDocuments({
      'insurance.status': 'Expired',
    });
    const missingInsurance = await AthleteProfile.countDocuments({
      'insurance.isRequired': true,
      'insurance.status': 'Missing',
    });

    const pendingCoaches = await CoachProfile.countDocuments({ profileStatus: 'Pending Review' });
    const pendingAthletes = await AthleteProfile.countDocuments({ registrationStatus: 'Pending Review' });
    const totalCompetitions = await Competition.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        totalAthletes,
        totalCoaches,
        totalCompetitions,
        pendingApprovals: pendingCoaches + pendingAthletes,
        pendingDocuments,
        approvedToday,
        rejectedDocs,
        pendingReview,
        approvedProfiles,
        incompleteProfiles,
        expiredInsurance,
        missingInsurance,
        recentRegistrations,
      },
    });
  } catch (err) {
    next(err);
  }
};

//  GET /api/admin/athletes  — list with filters + pagination

exports.listAthletes = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20,
      status, ageGroup, skillLevel, state,
      search, insuranceStatus,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build profile filter
    const profileFilter = {};
    if (status)          profileFilter.registrationStatus = status;
    if (ageGroup)        profileFilter.ageGroup           = ageGroup;
    if (skillLevel)      profileFilter.skillLevel         = skillLevel;
    if (state)           profileFilter['address.state']   = state;
    if (insuranceStatus) profileFilter['insurance.status']= insuranceStatus;

    // Build user filter for name/email search
    let userIds;
    if (search) {
      const matchedUsers = await User.find({
        role: 'athlete',
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { email:    { $regex: search, $options: 'i' } },
          { mobile:   { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      userIds = matchedUsers.map(u => u._id);
      if (userIds.length === 0) {
        return res.status(200).json({
          success: true,
          data: { athletes: [], pagination: { total: 0, page: 1, limit: parseInt(limit), totalPages: 0 } },
        });
      }
      profileFilter.user = { $in: userIds };
    }

    const [profiles, total] = await Promise.all([
      AthleteProfile.find(profileFilter)
        .populate('user', 'fullName email mobile createdAt isActive')
        .populate('verifiedBy', 'fullName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AthleteProfile.countDocuments(profileFilter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        athletes: profiles,
        pagination: {
          total,
          page:       parseInt(page),
          limit:      parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
//  GET /api/admin/athletes/:id  — single athlete detail

exports.getAthlete = async (req, res, next) => {
  try {
    const profile = await AthleteProfile.findOne({ user: req.params.id })
      .populate('user', 'fullName email mobile createdAt isActive isEmailVerified')
      .populate('verifiedBy', 'fullName email');

    if (!profile) return next(new AppError('Athlete not found.', 404));

    res.status(200).json({ success: true, data: { profile } });
  } catch (err) {
    next(err);
  }
};

//  PATCH /api/admin/athletes/:id/status  — approve / reject registration

exports.updateAthleteStatus = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    const VALID = ['Approved', 'Rejected', 'Pending Review', 'Incomplete'];
    if (!VALID.includes(status)) {
      return next(new AppError(`Invalid status. Must be one of: ${VALID.join(', ')}`, 400));
    }

    const profile = await AthleteProfile.findOne({ user: req.params.id }).populate('user', 'email fullName');
    if (!profile) return next(new AppError('Athlete not found.', 404));

    profile.registrationStatus = status;
    if (adminNotes) profile.adminNotes = adminNotes;
    if (status === 'Approved') {
      profile.verifiedBy = req.user._id;
      profile.verifiedAt = new Date();
    }

    await profile.save();

    // Send email notification to athlete
    if (profile.user.email) {
      sendProfileStatusEmail({
        to: profile.user.email,
        fullName: profile.user.fullName,
        role: 'athlete',
        status: status,
        adminNotes: adminNotes
      }).catch(err => console.error('Failed to send status email', err));
    }

    res.status(200).json({
      success: true,
      message: `Athlete registration ${status.toLowerCase()}.`,
      data: { registrationStatus: profile.registrationStatus },
    });
  } catch (err) {
    next(err);
  }
};
//  PATCH /api/admin/athletes/:id/documents/:docType
//  Approve or reject a specific document
exports.reviewDocument = async (req, res, next) => {
  try {
    const { id, docType } = req.params;
    const { status, adminNote } = req.body;

    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return next(new AppError('Status must be Approved, Rejected, or Pending.', 400));
    }

    const profile = await AthleteProfile.findOne({ user: id });
    if (!profile) return next(new AppError('Athlete not found.', 404));

    const SINGLE_DOCS = ['passportPhoto', 'aadhaarCard', 'birthCertificate', 'schoolBonafide'];
    const NOC_DOCS    = ['nocClub', 'nocStateAssociation'];

    if (SINGLE_DOCS.includes(docType)) {
      if (!profile.documents[docType]?.url) {
        return next(new AppError(`No ${docType} document uploaded yet.`, 400));
      }
      profile.documents[docType].status    = status;
      profile.documents[docType].adminNote = adminNote || '';
    } else if (NOC_DOCS.includes(docType)) {
      if (!profile[docType]?.url) {
        return next(new AppError(`No ${docType} uploaded yet.`, 400));
      }
      profile[docType].status = status;
    } else {
      return next(new AppError(`Unknown document type: ${docType}`, 400));
    }

    await profile.save();

    res.status(200).json({
      success: true,
      message: `${docType} marked as ${status}.`,
    });
  } catch (err) {
    next(err);
  }
};

//  GET /api/admin/coaches  — list coaches
exports.listCoaches = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search, specialization } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const profileFilter = {};
    if (status) profileFilter.profileStatus = status;
    if (specialization) profileFilter.specialization = { $in: [specialization] };

    if (search) {
      const matchedUsers = await User.find({
        role: 'coach',
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { email:    { $regex: search, $options: 'i' } },
          { mobile:   { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      if (matchedUsers.length === 0) {
        return res.status(200).json({
          success: true,
          data: { coaches: [], pagination: { total: 0, page: 1, limit: parseInt(limit), totalPages: 0 } },
        });
      }
      profileFilter.user = { $in: matchedUsers.map(u => u._id) };
    }

    const [profiles, total] = await Promise.all([
      CoachProfile.find(profileFilter)
        .populate('user', 'fullName email mobile createdAt isActive')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      CoachProfile.countDocuments(profileFilter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        coaches: profiles,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
      },
    });
  } catch (err) {
    next(err);
  }
};

//  GET /api/admin/coaches/:id  — single coach detail
exports.getCoach = async (req, res, next) => {
  try {
    const profile = await CoachProfile.findOne({ user: req.params.id })
      .populate('user', 'fullName email mobile createdAt isActive isEmailVerified');

    if (!profile) return next(new AppError('Coach not found.', 404));

    res.status(200).json({ success: true, data: { profile } });
  } catch (err) {
    next(err);
  }
};
//  PATCH /api/admin/coaches/:id/status

exports.updateCoachStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const VALID = ['Approved', 'Rejected', 'Pending Review', 'Incomplete'];
    if (!VALID.includes(status)) return next(new AppError('Invalid status.', 400));

    const profile = await CoachProfile.findOne({ user: req.params.id }).populate('user', 'email fullName');
    if (!profile) return next(new AppError('Coach not found.', 404));

    profile.profileStatus = status;
    await profile.save();

    // Send email notification to coach
    if (profile.user.email) {
      sendProfileStatusEmail({
        to: profile.user.email,
        fullName: profile.user.fullName,
        role: 'coach',
        status: status
      }).catch(err => console.error('Failed to send status email', err));
    }

    res.status(200).json({ success: true, message: `Coach profile ${status.toLowerCase()}.` });
  } catch (err) {
    next(err);
  }
};
//  Competition Registrations Management
exports.getCompetitionRegistrations = async (req, res, next) => {
  try {
    const { competitionId } = req.params;
    const registrations = await CompetitionRegistration.find({ competition: competitionId })
      .populate('athlete', 'fullName email mobile')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: registrations });
  } catch (err) {
    next(err);
  }
};

exports.updateRegistrationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const reg = await CompetitionRegistration.findById(id)
      .populate('competition', 'title date venue')
      .populate('athlete', 'fullName email');
    if (!reg) return next(new AppError('Registration not found.', 404));

    const prevStatus = reg.status;
    if (status) reg.status = status;
    if (paymentStatus) reg.paymentStatus = paymentStatus;

    await reg.save();

    // Send approval email when admin moves status to Active
    if (status === 'Active' && prevStatus !== 'Active' && reg.athlete?.email) {
      sendRegistrationApprovalEmail({
        to:               reg.athlete.email,
        fullName:         reg.athlete.fullName,
        competitionTitle: reg.competition?.title,
        competitionDate:  reg.competition?.date,
        venue:            reg.competition?.venue,
        paymentStatus:    reg.paymentStatus,
      }).catch(() => {}); // fire-and-forget
    }
    res.status(200).json({ success: true, message: 'Registration updated successfully.', data: reg });
  } catch (err) {
    next(err);
  }
};