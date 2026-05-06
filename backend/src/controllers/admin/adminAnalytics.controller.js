const User                    = require('../../models/User.model');
const AthleteProfile          = require('../../models/AthleteProfile.model');
const CoachProfile            = require('../../models/CoachProfile.model');
const Competition             = require('../../models/Competition.model');
const CompetitionRegistration = require('../../models/CompetitionRegistration.model');
const Payment                 = require('../../models/payment.model');
// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/admin/analytics/overview
//  Full analytics: competitions, payments, athletes, coaches, certificates
// ─────────────────────────────────────────────────────────────────────────────
exports.getAnalyticsOverview = async (req, res, next) => {
  try {
    const now = new Date();

    // ── Competition analytics ──────────────────────────────────────────────────
    const allCompetitions = await Competition.find().lean();
    const competitionIds  = allCompetitions.map(c => c._id);

    // Registrations per competition with payment breakdown
    const registrationsAgg = await CompetitionRegistration.aggregate([
      { $match: { competition: { $in: competitionIds } } },
      {
        $group: {
          _id: '$competition',
          total:      { $sum: 1 },
          paid:       { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, 1, 0] } },
          pending:    { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Pending'] }, 1, 0] } },
          failed:     { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Failed'] }, 1, 0] } },
          approved:   { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } },
          gold:       { $sum: { $cond: [{ $eq: ['$medalWon', 'Gold'] }, 1, 0] } },
          silver:     { $sum: { $cond: [{ $eq: ['$medalWon', 'Silver'] }, 1, 0] } },
          bronze:     { $sum: { $cond: [{ $eq: ['$medalWon', 'Bronze'] }, 1, 0] } },
          withCert:   { $sum: { $cond: [{ $ne: ['$certificateUrl', null] }, 1, 0] } },
          present:    { $sum: { $cond: [{ $eq: ['$attendanceStatus', 'Present'] }, 1, 0] } },
        }
      }
    ]);
    const regByComp = {};
    registrationsAgg.forEach(r => { regByComp[r._id.toString()] = r; });

    const competitionData = allCompetitions.map(c => {
      const stats = regByComp[c._id.toString()] || {};
      return {
        _id:          c._id,
        title:        c.title,
        date:         c.date,
        venue:        c.venue,
        status:       c.status,
        categories:   c.categories || [],
        ageGroups:    c.ageGroups  || [],
        registrationFee: c.registrationFee,
        deadline:     c.deadline,
        totalRegistrations: stats.total    || 0,
        paidCount:          stats.paid     || 0,
        pendingCount:       stats.pending  || 0,
        failedCount:        stats.failed   || 0,
        approvedCount:      stats.approved || 0,
        gold:               stats.gold     || 0,
        silver:             stats.silver   || 0,
        bronze:             stats.bronze   || 0,
        certificatesIssued: stats.withCert || 0,
        presentCount:       stats.present  || 0,
        revenue: (stats.paid || 0) * c.registrationFee,
      };
    });

    // ── Sport/Category breakdown ───────────────────────────────────────────────
    const sportBreakdown = {};
    for (const comp of competitionData) {
      const cats = comp.categories.length ? comp.categories : ['Uncategorized'];
      cats.forEach(cat => {
        if (!sportBreakdown[cat]) {
          sportBreakdown[cat] = { sport: cat, totalRegistrations: 0, totalRevenue: 0, competitions: 0 };
        }
        sportBreakdown[cat].totalRegistrations += comp.totalRegistrations;
        sportBreakdown[cat].totalRevenue       += comp.revenue;
        sportBreakdown[cat].competitions       += 1;
      });
    }

    // ── Payment analytics ──────────────────────────────────────────────────────
    const paymentSummary = await Payment.aggregate([
      {
        $group: {
          _id:            '$status',
          count:          { $sum: 1 },
          totalAmount:    { $sum: '$amount' },
        }
      }
    ]);
    const paymentByType = await Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: '$entityType', count: { $sum: 1 }, total: { $sum: '$amount' } } }
    ]);

    // Monthly revenue trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyRevenue = await Payment.aggregate([
      { $match: { status: 'paid', paidAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id:   { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // ── Athlete analytics ──────────────────────────────────────────────────────
    const athleteStatusBreakdown = await AthleteProfile.aggregate([
      { $group: { _id: '$registrationStatus', count: { $sum: 1 } } }
    ]);
    const athleteByState = await AthleteProfile.aggregate([
      { $match: { 'address.state': { $ne: null, $ne: '' } } },
      { $group: { _id: '$address.state', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    const athleteByAgeGroup = await AthleteProfile.aggregate([
      { $match: { ageGroup: { $ne: null, $ne: '' } } },
      { $group: { _id: '$ageGroup', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // ── Coach analytics ────────────────────────────────────────────────────────
    const coachStatusBreakdown = await CoachProfile.aggregate([
      { $group: { _id: '$profileStatus', count: { $sum: 1 } } }
    ]);
    const coachBySpecialization = await CoachProfile.aggregate([
      { $unwind: '$specialization' },
      { $group: { _id: '$specialization', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // ── Certificate & Results ──────────────────────────────────────────────────
    const certStats = await CompetitionRegistration.aggregate([
      {
        $group: {
          _id:                 null,
          totalWithCert:       { $sum: { $cond: [{ $ne: ['$certificateUrl', null] }, 1, 0] } },
          goldMedals:          { $sum: { $cond: [{ $eq: ['$medalWon', 'Gold']   }, 1, 0] } },
          silverMedals:        { $sum: { $cond: [{ $eq: ['$medalWon', 'Silver'] }, 1, 0] } },
          bronzeMedals:        { $sum: { $cond: [{ $eq: ['$medalWon', 'Bronze'] }, 1, 0] } },
          participantsWithResult: { $sum: { $cond: [{ $ne: ['$medalWon', 'None'] }, 1, 0] } },
        }
      }
    ]);

    // Recent registrations for activity feed
    const recentRegistrations = await CompetitionRegistration.find()
      .populate('athlete', 'fullName email')
      .populate('competition', 'title date')
      .sort({ createdAt: -1 })
      .limit(15)
      .lean();

    // Total revenue
    const totalRevenuePaid = paymentSummary.find(p => p._id === 'paid')?.totalAmount || 0;
    const totalPending     = paymentSummary.find(p => p._id === 'created')?.totalAmount || 0;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalAthletes:     await User.countDocuments({ role: 'athlete', isActive: true }),
          totalCoaches:      await User.countDocuments({ role: 'coach', isActive: true }),
          totalCompetitions: allCompetitions.length,
          completedComps:    allCompetitions.filter(c => c.status === 'completed').length,
          upcomingComps:     allCompetitions.filter(c => c.status === 'upcoming').length,
          totalRevenue:      totalRevenuePaid,
          pendingRevenue:    totalPending,
          totalRegistrations: registrationsAgg.reduce((s, r) => s + r.total, 0),
          totalCertificates:  certStats[0]?.totalWithCert || 0,
        },
        competitionData,
        sportBreakdown: Object.values(sportBreakdown),
        payments: { summary: paymentSummary, byType: paymentByType, monthlyRevenue },
        athletes: { statusBreakdown: athleteStatusBreakdown, byState: athleteByState, byAgeGroup: athleteByAgeGroup },
        coaches:  { statusBreakdown: coachStatusBreakdown, bySpecialization: coachBySpecialization },
        medals:   certStats[0] || { totalWithCert: 0, goldMedals: 0, silverMedals: 0, bronzeMedals: 0 },
        recentRegistrations,
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/admin/analytics/export  — CSV export for different entities
// ─────────────────────────────────────────────────────────────────────────────
exports.exportAnalyticsCSV = async (req, res, next) => {
  try {
    const { type = 'registrations' } = req.query;

    let csvContent = '';
    let filename = '';

    if (type === 'registrations') {
      const regs = await CompetitionRegistration.find()
        .populate('athlete', 'fullName email mobile')
        .populate('competition', 'title date venue registrationFee categories')
        .sort({ createdAt: -1 })
        .lean();

      filename = 'competition_registrations.csv';
      const headers = ['Athlete Name','Email','Mobile','Competition','Date','Venue','Fee (₹)','Status','Payment Status','Medal','Certificate','Registered On'];
      csvContent  = headers.join(',') + '\n';
      regs.forEach(r => {
        csvContent += [
          `"${r.athlete?.fullName  || ''}"`,
          `"${r.athlete?.email     || ''}"`,
          `"${r.athlete?.mobile    || ''}"`,
          `"${r.competition?.title || ''}"`,
          r.competition?.date ? new Date(r.competition.date).toLocaleDateString('en-IN') : '',
          `"${r.competition?.venue || ''}"`,
          r.competition?.registrationFee || 0,
          r.status,
          r.paymentStatus,
          r.medalWon || 'None',
          r.certificateUrl ? 'Yes' : 'No',
          new Date(r.createdAt).toLocaleDateString('en-IN'),
        ].join(',') + '\n';
      });
    }

    else if (type === 'payments') {
      const payments = await Payment.find()
        .populate('user', 'fullName email')
        .sort({ createdAt: -1 })
        .lean();

      filename = 'payments.csv';
      const headers = ['User Name','Email','Amount (₹)','Type','Status','Transaction ID','Paid On'];
      csvContent  = headers.join(',') + '\n';
      payments.forEach(p => {
        csvContent += [
          `"${p.user?.fullName || ''}"`,
          `"${p.user?.email    || ''}"`,
          p.amount,
          p.entityType === 'competition_registration' ? 'Competition Fee' : 'Profile Fee',
          p.status,
          `"${p.razorpayPaymentId || p.razorpayOrderId || ''}"`,
          p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN') : 'Pending',
        ].join(',') + '\n';
      });
    }

    else if (type === 'athletes') {
      const profiles = await AthleteProfile.find()
        .populate('user', 'fullName email mobile createdAt')
        .lean();

      filename = 'athletes.csv';
      const headers = ['Full Name','Email','Mobile','Age Group','Skill Level','State','Club','Status','Documents','Registered On'];
      csvContent  = headers.join(',') + '\n';
      profiles.forEach(p => {
        const docsUploaded = Object.values(p.documents || {}).filter(d => d?.url).length;
        csvContent += [
          `"${p.user?.fullName || ''}"`,
          `"${p.user?.email    || ''}"`,
          `"${p.user?.mobile   || ''}"`,
          p.ageGroup   || '',
          p.skillLevel || '',
          `"${p.address?.state || ''}"`,
          `"${p.clubName || ''}"`,
          p.registrationStatus,
          `${docsUploaded} uploaded`,
          p.user?.createdAt ? new Date(p.user.createdAt).toLocaleDateString('en-IN') : '',
        ].join(',') + '\n';
      });
    }

    else if (type === 'coaches') {
      const profiles = await CoachProfile.find()
        .populate('user', 'fullName email mobile createdAt')
        .lean();

      filename = 'coaches.csv';
      const headers = ['Full Name','Email','Mobile','Specialization','Experience (yrs)','Club/Academy','State Assoc.','Status','Registered On'];
      csvContent  = headers.join(',') + '\n';
      profiles.forEach(p => {
        csvContent += [
          `"${p.user?.fullName || ''}"`,
          `"${p.user?.email    || ''}"`,
          `"${p.user?.mobile   || ''}"`,
          `"${(p.specialization || []).join('; ')}"`,
          p.experienceYears || 0,
          `"${p.clubName || ''}"`,
          `"${p.stateAssociation || ''}"`,
          p.profileStatus,
          p.user?.createdAt ? new Date(p.user.createdAt).toLocaleDateString('en-IN') : '',
        ].join(',') + '\n';
      });
    }

    else if (type === 'competitions') {
      const comps = await Competition.find().lean();
      const regsAgg = await CompetitionRegistration.aggregate([
        { $group: { _id: '$competition', total: { $sum: 1 }, paid: { $sum: { $cond: [{ $eq: ['$paymentStatus','Paid'] }, 1, 0] } } } }
      ]);
      const regMap = {};
      regsAgg.forEach(r => { regMap[r._id.toString()] = r; });

      filename = 'competitions.csv';
      const headers = ['Title','Date','Venue','Status','Fee (₹)','Categories','Age Groups','Deadline','Total Registrations','Paid Registrations','Revenue (₹)'];
      csvContent  = headers.join(',') + '\n';
      comps.forEach(c => {
        const stats = regMap[c._id.toString()] || {};
        csvContent += [
          `"${c.title}"`,
          new Date(c.date).toLocaleDateString('en-IN'),
          `"${c.venue}"`,
          c.status,
          c.registrationFee,
          `"${(c.categories || []).join('; ')}"`,
          `"${(c.ageGroups  || []).join('; ')}"`,
          new Date(c.deadline).toLocaleDateString('en-IN'),
          stats.total || 0,
          stats.paid  || 0,
          (stats.paid || 0) * c.registrationFee,
        ].join(',') + '\n';
      });
    }

    else if (type === 'certificates') {
      const regs = await CompetitionRegistration.find({ medalWon: { $ne: 'None' } })
        .populate('athlete', 'fullName email')
        .populate('competition', 'title date venue')
        .sort({ publishedAt: -1 })
        .lean();

      filename = 'certificates_winners.csv';
      const headers = ['Athlete Name','Email','Competition','Date','Venue','Medal','Certificate URL','Published On'];
      csvContent  = headers.join(',') + '\n';
      regs.forEach(r => {
        csvContent += [
          `"${r.athlete?.fullName  || ''}"`,
          `"${r.athlete?.email     || ''}"`,
          `"${r.competition?.title || ''}"`,
          r.competition?.date ? new Date(r.competition.date).toLocaleDateString('en-IN') : '',
          `"${r.competition?.venue || ''}"`,
          r.medalWon,
          `"${r.certificateUrl || 'Not Generated'}"`,
          r.publishedAt ? new Date(r.publishedAt).toLocaleDateString('en-IN') : 'Pending',
        ].join(',') + '\n';
      });
    }

    else {
      return res.status(400).json({ success: false, message: 'Invalid export type' });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  PATCH /api/admin/analytics/registrations/:id/result
//  Assign medal + certificate URL to a registration
// ─────────────────────────────────────────────────────────────────────────────
exports.updateRegistrationResult = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { medalWon, certificateUrl, attendanceStatus } = req.body;

    const reg = await CompetitionRegistration.findById(id)
      .populate('athlete', 'fullName email')
      .populate('competition', 'title date');
    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });

    if (medalWon)          reg.medalWon          = medalWon;
    if (certificateUrl)    reg.certificateUrl     = certificateUrl;
    if (attendanceStatus)  reg.attendanceStatus   = attendanceStatus;
    if (medalWon || certificateUrl) reg.publishedAt = new Date();

    await reg.save();
    res.status(200).json({ success: true, message: 'Result updated', data: reg });
  } catch (err) {
    next(err);
  }
};