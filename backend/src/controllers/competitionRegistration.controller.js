const Competition = require('../models/Competition.model');
const CompetitionRegistration = require('../models/CompetitionRegistration.model');
const AthleteProfile = require('../models/AthleteProfile.model');
const CoachProfile = require('../models/CoachProfile.model');
const { AppError } = require('../utils/appError');

/**
 * GET /api/athletes/competitions
 * Get competitions the athlete has registered for
 */
exports.getMyRegistrations = async (req, res, next) => {
  try {
    const registrations = await CompetitionRegistration.find({
      athlete: req.user._id,
      status: 'Active',
    })
      .populate('competition', 'title description date venue registrationFee deadline status categories ageGroups')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: registrations });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/athletes/competitions/register
 * Register for a competition
 */
exports.registerForCompetition = async (req, res, next) => {
  try {
    const { competitionId } = req.body;
    if (!competitionId) return next(new AppError('Competition ID is required.', 400));

    // Check profile is approved based on role
    let isApproved = false;
    if (req.user.role === 'coach') {
      const profile = await CoachProfile.findOne({ user: req.user._id });
      if (!profile) return next(new AppError('Profile not found.', 404));
      isApproved = profile.profileStatus === 'Approved';
    } else {
      const profile = await AthleteProfile.findOne({ user: req.user._id });
      if (!profile) return next(new AppError('Profile not found.', 404));
      isApproved = profile.registrationStatus === 'Approved';
    }

    if (!isApproved) {
      return next(new AppError('Your profile must be approved before registering for competitions.', 403));
    }

    // Check competition exists and is open
    const competition = await Competition.findById(competitionId);
    if (!competition) return next(new AppError('Competition not found.', 404));
    if (competition.status === 'completed') return next(new AppError('This competition has ended.', 400));

    // Check deadline
    if (new Date() > new Date(competition.deadline)) {
      return next(new AppError('Registration deadline has passed.', 400));
    }

    // Check duplicate
    const existing = await CompetitionRegistration.findOne({
      athlete: req.user._id,
      competition: competitionId,
    });
    if (existing) {
      if (existing.status === 'Active') return next(new AppError('You are already registered for this competition.', 409));
      // Re-activate cancelled registration
      existing.status = 'Active';
      existing.paymentStatus = 'Pending';
      await existing.save();
      return res.status(200).json({
        success: true,
        message: 'Registration reactivated successfully.',
        data: existing,
      });
    }

    // Create registration
    const registration = await CompetitionRegistration.create({
      athlete: req.user._id,
      competition: competitionId,
      paymentAmount: competition.registrationFee,
    });

    const populated = await registration.populate('competition', 'title date venue registrationFee');

    res.status(201).json({
      success: true,
      message: 'Registered successfully! Payment pending.',
      data: populated,
    });
  } catch (err) {
    if (err.code === 11000) {
      return next(new AppError('You are already registered for this competition.', 409));
    }
    next(err);
  }
};

/**
 * DELETE /api/athletes/competitions/:registrationId
 * Cancel a registration
 */
exports.cancelRegistration = async (req, res, next) => {
  try {
    const registration = await CompetitionRegistration.findOne({
      _id: req.params.registrationId,
      athlete: req.user._id,
    });
    if (!registration) return next(new AppError('Registration not found.', 404));
    if (registration.paymentStatus === 'Paid') {
      return next(new AppError('Cannot cancel a paid registration. Contact admin for refund.', 400));
    }

    registration.status = 'Cancelled';
    await registration.save();

    res.status(200).json({ success: true, message: 'Registration cancelled.' });
  } catch (err) {
    next(err);
  }
};